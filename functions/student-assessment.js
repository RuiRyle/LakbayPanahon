'use strict';

const {
  randomUUID,
  createHash,
  randomInt
} = require('node:crypto');
class AssessmentError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}
const fail = code => {
  throw new AssessmentError(code);
};
const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
const uuid = x => typeof x === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
const id = x => typeof x === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(x);
const exact = (x, keys) => object(x) && Object.keys(x).every(k => keys.includes(k));
const integer = (x, min = 0, max = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(x) && x >= min && x <= max;
const canonical = x => Array.isArray(x) ? x.map(canonical) : object(x) ? Object.fromEntries(Object.keys(x).sort().map(k => [k, canonical(x[k])])) : x;
const digest = x => createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');
const active = x => x?.status === 'active';
const complete = (x, uid) => x?.userId === uid && x.completed === true;
const own = (uid, key) => uid + '_' + key;
const normalize = x => typeof x === 'string' ? x.trim().toUpperCase() : '';
const modules = Promise.all(['mission-assessment', 'daily-policy', 'progression-policy', 'mission-review'].map(n => import('./assessment-shared/' + n + '.mjs'))).then(rows => Object.assign({}, ...rows));
function mark(q, a) {
  if (q.evidenceTask) return exact(a, ['gameType', 'evidenceId', 'conclusion']) && a.gameType === 'evidenceDecision' && a.evidenceId === q.evidenceTask.correctEvidenceId && a.conclusion === normalize(q.correctAnswer);
  if (q.gameType === 'matching') return exact(a, ['gameType', 'matches']) && a.gameType === 'matching' && object(a.matches) && q.matchingPairs?.length > 0 && Object.keys(a.matches).length === q.matchingPairs.length && q.matchingPairs.every(p => a.matches[p.left] === p.right);
  if (q.gameType === 'tradeSimulation') return exact(a, ['gameType', 'quantity']) && a.gameType === 'tradeSimulation' && a.quantity === Number(q.requiredQuantity);
  if (!['A', 'B', 'C', 'D'].includes(normalize(a))) fail('assessment/invalid-answer');
  return normalize(a) === normalize(q.correctAnswer);
}
function publicQuestion(q, feedback = false) {
  const out = {};
  for (const key of ['id', 'question', 'optionA', 'optionB', 'optionC', 'optionD', 'topic', 'topicLabel', 'difficulty', 'gameType', 'instructions', 'startingQuantity', 'rewardQuantity', 'tradeGood', 'rewardGood', 'matchingLeft', 'matchingRight', 'order']) if (q[key] !== undefined) out[key] = q[key];
  if(q.gameType==='matching'&&Array.isArray(q.matchingPairs)){out.matchingLeft=q.matchingPairs.map(pair=>pair.left);out.matchingRight=q.matchingPairs.map(pair=>pair.right).sort();}
  if (q.evidenceTask) out.evidenceTask = {
    instructions: q.evidenceTask.instructions,
    cards: q.evidenceTask.cards
  };
  if (feedback) for (const key of ['correctAnswer', 'explanation', 'learningPoint', 'historicalClue', 'answerExplanations', 'matchingPairs', 'requiredQuantity', 'evidenceTask']) if (q[key] !== undefined) out[key] = q[key];
  return out;
}
function levels(bank) {
  const order = ['easy', 'medium', 'hard'];
  return [...new Set(bank.map(q => String(q.difficulty || '').trim().toLowerCase()).filter(Boolean))].sort((a, b) => (order.indexOf(a) < 0 ? 99 : order.indexOf(a)) - (order.indexOf(b) < 0 ? 99 : order.indexOf(b)) || a.localeCompare(b));
}
function followupLevels(policy,bank){
  if(Array.isArray(policy.difficultyLevels)&&policy.difficultyLevels.length)return [...new Set(policy.difficultyLevels.map(value=>String(value||'').trim().toLowerCase()).filter(Boolean))];
  const available=new Set(levels(bank));return ['easy','medium','hard'].filter(level=>available.has(level));
}
function target(policy, available, mastery = {}, weak = false) {
  const states = Object.values(mastery),
    attempted = states.reduce((n, s) => n + (s.attempted || 0), 0),
    correct = states.reduce((n, s) => n + (s.correct || 0), 0);
  let wanted = weak || states.some(s => s.missed > 0) ? policy.reviewDifficulty : policy.startDifficulty;
  if (!weak && attempted) {
    if (correct / attempted >= policy.promoteAccuracy) wanted = available.at(-1);else if (correct / attempted <= policy.demoteAccuracy) wanted = available[0];
  }
  return available.includes(wanted) ? wanted : weak ? available[0] : available[Math.floor((available.length - 1) / 2)];
}
// Admin transaction adapter queues every write until the callback finishes reads.
function assessmentStore(db, timestamp) {
  return {
    run: fn => db.runTransaction(async transaction => {
      const writes = [],
        tx = {
          get: async p => {
            const s = await transaction.get(db.doc(p));
            return s.exists ? s.data() : null;
          },
        list: async (c, k, v,filters=[]) => {
          let query=db.collection(c).where(k,'==',v);
          for(const [field,value] of filters)query=query.where(field,'==',value);
          const s = await transaction.get(query.limit(1001));
            if (s.size > 1000) fail('assessment/catalog-limit');
            return s.docs.map(d => ({
              ...d.data(),
              id: d.id
            }));
          },
          stamp: timestamp,
          create: (p, d) => writes.push(() => transaction.create(db.doc(p), d)),
          set: (p, d) => writes.push(() => transaction.set(db.doc(p), d)),
          update: (p, d) => writes.push(() => transaction.update(db.doc(p), d))
        };
      const result = await fn(tx);
      for (const write of writes) write();
      return result;
    })
  };
}
function createAssessmentService(store, {
  clock = Date.now,
  newId = randomUUID,
  random = () => randomInt(0, 0x100000000) / 0x100000000
} = {}) {
  async function transact(uid, callback) {
    if(typeof uid!=='string'||!uid||uid.length>128||uid.trim()!==uid||/[\/\u0000-\u001f]/.test(uid))fail('assessment/unauthenticated');
    const shared = await modules;
    return store.run(async tx => {
      const profile = await tx.get('users/' + uid);
      if (profile?.role !== 'student' || profile.status !== 'active') fail('assessment/forbidden');
      const policy = await tx.get('learningSettings/securedAssessment');
      if (policy?.enabled !== true || policy.protocolVersion !== 1 || !integer(policy.attemptTtlSeconds, 60, 86400) || !integer(policy.perStudentDailyAttempts, 1, 1000) || !integer(policy.perMinuteAttempts, 1, 100)) fail('assessment/not-active');
      return callback(tx, profile, policy, shared);
    });
  }
  async function verificationContext(tx, uid, input, shared) {
    const kind = input.kind;
    if (!['mission', 'chapter', 'daily'].includes(kind)) fail('assessment/invalid-request');
    if (kind === 'daily') {
      const bank = await tx.list('dailyChallenges', 'status', 'active'),
        activity = shared.selectDailyChallenge(bank, new Date(clock()));
      if (!activity || activity.id !== input.challengeId) fail('assessment/content-changed');
      if (!integer(activity.xpReward)) fail('assessment/content-unavailable');
      return {
        activity,
        bank: [activity],
        practice: [],
        collection: 'dailyChallenges',
        threshold: 100,
        reward: activity.xpReward,
        mastery: {},
        seen: [],
        previous: [],
        seenAdaptive: []
      };
    }
    if (!id(input.chapterId) || kind === 'mission' && !id(input.missionId)) fail('assessment/invalid-request');
    const chapter = await tx.get('chapters/' + input.chapterId);
    if (!active(chapter) || chapter.contentReady === false || !id(chapter.eraId) || !Number.isFinite(chapter.order)) fail('assessment/content-unavailable');
    const era = await tx.get('eras/' + chapter.eraId),
      chapters = (await tx.list('chapters', 'eraId', chapter.eraId)).filter(c => active(c) && c.contentReady !== false),
      missions = (await tx.list('missions', 'chapterId', input.chapterId)).filter(active).sort((a, b) => a.order - b.order);
    if (!active(era) || !Array.isArray(era.requiredChapterIds) || !missions.length || missions.some(m => !Number.isFinite(m.order)) || chapters.some(c => !Number.isFinite(c.order)) || new Set(missions.map(m => m.order)).size !== missions.length) fail('assessment/content-unavailable');
    const mission = kind === 'mission' ? missions.find(m => m.id === input.missionId) : null;
    if (kind === 'mission' && !mission) fail('assessment/content-unavailable');
    const ownMission = mission ? await tx.get('studentProgress/' + own(uid, mission.id)) : null,
      ownChapter = await tx.get('studentChapterProgress/' + own(uid, input.chapterId));
    const reviewing = complete(ownMission, uid) || complete(ownChapter, uid);
    if (!reviewing) for (const required of new Set([...era.requiredChapterIds, ...chapters.filter(c => c.order < chapter.order && c.requiredForProgression !== false).map(c => c.id)])) {
      if (!id(required) || !complete(await tx.get('studentChapterProgress/' + own(uid, required)), uid)) fail('assessment/locked');
    }
    for (const prior of kind === 'chapter' ? missions : reviewing ? [] : missions.filter(m => m.order < mission.order)) if (!complete(await tx.get('studentProgress/' + own(uid, prior.id)), uid)) fail('assessment/locked');
    const activityId = kind === 'mission' ? input.quizId : input.challengeId;
    if (!id(activityId)) fail('assessment/invalid-request');
    const collection = kind === 'mission' ? 'questions' : 'chapterChallengeQuestions',
      activity = await tx.get((kind === 'mission' ? 'quizzes/' : 'chapterChallenges/') + activityId);
    if (!active(activity) || (kind === 'mission' ? activity.missionId !== mission.id : activity.chapterId !== input.chapterId) || !Number.isFinite(activity.passingScore) || activity.passingScore < 0 || activity.passingScore > 100) fail('assessment/content-unavailable');
    activity.id = activityId;
    const bank = (await tx.list(collection, kind === 'mission' ? 'quizId' : 'challengeId', activityId)).filter(active).sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0) || a.id.localeCompare(b.id));
    if (!bank.length || bank.length > 400) fail('assessment/content-unavailable');
    for (const q of bank) {
      if (q.gameType === 'matching') {
        if (!Array.isArray(q.matchingPairs) || !q.matchingPairs.length) fail('assessment/content-unavailable');
      } else if (q.gameType === 'tradeSimulation') {
        if (!integer(Number(q.requiredQuantity), 1)) fail('assessment/content-unavailable');
      } else if (!['A', 'B', 'C', 'D'].includes(normalize(q.correctAnswer))) fail('assessment/content-unavailable');
    }
    if (kind === 'mission') {
      shared.requireMissionPolicy(activity);
      if (activity.questionCount !== 5) fail('assessment/content-unavailable');
    }
    const practice = kind === 'mission' ? (await tx.list('practiceQuestions', 'missionId', mission.id)).filter(active).sort((a, b) => a.id.localeCompare(b.id)) : [];
    if (mission && !integer(mission.xpReward)) fail('assessment/content-unavailable');
    const classroom=await verifyClassroom(tx,uid,input);
    return {chapter,mission,activity,bank,practice,collection,threshold:activity.passingScore,reward:mission?mission.xpReward:0,classroom};
  }
  async function verifyClassroom(tx,uid,input){
    if(!input.classroom)return null;
    const request=input.classroom;
    if(input.kind!=='mission'||!id(request.classId)||!id(request.assignmentId))fail('assessment/classroom-unavailable');
    const [classroom,member,normalAssignment]=await Promise.all([tx.get('classes/'+request.classId),tx.get('classMembers/'+own(uid,request.classId)),tx.get('classAssignments/'+request.assignmentId)]);
    const assignment=normalAssignment||await tx.get('classReviewAssignments/'+request.assignmentId);
    const millis=value=>value?.toMillis?.(),stamp=value=>Number.isInteger(value?.seconds)&&Number.isInteger(value?.nanoseconds)?value.seconds+':'+value.nanoseconds:'ms:'+millis(value);
    const joined=millis(member?.joinedAt),assigned=millis(normalAssignment?assignment?.publishedAt:assignment?.assignedAt),version=assignment?.submissionVersion??1;
    if(!active(classroom)||member?.userId!==uid||member.classId!==request.classId||!active(member)||assignment?.status!=='published'||
      assignment.classId!==request.classId||assignment.chapterId!==input.chapterId||assignment.missionId!==input.missionId||
      (!normalAssignment&&assignment.userId!==uid)||
      !Number.isFinite(joined)||!Number.isFinite(assigned)||joined<=0||assigned<=0||Math.max(joined,assigned)>=clock()||!integer(version,1))fail('assessment/classroom-unavailable');
    const context={classId:request.classId,assignmentId:request.assignmentId,version,joinedAtKey:stamp(member.joinedAt),joinedAt:joined,assignedAt:assigned,issuedAt:input.issuedAt??clock()};
    if(input.issuedAt!==undefined&&(request.version!==context.version||request.joinedAtKey!==context.joinedAtKey||request.assignedAt!==context.assignedAt||input.issuedAt<=Math.max(joined,assigned)))fail('assessment/classroom-changed');
    return context;
  }
  async function issuanceContext(tx, uid, input, shared) {
    const ctx = await verificationContext(tx, uid, input, shared);
    if (input.kind !== 'mission') return {...ctx,mastery:{},seen:[],previous:[],seenAdaptive:[]};
    const {mission,practice}=ctx;
    const history = await tx.get('serverAssessmentHistory/' + own(uid, mission.id));
    if (history && history.userId !== uid) fail('assessment/record-conflict');
    // Practice/review evidence only influences learning support, never reward
    // eligibility. Canonical quiz attempts cannot be authored by students.
    const past = mission ? await tx.list('studentQuizAttempts', 'userId', uid,[['missionId',mission.id]]) : [];
    const sessions = mission ? await tx.list('studentPracticeProgress', 'userId', uid,[['missionId',mission.id]]) : [];
    const events = mission ? await tx.list('studentReviewEvents', 'userId', uid,[['missionId',mission.id]]) : [];
    const mastery = Object.fromEntries(shared.missionTopicStates(past, sessions, practice, events, clock()).filter(s => s.missionId === mission?.id).map(s => [s.topic, {
      attempted: s.attempted,
      correct: s.correct,
      missed: s.missed,
      state: s.state
    }]));
    return {
      ...ctx,
      mastery,
      attemptNumber:past.length+1,
      seen: [...new Set([...(history?.seenQuestionIds || []), ...past.flatMap(a => a.questionIds || [])])],
      previous: history?.lastQuestionIds || past.sort((a, b) => (b.completedAt?.toMillis?.() || 0) - (a.completedAt?.toMillis?.() || 0))[0]?.questionIds || [],
      seenAdaptive: [...new Set([...(history?.seenAdaptiveIds || []), ...past.flatMap(a => a.response?.adaptiveFollowup?.questionIds || [])])]
    };
  }
  const contentVersion = ctx => digest({
    activity: ctx.activity,
    bank: ctx.bank,
    practice: ctx.practice,
    reward: ctx.reward
  });
  // Receipts are private, server-owned results. Check their internal evidence
  // rather than re-reading a catalog that may have changed since commit.
  function validateReceipt(a,shared) {
    const r=a.result;
    if(!['mission','chapter','daily'].includes(a.kind)||!Array.isArray(a.questions)||!a.questions.length||
       (a.kind==='mission'&&a.questions.length!==5)||!object(a.answers)||
       new Set(a.questions.map(q=>q.id)).size!==a.questions.length||
       a.questions.some(q=>!id(q.id)||!Object.hasOwn(a.answers,q.id))||Object.keys(a.answers).length!==a.questions.length||
       !Array.isArray(a.followups)||!object(a.followupAnswers)||
       !integer(a.followupLimit,0,3)||a.followups.length!==a.followupLimit||
       (a.kind==='mission'&&a.followupLimit>0&&!a.followupStarted)||
       !Number.isFinite(a.threshold)||a.threshold<0||a.threshold>100||
       !Number.isFinite(a.submittedAt)||!object(r))fail('assessment/record-conflict');
    let correct;
    try{correct=a.questions.filter(q=>mark(q,a.answers[q.id])).length;}catch{fail('assessment/record-conflict');}
    const score=Math.round(correct/a.questions.length*100),passed=score>=a.threshold;
    if(r.score!==score||r.correctAnswers!==correct||r.totalQuestions!==a.questions.length||r.passed!==passed||
       typeof r.firstCompletion!=='boolean'||!integer(r.xpReward)||!integer(r.totalXp)||r.totalXp<r.xpReward||
       (!r.firstCompletion&&r.xpReward!==0)||(!passed&&(r.firstCompletion||r.xpReward!==0))||
       (a.kind==='chapter'&&r.xpReward!==0)||!Number.isFinite(r.bestScore)||r.bestScore<score||r.bestScore>100||
       !integer(r.level,1)||!integer(r.learningStreak)||!Array.isArray(r.topicsForReview)||!Array.isArray(r.reviewQuestions)||
       digest(r.reviewQuestions)!==digest(a.questions.map(q=>publicQuestion(q,true)))||
       !object(r.artifactResult)||!object(r.badgeResult))fail('assessment/record-conflict');
    const review=[...new Set([...a.followups.filter(q=>!mark(q,a.followupAnswers[q.id])).map(q=>q.topic),...(a.kind==='mission'?shared.diagnoseMissionTopics(a.questions,a.answers):[])])].slice(0,a.questions.length);
    if(digest(r.topicsForReview)!==digest(review)||r.level!==shared.progressionState(r.totalXp,shared.requireProgressionPolicy(r.progressionPolicy)).level)fail('assessment/record-conflict');
    for(const [field,kind,catalogField,identityField]of [['artifactResult','mission','artifact','missionId'],['badgeResult','chapter','badge','chapterId']]){
      const value=r[field];
      if(typeof value.newlyEarned!=='boolean'||(a.kind!==kind&&(value[catalogField]!==null||value.newlyEarned))||
         (value.newlyEarned&&(!passed||!value[catalogField]))||
         (value[catalogField]&&(!id(value[catalogField].id)||value[catalogField][identityField]!==a[identityField])))fail('assessment/record-conflict');
    }
    if(a.followups.length){
      if(a.followups.length!==a.followupLimit||a.followups.some(q=>!Object.hasOwn(a.followupAnswers,q.id)))fail('assessment/record-conflict');
      const expected={questionIds:a.followups.map(q=>q.id),answers:a.followupAnswers,
        correctAnswers:a.followups.filter(q=>mark(q,a.followupAnswers[q.id])).length,totalQuestions:a.followups.length,
        score:Math.round(a.followups.filter(q=>mark(q,a.followupAnswers[q.id])).length/a.followups.length*100),
        items:a.followups.map(q=>({questionId:q.id,topic:q.topic,difficulty:q.difficulty,selectedAnswer:a.followupAnswers[q.id],correctAnswer:normalize(q.correctAnswer),isCorrect:mark(q,a.followupAnswers[q.id])}))};
      if(!object(r.adaptiveFollowup)||digest(r.adaptiveFollowup)!==digest(expected))fail('assessment/record-conflict');
    }else if(r.adaptiveFollowup!=null)fail('assessment/record-conflict');
  }
  function view(a) {
    return {
      attemptId: a.attemptId,
      attemptNumber:a.attemptNumber,
      repeatedQuestions:a.repeatedQuestions,
      revision: a.revision,
      kind: a.kind,
      chapterId: a.chapterId || null,
      missionId: a.missionId || null,
      quizId: a.quizId || null,
      challengeId: a.challengeId || null,
      classroom: a.classroom || null,
      expiresAt: a.expiresAt,
      passingScore: a.threshold,
      questions: a.questions.map(q => publicQuestion(q, !!a.result)),
      answers: a.answers,
      followupQuestions: a.followups.map(q => publicQuestion(q, !!a.followupAnswers[q.id] || !!a.result)),
      followupAnswers: a.followupAnswers,
      followupLimit: a.followupLimit,
      followupStarted: a.followupStarted,
      practicePolicy: a.practicePolicy,
      topicMastery: a.mastery,
      result: a.result || null
    };
  }
  async function loadAttempt(tx, uid, input, shared) {
    if (!uuid(input.attemptId)) fail('assessment/invalid-request');
    const p = 'serverAssessmentAttempts/' + own(uid, input.attemptId),
      a = await tx.get(p);
    if (!a || a.userId !== uid) fail('assessment/attempt-unavailable');
    if(a.attemptId!==input.attemptId)fail('assessment/record-conflict');
    if (!a.result && a.expiresAt <= clock()) fail('assessment/attempt-expired');
    if (a.result) {
      try{validateReceipt(a,shared);}catch{fail('assessment/record-conflict');}
      return {p,a,ctx:null};
    }
    const ctx = await verificationContext(tx, uid, a, shared);
    if (contentVersion(ctx) !== a.contentVersion) fail('assessment/content-changed');
    return {
      p,
      a,
      ctx
    };
  }
  function bounds(input) {
    if (Buffer.byteLength(JSON.stringify(input) || '') > 65536) fail('assessment/invalid-request');
  }
  function nextMain(a, ctx, shared, index) {
    if (index >= a.questions.length - 1) return;
    const remaining = new Map();
    for (const slot of ctx.activity.questionBlueprint) remaining.set(slot.topic, (remaining.get(slot.topic) || 0) + slot.count);
    const prefix = a.questions.slice(0, index + 1),
      weights = Object.fromEntries(Object.entries(a.mastery).map(([t, s]) => [t, Math.max(0, s.missed || 0)])),
      attempts = Object.fromEntries(Object.entries(a.mastery).map(([t, s]) => [t, Math.max(0, s.attempted || 0)]));
    const available = levels(ctx.bank);
    let wanted = target(a.practicePolicy, available, a.mastery);
    for (const q of prefix) {
      remaining.set(q.topic, (remaining.get(q.topic) || 0) - 1);
      const correct = mark(q, a.answers[q.id]);
      weights[q.topic] = Math.max(0, (weights[q.topic] || 0) + (correct ? -1 : 1));
      attempts[q.topic] = (attempts[q.topic] || 0) + 1;
      wanted = shared.nextAdaptiveDifficulty(wanted, correct, available);
    }
    const selected = shared.selectAdaptiveQuestion(ctx.bank.filter(q => remaining.get(q.topic) > 0), {
      usedIds: prefix.map(q => q.id),
      seenIds: a.seen,
      topicWeights: weights,
      topicAttempts: attempts,
      targetDifficulty: wanted,
      difficultyLevels: available,
      random
    });
    if (!selected) fail('assessment/content-unavailable');
    const at = index + 1,
      displaced = a.questions[at],
      duplicate = a.questions.findIndex((q, i) => i > at && q.id === selected.id),
      sameTopic = a.questions.findIndex((q, i) => i > at && q.topic === selected.topic);
    a.questions[at] = selected;
    if (duplicate > at) a.questions[duplicate] = displaced;else if (selected.topic !== displaced.topic && sameTopic > at) a.questions[sameTopic] = displaced;
    shared.validateAdaptiveQuestionSet(ctx.bank, ctx.activity, a.questions.map(q => q.id));
  }
  function nextFollowup(a, ctx, shared) {
    const available = followupLevels(a.practicePolicy,ctx.practice);
    if (!available.length || a.followups.length >= a.followupLimit) return;
    const weak = shared.diagnoseMissionTopics(a.questions, a.answers),
      weights = Object.fromEntries(weak.map(t => [t, 2])),
      attempts = {};
    let wanted = target(a.practicePolicy, available, {}, weak.length > 0);
    for (const q of a.followups) {
      const correct = mark(q, a.followupAnswers[q.id]);
      weights[q.topic] = Math.max(0, (weights[q.topic] || 0) + (correct ? -1 : 1));
      attempts[q.topic] = (attempts[q.topic] || 0) + 1;
      wanted = shared.nextAdaptiveDifficulty(q.difficulty, correct, available);
    }
    const q = shared.selectAdaptiveQuestion(ctx.practice, {
      usedIds: a.followups.map(q => q.id),
      seenIds: a.seenAdaptive,
      topicWeights: weights,
      topicAttempts: attempts,
      targetDifficulty: wanted,
      difficultyLevels: available,
      random
    });
    if (q) a.followups.push(q);else a.followupLimit = a.followups.length;
  }
  return {
    start: (uid, input) => {
      bounds(input);
      if (!exact(input, ['kind', 'chapterId', 'missionId', 'quizId', 'challengeId', 'requestId','classroom']) || !uuid(input.requestId)) fail('assessment/invalid-request');
      const required=input.kind==='mission'?['kind','requestId','chapterId','missionId','quizId']:input.kind==='chapter'?['kind','requestId','chapterId','challengeId']:['kind','requestId','challengeId'];
      if(!exact(input,[...required,'classroom'])||required.some(key=>input[key]===undefined)||input.classroom&&(!exact(input.classroom,['classId','assignmentId'])||input.kind!=='mission'))fail('assessment/invalid-request');
      return transact(uid, async (tx, profile, policy, shared) => {
        const requestPath = 'serverAssessmentRequests/' + own(uid, input.requestId),
          existing = await tx.get(requestPath),
          requestHash = digest(input);
        if (existing) {
          if (existing.userId !== uid || existing.requestHash !== requestHash) fail('assessment/request-conflict');
          const {
            a
          } = await loadAttempt(tx, uid, {
            attemptId: existing.attemptId
          }, shared);
          return view(a);
        }
        const ctx = await issuanceContext(tx, uid, input, shared),
          date = shared.learningDateKey(new Date(clock())),
          usagePath = 'serverAssessmentUsage/' + own(uid, date),
          usage = await tx.get(usagePath),
          minute = Math.floor(clock() / 60000);
        if (usage && usage.userId !== uid) fail('assessment/record-conflict');
        if ((usage?.count || 0) >= policy.perStudentDailyAttempts || (usage?.minute === minute ? usage.minuteCount : 0) >= policy.perMinuteAttempts) fail('assessment/rate-limit');
        const selected = input.kind === 'mission' ? shared.selectMissionQuestions(ctx.bank, ctx.activity, ctx.previous, random, ctx.seen, ctx.mastery).questions : ctx.bank;
        if(input.kind==='mission')shared.validateAdaptiveQuestionSet(ctx.bank,ctx.activity,selected.map(q=>q.id));
        const attemptId = newId();
        if (!uuid(attemptId)) fail('assessment/not-active');
        const a = {
          ...input,
          ...(ctx.classroom?{classroom:ctx.classroom}:{}),
          userId: uid,
          attemptId,
          attemptNumber:ctx.attemptNumber||1,
          repeatedQuestions:selected.filter(q=>ctx.seen.includes(q.id)).length,
          revision: 0,
          questions: selected,
          answers: {},
          followups: [],
          followupAnswers: {},
          followupStarted: false,
          followupLimit: input.kind === 'mission' ? Math.min(3, ctx.practice.filter(q => shared.selectAdaptiveQuestion([q], {
            difficultyLevels: followupLevels(ctx.activity.practicePolicy||{},ctx.practice)
          })).length) : 0,
          practicePolicy: ctx.activity.practicePolicy || {},
          mastery: ctx.mastery,
          seen: ctx.seen,
          seenAdaptive: ctx.seenAdaptive,
          threshold: ctx.threshold,
          contentVersion: contentVersion(ctx),
          issuedAt: clock(),
          expiresAt: clock() + policy.attemptTtlSeconds * 1000,
          actions: {}
        };
        tx.create('serverAssessmentAttempts/' + own(uid, attemptId), a);
        tx.create(requestPath, {
          userId: uid,
          requestHash,
          attemptId
        });
        tx.set(usagePath, {
          userId: uid,
          count: (usage?.count || 0) + 1,
          minute,
          minuteCount: (usage?.minute === minute ? usage.minuteCount : 0) + 1
        });
        return view(a);
      });
    },
    resume: (uid, input) => {
      if (!exact(input, ['attemptId'])) fail('assessment/invalid-request');
      return transact(uid, async (tx, profile, policy, shared) => {
        const {
          a
        } = await loadAttempt(tx, uid, input, shared);
        return view(a);
      });
    },
    advance: (uid, input) => {
      bounds(input);
      if (!exact(input, ['attemptId', 'revision', 'requestId', 'action', 'questionId', 'answer', 'answers']) || !uuid(input.requestId) || !integer(input.revision)) fail('assessment/invalid-request');
      return transact(uid, async (tx, profile, policy, shared) => {
        const {
            p,
            a,
            ctx
          } = await loadAttempt(tx, uid, input, shared),
          signature = digest(input);
        if (a.actions[input.requestId]) {
          if (a.actions[input.requestId] !== signature) fail('assessment/request-conflict');
          return view(a);
        }
        if (a.result || a.revision !== input.revision) fail('assessment/revision-conflict');
        if (Object.keys(a.actions).length >= 512) fail('assessment/restart-required');
        if (input.action === 'answer' && a.kind === 'mission') {
          const index = a.questions.findIndex(q => q.id === input.questionId);
          if (index < 0 || a.questions.slice(0, index).some(q => !Object.hasOwn(a.answers, q.id))) fail('assessment/unissued-question');
          mark(a.questions[index], input.answer);
          const changed = Object.hasOwn(a.answers, input.questionId) && a.answers[input.questionId] !== input.answer;
          if (changed) {
            for (const q of a.questions.slice(index + 1)) delete a.answers[q.id];
            a.followups = [];
            a.followupAnswers = {};
            a.followupStarted = false;
          }
          a.answers[input.questionId] = input.answer;
          if (!a.questions.slice(index + 1).some(q => Object.hasOwn(a.answers, q.id))) nextMain(a, ctx, shared, index);
        } else if (input.action === 'followupStart' && a.kind === 'mission') {
          if (a.questions.some(q => !Object.hasOwn(a.answers, q.id))) fail('assessment/incomplete');
          if (!a.followupStarted) {
            a.followupStarted = true;
            nextFollowup(a, ctx, shared);
          }
        } else if (input.action === 'followupAnswer' && a.kind === 'mission') {
          const q = a.followups.at(-1);
          if (!a.followupStarted || !q || q.id !== input.questionId || Object.hasOwn(a.followupAnswers, q.id)) fail('assessment/unissued-question');
          mark(q, input.answer);
          a.followupAnswers[q.id] = input.answer;
        } else if (input.action === 'followupNext' && a.kind === 'mission') {
          if (!a.followupStarted || a.followups.some(q => !Object.hasOwn(a.followupAnswers, q.id))) fail('assessment/incomplete');
          nextFollowup(a, ctx, shared);
        } else if (input.action === 'answers' && a.kind !== 'mission') {
          if (!object(input.answers) || Object.keys(input.answers).length !== a.questions.length || a.questions.some(q => !Object.hasOwn(input.answers, q.id))) fail('assessment/unissued-question');
          for (const q of a.questions) mark(q, input.answers[q.id]);
          a.answers = input.answers;
        } else fail('assessment/invalid-request');
        a.actions[input.requestId] = signature;
        a.revision++;
        tx.set(p, a);
        return view(a);
      });
    },
    submit: (uid, input) => {
      if (!exact(input, ['attemptId', 'revision']) || !integer(input.revision)) fail('assessment/invalid-request');
      return transact(uid, async (tx, profile, policy, shared) => {
        const {
          p,
          a,
          ctx
        } = await loadAttempt(tx, uid, input, shared);
        if (a.result) {
          const progressionPolicy = shared.requireProgressionPolicy(await tx.get('learningSettings/progression'));
          return {
            ...a.result,
            totalXp: profile.xp ?? 0,
            level: shared.progressionState(profile.xp ?? 0, progressionPolicy).level,
            replayed: true
          };
        }
        if (a.revision !== input.revision) fail('assessment/revision-conflict');
        if (a.questions.some(q => !Object.hasOwn(a.answers, q.id))) fail('assessment/incomplete');
        if (a.kind === 'mission' && a.followupLimit && (!a.followupStarted || a.followups.length !== a.followupLimit || a.followups.some(q => !Object.hasOwn(a.followupAnswers, q.id)))) fail('assessment/incomplete');
        const correctAnswers = a.questions.filter(q => mark(q, a.answers[q.id])).length,
          score = Math.round(correctAnswers / a.questions.length * 100),
          passed = score >= ctx.threshold,
          core = a.kind === 'mission' ? shared.diagnoseMissionTopics(a.questions, a.answers) : [],
          review = [...new Set([...a.followups.filter(q => !mark(q, a.followupAnswers[q.id])).map(q => q.topic), ...core])].slice(0, a.questions.length);
        const recordId = a.kind === 'mission' ? a.missionId : a.kind === 'chapter' ? a.chapterId : shared.learningDateKey(new Date(clock()));
        if (a.kind === 'daily' && shared.learningDateKey(new Date(a.issuedAt)) !== recordId) fail('assessment/attempt-expired');
        const progressPath = (a.kind === 'mission' ? 'studentProgress/' : a.kind === 'chapter' ? 'studentChapterProgress/' : 'studentDailyChallenges/') + own(uid, recordId),
          progress = await tx.get(progressPath);
        if (progress && (!complete(progress, uid) || a.kind !== 'daily' && progress.chapterId !== a.chapterId || a.kind === 'mission' && progress.missionId !== a.missionId || !Number.isFinite(progress.bestScore) || progress.bestScore < 0 || progress.bestScore > 100)) fail('assessment/record-conflict');
        if (!integer(profile.xp ?? 0)) fail('assessment/record-conflict');
        const firstCompletion = passed && !progress,
          xpReward = firstCompletion ? ctx.reward : 0,
          totalXp = (profile.xp ?? 0) + xpReward,
          progressionPolicy = shared.requireProgressionPolicy(await tx.get('learningSettings/progression')),
          level = shared.progressionState(totalXp, progressionPolicy).level;
        const catalogs = a.kind === 'daily' ? [] : (await tx.list(a.kind === 'mission' ? 'artifacts' : 'badges', a.kind === 'mission' ? 'missionId' : 'chapterId', recordId)).filter(active);
        if (catalogs.length > 1) fail('assessment/content-unavailable');
        const catalog = catalogs[0] || null,
          ownershipPath = catalog ? (a.kind === 'mission' ? 'studentArtifacts/' : 'studentBadges/') + own(uid, catalog.id) : null,
          owned = ownershipPath ? await tx.get(ownershipPath) : null;
        if (owned && owned.userId !== uid) fail('assessment/record-conflict');
        const newlyEarned = passed && !!catalog && !owned,
          bestScore = Math.max(progress?.bestScore || 0, score),
          timestamp = tx.stamp();
        let streak = integer(profile.learningStreak) ? profile.learningStreak : 0;
        if (firstCompletion) {
          const record = {
            userId: uid,
            completed: true,
            bestScore,
            completedAt: timestamp,
            updatedAt: timestamp
          };
          if (a.kind === 'mission') Object.assign(record, {
            chapterId: a.chapterId,
            missionId: a.missionId,
            quizId: a.quizId,
            xpEarned: xpReward
          });else if (a.kind === 'chapter') Object.assign(record, {
            chapterId: a.chapterId,
            challengeId: a.challengeId
          });else {
            const yesterday = shared.learningDateKey(new Date(clock() - 86400000));
            streak = profile.lastStreakDate === recordId ? streak || 1 : profile.lastStreakDate === yesterday ? streak + 1 : 1;
            Object.assign(record, {
              challengeId: a.challengeId,
              dateKey: recordId,
              correct: true,
              selectedAnswer: normalize(a.answers[a.challengeId]),
              xpEarned: xpReward
            });
          }
          tx.create(progressPath, record);
          if (a.kind !== 'chapter') {
            const update = {
              xp: totalXp,
              level,
              updatedAt: timestamp,
              lastRewardKind: a.kind,
              lastRewardId: recordId
            };
            if (a.kind === 'daily') Object.assign(update, {
              learningStreak: streak,
              lastStreakDate: recordId
            });
            tx.update('users/' + uid, update);
          }
        } else if (passed && a.kind !== 'daily') tx.update(progressPath, {
          bestScore,
          updatedAt: timestamp
        });
        if (newlyEarned) tx.create(ownershipPath, {
          userId: uid,
          chapterId: a.chapterId,
          earnedAt: timestamp,
          ...(a.kind === 'mission' ? {
            missionId: a.missionId,
            artifactId: catalog.id
          } : {
            challengeId: a.challengeId,
            badgeId: catalog.id
          })
        });
        const adaptiveFollowup = a.followups.length ? {
          questionIds: a.followups.map(q => q.id),
          answers: a.followupAnswers,
          correctAnswers: a.followups.filter(q => mark(q, a.followupAnswers[q.id])).length,
          totalQuestions: a.followups.length,
          score: Math.round(a.followups.filter(q => mark(q, a.followupAnswers[q.id])).length / a.followups.length * 100),
          items: a.followups.map(q => ({
            questionId: q.id,
            topic: q.topic,
            difficulty: q.difficulty,
            selectedAnswer: a.followupAnswers[q.id],
            correctAnswer: normalize(q.correctAnswer),
            isCorrect: mark(q, a.followupAnswers[q.id])
          }))
        } : null;
        const result = {
          reviewQuestions:a.questions.map(q=>publicQuestion(q,true)),
          score,
          correctAnswers,
          totalQuestions: a.questions.length,
          passed,
          topicsForReview: review,
          firstCompletion,
          xpReward,
          totalXp,
          level,
          bestScore,
          learningStreak: streak,
          progressionPolicy,
          artifactResult: {
            artifact: a.kind === 'mission' ? catalog : null,
            newlyEarned: a.kind === 'mission' && newlyEarned
          },
          badgeResult: {
            badge: a.kind === 'chapter' ? catalog : null,
            newlyEarned: a.kind === 'chapter' && newlyEarned
          }
        };
        if (adaptiveFollowup) result.adaptiveFollowup = adaptiveFollowup;
        if (a.kind === 'mission') {
          tx.create('studentQuizAttempts/' + own(uid, a.attemptId), {
            userId: uid,
            chapterId: a.chapterId,
            missionId: a.missionId,
            quizId: a.quizId,
            attemptId: a.attemptId,
            ...(a.classroom?{classroom:a.classroom}:{}),
            questionIds: a.questions.map(q => q.id),
            answers: a.answers,
            score,
            correctAnswers,
            totalQuestions: a.questions.length,
            passed,
            topicsForReview: review,
            completedAt: timestamp,
            response: result
          });
          const historyPath = 'serverAssessmentHistory/' + own(uid, a.missionId),
            old = await tx.get(historyPath),
            mastery = structuredClone(old?.topicMastery || {});
          if (old && old.userId !== uid) fail('assessment/record-conflict');
          for (const q of a.questions) {
            const state = mastery[q.topic] || {
              attempted: 0,
              correct: 0,
              missed: 0
            };
            const correct = mark(q, a.answers[q.id]);
            mastery[q.topic] = {
              attempted: state.attempted + 1,
              correct: state.correct + (correct ? 1 : 0),
              missed: state.missed + (correct ? 0 : 1),
              state: correct ? 'assessed' : 'review-needed'
            };
          }
          tx.set(historyPath, {
            userId: uid,
            lastQuestionIds: a.questions.map(q => q.id),
            seenQuestionIds: [...new Set([...(old?.seenQuestionIds || []), ...a.questions.map(q => q.id)])],
            seenAdaptiveIds: [...new Set([...(old?.seenAdaptiveIds || []), ...a.followups.map(q => q.id)])],
            topicMastery: mastery
          });
        }
        a.result = result;
        a.submittedAt = clock();
        tx.set(p, a);
        return result;
      });
    }
  };
}
module.exports = {
  createAssessmentService,
  assessmentStore,
  AssessmentError,
  mark,
  publicQuestion
};
