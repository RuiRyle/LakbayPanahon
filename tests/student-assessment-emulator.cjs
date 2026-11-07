// Current-contract security/transaction acceptance. Never use live projects.
const {
    test,
    before,
    beforeEach,
    after
  } = require('node:test'),
  assert = require('node:assert/strict'),
  {
    randomUUID
  } = require('node:crypto'),
  {
    createRequire
  } = require('node:module'),
  path = require('node:path');
const rf = createRequire(path.join(__dirname, '../functions/package.json')),
  {
    initializeApp,
    deleteApp
  } = rf('firebase-admin/app'),
  {
    getFirestore,
    FieldValue
  } = rf('firebase-admin/firestore'),
  {
    getAuth
  } = rf('firebase-admin/auth');
const project = 'demo-lakbaypanahon';
assert.equal(process.env.GCLOUD_PROJECT, project);
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8180');
assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:9099');
const app = initializeApp({
    projectId: project
  }),
  db = getFirestore(app),
  adminAuth = getAuth(app),
  base = `http://127.0.0.1:8180/v1/projects/${project}/databases/(default)/documents`;
let token, otherToken;
const password = 'Local-fixture-only-7362';
async function signIn(email) {
  const r = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=local-test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true
    })
  });
  const body = await r.json();
  assert.ok(r.ok, JSON.stringify(body));
  return body.idToken;
}
before(async () => {
  for (const uid of ['alice', 'bob']) {
    try {
      await adminAuth.getUser(uid);
    } catch {
      await adminAuth.createUser({
        uid,
        email: uid + '@example.com',
        password
      });
    }
  }
  token = await signIn('alice@example.com');
  otherToken = await signIn('bob@example.com');
});
const seed = {
  'users/alice': {
    role: 'student',
    status: 'active',
    firstName: 'Alice',
    lastName: 'Test',
    email: 'alice@example.com',
    xp: 0,
    level: 1
  },
  'users/bob': {
    role: 'student',
    status: 'active',
    firstName: 'Bob',
    lastName: 'Test',
    email: 'bob@example.com',
    xp: 0,
    level: 1
  },
  'learningSettings/progression': {
    xpPerLevel: 100,
    version: 1
  },
  'learningSettings/securedAssessment': {
    enabled: true,
    protocolVersion: 1,
    attemptTtlSeconds: 3600,
    perMinuteAttempts: 100,
    perStudentDailyAttempts: 1000
  },
  'eras/e1': {
    status: 'active',
    requiredChapterIds: []
  },
  'eras/e2': {
    status: 'active',
    requiredChapterIds: ['c1']
  },
  'chapters/c1': {
    eraId: 'e1',
    order: 1,
    status: 'active',
    contentReady: true
  },
  'chapters/c2': {
    eraId: 'e2',
    order: 1,
    status: 'active',
    contentReady: true
  },
  'missions/m1': {
    chapterId: 'c1',
    order: 1,
    status: 'active',
    xpReward: 25
  },
  'missions/m2': {
    chapterId: 'c1',
    order: 2,
    status: 'active',
    xpReward: 30
  },
  'missions/m3': {
    chapterId: 'c2',
    order: 1,
    status: 'active',
    xpReward: 40
  },
  'artifacts/a1': {
    missionId: 'm1',
    status: 'active'
  },
  'artifacts/a2': {
    missionId: 'm2',
    status: 'active'
  },
  'artifacts/a3': {
    missionId: 'm3',
    status: 'active'
  },
  'chapterChallenges/final': {
    chapterId: 'c1',
    status: 'active',
    passingScore: 60
  },
  'chapterChallengeQuestions/fq': {
    challengeId: 'final',
    status: 'active',
    question: 'A fixture challenge',
    correctAnswer: 'C',
    optionA: 'A',
    optionB: 'B',
    optionC: 'C',
    optionD: 'D'
  },
  'badges/b1': {
    chapterId: 'c1',
    status: 'active'
  },
  'dailyChallenges/d1': {
    status: 'active',
    order: 1,
    question: 'Fixture daily',
    optionA: 'A',
    optionB: 'B',
    optionC: 'C',
    optionD: 'D',
    correctAnswer: 'D',
    xpReward: 10
  },
  'avatars/book': {
    status: 'active'
  },
  'avatars/cat': {
    status: 'active'
  }
};
for (const mission of ['m1', 'm2', 'm3']) {
  const quiz = 'quiz' + mission.slice(1);
  seed['quizzes/' + quiz] = {
    status: 'active',
    missionId: mission,
    questionCount: 5,
    passingScore: 60,
    questionBlueprint: [{
      topic: 'trade',
      difficulty: 'easy',
      count: 3
    }, {
      topic: 'homes',
      difficulty: 'easy',
      count: 2
    }],
    practicePolicy: {
      difficultyLevels: ['easy', 'medium', 'hard'],
      startDifficulty: 'medium',
      reviewDifficulty: 'easy',
      promoteAccuracy: .8,
      demoteAccuracy: .4
    }
  };
  for (const topic of ['trade', 'homes']) for (const difficulty of ['easy', 'medium', 'hard']) for (let n = 0; n < 4; n++) {
    const q = {
      status: 'active',
      question: 'Synthetic ' + topic + ' ' + difficulty,
      optionA: 'Supported',
      optionB: 'Other',
      optionC: 'Third',
      optionD: 'Fourth',
      correctAnswer: 'A',
      explanation: 'Fixture feedback.',
      topic,
      difficulty
    };
    seed[`questions/${mission}_${topic}_${difficulty}_${n}`] = {
      ...q,
      quizId: quiz
    };
    seed[`practiceQuestions/${mission}_${topic}_${difficulty}_${n}`] = {
      ...q,
      missionId: mission,
      reviewEvidencePolicy:{version:1,minDistinctQuestions:2,minCleanSessions:2,requiredDifficulty:'hard'}
    };
  }
}
beforeEach(async () => {
  const r = await fetch(`http://127.0.0.1:8180/emulator/v1/projects/${project}/databases/(default)/documents`, {
    method: 'DELETE'
  });
  assert.equal(r.status, 200);
  const batch = db.batch();
  for (const [p, d] of Object.entries(seed)) batch.set(db.doc(p), d);
  await batch.commit();
});
after(async () => {
  await db.terminate();
  await deleteApp(app);
});
async function callable(name, data, identity = token) {
  const r = await fetch(`http://127.0.0.1:5001/${project}/asia-southeast1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(identity ? {
        Authorization: 'Bearer ' + identity
      } : {})
    },
    body: JSON.stringify({
      data
    })
  });
  const body = await r.json();
  if (body.error) throw Object.assign(Error(body.error.message), {
    assessmentCode: body.error.details?.assessmentCode,
    status: r.status
  });
  assert.ok(r.ok, JSON.stringify(body));
  return body.result;
}
const start = (options = {}) => callable('startStudentAssessment', {
  kind: 'mission',
  chapterId: 'c1',
  missionId: 'm1',
  quizId: 'quiz1',
  requestId: randomUUID(),
  ...options
});
const action = (state, data) => callable('advanceStudentAssessment', {
  attemptId: state.attemptId,
  revision: state.revision,
  requestId: randomUUID(),
  ...data
});
async function answered(state, correct = 5) {
  for (let i = 0; i < state.questions.length; i++) state = await action(state, {
    action: 'answer',
    questionId: state.questions[i].id,
    answer: i < correct ? 'A' : 'B'
  });
  state = await action(state, {
    action: 'followupStart'
  });
  while (state.followupQuestions.length && (!state.followupAnswers[state.followupQuestions.at(-1).id] || state.followupQuestions.length < state.followupLimit)) {
    const q = state.followupQuestions.at(-1);
    if (!state.followupAnswers[q.id]) state = await action(state, {
      action: 'followupAnswer',
      questionId: q.id,
      answer: 'B'
    });else state = await action(state, {
      action: 'followupNext'
    });
  }
  return state;
}
const submit = s => callable('submitStudentActivity', {
  attemptId: s.attemptId,
  revision: s.revision
});
const xp = async () => (await db.doc('users/alice').get()).data().xp;
const enc = x => x === null ? {
  nullValue: null
} : typeof x === 'string' ? {
  stringValue: x
} : typeof x === 'boolean' ? {
  booleanValue: x
} : Array.isArray(x) ? {
  arrayValue: {
    values: x.map(enc)
  }
} : x && typeof x === 'object' ? {
  mapValue: {
    fields: fields(x)
  }
} : {
  integerValue: String(x)
};
const fields = x => Object.fromEntries(Object.entries(x).map(([k, v]) => [k, enc(v)]));
const rest = (method, p, body, identity = token) => fetch(base + (p.startsWith(':') ? '' : '/') + p, {
  method,
  headers: {
    Authorization: 'Bearer ' + identity,
    'Content-Type': 'application/json'
  },
  ...(body ? {
    body: JSON.stringify(body)
  } : {})
});
test('legitimate first completion uses five issued questions and authoritative XP/level/artifact', async () => {
  const state = await answered(await start());
  assert.equal(state.questions.length, 5);
  const r = await submit(state);
  assert.equal(r.score, 100);
  assert.equal(r.xpReward, 25);
  assert.equal(r.totalXp, 25);
  assert.equal(r.level, 1);
  assert.equal((await db.collection('studentArtifacts').get()).size, 1);
  assert.equal(r.adaptiveFollowup.score, 0);
  assert.equal(r.passed, true);
});
test('failed attempts followed by successful retry retain both attempts and award only once', async () => {
  const failed = await submit(await answered(await start(), 0));
  assert.equal(failed.passed, false);
  assert.equal(await xp(), 0);
  assert.equal((await db.collection('studentProgress').get()).size, 0);
  await submit(await answered(await start()));
  assert.equal(await xp(), 25);
  assert.equal((await db.collection('studentQuizAttempts').get()).size, 2);
});
test('completed replay and new retries cannot award duplicate XP and refresh returns current totals', async () => {
  const state = await answered(await start());
  await submit(state);
  await db.doc('users/alice').update({
    xp: 125,
    level: 2
  });
  const restored = await callable('resumeStudentAssessment', {
    attemptId: state.attemptId
  });
  assert.ok(restored.result);
  const replay = await submit(state);
  assert.equal(replay.totalXp, 125);
  assert.equal(replay.level, 2);
  assert.equal((await submit(await answered(await start()))).xpReward, 0);
  assert.equal(await xp(), 125);
});
test('duplicate/concurrent submissions and issuance are idempotent', async () => {
  const request = {
      requestId: randomUUID()
    },
    issued = await Promise.all([start(request), start(request)]);
  assert.equal(issued[0].attemptId, issued[1].attemptId);
  const state = await answered(issued[0]);
  await Promise.all([submit(state), submit(state), submit(state)]);
  assert.equal(await xp(), 25);
  assert.equal((await db.collection('studentQuizAttempts').get()).size, 1);
  const second = await answered(await start());
  await Promise.all([submit(state), submit(second)]);
  assert.equal(await xp(), 25);
});
test('interrupted response can resume committed result; no partial completion is written', async () => {
  const state = await answered(await start());
  await submit(state);
  const resumed = await callable('resumeStudentAssessment', {
    attemptId: state.attemptId
  });
  assert.equal(resumed.result.totalXp, 25);
  await submit(state);
  assert.equal((await db.collection('studentArtifacts').get()).size, 1);
  assert.equal(await xp(), 25);
});
test('forged scores, IDs, unissued questions and raw legacy callable submissions are rejected', async () => {
  const state = await start();
  assert.equal(state.questions.some(q => q.correctAnswer), false);
  await assert.rejects(callable('submitStudentActivity', {
    kind: 'mission',
    score: 100,
    xp: 9999,
    questionIds: state.questions.map(q => q.id)
  }));
  await assert.rejects(action(state, {
    action: 'answer',
    questionId: 'forged',
    answer: 'A'
  }));
  await assert.rejects(callable('submitStudentActivity', {
    attemptId: randomUUID(),
    revision: 0
  }));
  await assert.rejects(callable('submitStudentActivity', {
    attemptId: state.attemptId,
    revision: 0,
    score: 100
  }));
  assert.equal(await xp(), 0);
});
test('mission/chapter/era prerequisites cannot be bypassed and unlock after valid results', async () => {
  await assert.rejects(start({
    missionId: 'm2',
    quizId: 'quiz2'
  }), /assessment\/locked/);
  await assert.rejects(start({
    chapterId: 'c2',
    missionId: 'm3',
    quizId: 'quiz3'
  }), /assessment\/locked/);
  await assert.rejects(callable('startStudentAssessment', {
    kind: 'chapter',
    chapterId: 'c1',
    challengeId: 'final',
    requestId: randomUUID()
  }), /locked/);
  await submit(await answered(await start()));
  const next = await start({
    missionId: 'm2',
    quizId: 'quiz2'
  });
  assert.equal(next.missionId, 'm2');
});
test('chapter badge requires all missions and trusted grading, repeated requests award one', async () => {
  await submit(await answered(await start()));
  await submit(await answered(await start({
    missionId: 'm2',
    quizId: 'quiz2'
  })));
  let c = await callable('startStudentAssessment', {
    kind: 'chapter',
    chapterId: 'c1',
    challengeId: 'final',
    requestId: randomUUID()
  });
  c = await action(c, {
    action: 'answers',
    answers: {
      fq: 'C'
    }
  });
  await Promise.all([submit(c), submit(c)]);
  assert.equal(await xp(), 55);
  assert.equal((await db.collection('studentBadges').get()).size, 1);
  const next = await start({
    chapterId: 'c2',
    missionId: 'm3',
    quizId: 'quiz3'
  });
  assert.equal(next.missionId, 'm3');
});
test('legacy progress/rewards/best score stay readable and cannot create a legacy write bypass', async () => {
  const oldTime = new Date('2024-01-01');
  await db.doc('studentProgress/alice_m1').set({
    userId: 'alice',
    chapterId: 'c1',
    missionId: 'm1',
    quizId: 'quiz1',
    completed: true,
    bestScore: 100,
    completedAt: oldTime
  });
  await db.doc('users/alice').update({
    xp: 900,
    level: 10
  });
  const r = await submit(await answered(await start(), 3));
  assert.equal(r.xpReward, 0);
  assert.equal(await xp(), 900);
  const p = (await db.doc('studentProgress/alice_m1').get()).data();
  assert.equal(p.bestScore, 100);
  assert.equal(p.completedAt.toMillis(), oldTime.getTime());
  assert.equal((await rest('GET', 'studentProgress/alice_m1')).status, 200);
  await start({
    missionId: 'm2',
    quizId: 'quiz2'
  });
});
test('direct canonical reward/completion/attempt/ownership writes are denied including valid-looking claims', async () => {
  for (const collection of ['studentProgress', 'studentChapterProgress', 'studentArtifacts', 'studentBadges', 'studentQuizAttempts', 'studentDailyChallenges']) {
    const r = await rest('PATCH', collection + '/alice_m1', {
      fields: fields({
        userId: 'alice',
        chapterId: 'c1',
        missionId: 'm1',
        completed: true,
        bestScore: 100,
        xpEarned: 25
      })
    });
    assert.equal(r.status, 403, collection);
  }
  const r = await rest('PATCH', 'users/alice?updateMask.fieldPaths=xp&updateMask.fieldPaths=level', {
    fields: fields({
      xp: 9999,
      level: 100
    })
  });
  assert.equal(r.status, 403);
  assert.equal(await xp(), 0);
});
test('all private assessment records reject owner reads/writes and cross-user requests', async () => {
  const s = await start();
  for (const c of ['serverAssessmentAttempts', 'serverAssessmentHistory', 'serverAssessmentRequests', 'serverAssessmentUsage']) {
    assert.equal((await rest('GET', c + '/alice_' + s.attemptId)).status, 403);
    assert.equal((await rest('PATCH', c + '/alice_fake', {
      fields: fields({
        userId: 'alice'
      })
    })).status, 403);
  }
  await assert.rejects(callable('resumeStudentAssessment', {
    attemptId: s.attemptId
  }, otherToken));
  await assert.rejects(callable('startStudentAssessment', {
    kind: 'mission',
    chapterId: 'c1',
    missionId: 'm1',
    quizId: 'quiz1',
    requestId: randomUUID()
  }, null));
});
test('action retries are idempotent; stale revisions and changed answer reset later evidence', async () => {
  let s = await start();
  const request = {
    attemptId: s.attemptId,
    revision: s.revision,
    requestId: randomUUID(),
    action: 'answer',
    questionId: s.questions[0].id,
    answer: 'B'
  };
  const a = await callable('advanceStudentAssessment', request),
    b = await callable('advanceStudentAssessment', request);
  assert.equal(a.revision, b.revision);
  assert.equal(a.questions[1].difficulty, 'easy');
  await assert.rejects(action(s, {
    action: 'answer',
    questionId: s.questions[0].id,
    answer: 'A'
  }), /revision-conflict/);
  s = a;
  for (let i = 1; i < 5; i++) s = await action(s, {
    action: 'answer',
    questionId: s.questions[i].id,
    answer: 'A'
  });
  s = await action(s, {
    action: 'answer',
    questionId: s.questions[0].id,
    answer: 'A'
  });
  assert.equal(Object.keys(s.answers).length, 1);
  assert.equal(s.followupQuestions.length, 0);
});
test('adaptive followups reinforce weak topics at easy difficulty without changing main score', async () => {
  let s = await start();
  for (let i = 0; i < 5; i++) s = await action(s, {
    action: 'answer',
    questionId: s.questions[i].id,
    answer: i === 0 ? 'B' : 'A'
  });
  const weak = s.questions[0].topic;
  s = await action(s, {
    action: 'followupStart'
  });
  assert.equal(s.followupQuestions[0].topic, weak);
  assert.equal(s.followupQuestions[0].difficulty, 'easy');
  for (let i = 0; i < s.followupLimit; i++) {
    s = await action(s, {
      action: 'followupAnswer',
      questionId: s.followupQuestions.at(-1).id,
      answer: 'B'
    });
    if (i + 1 < s.followupLimit) s = await action(s, {
      action: 'followupNext'
    });
  }
  const r = await submit(s);
  assert.equal(r.score, 80);
  assert.equal(r.adaptiveFollowup.score, 0);
});
test('daily grading uses server date and reward/streak paid once with no client amounts', async () => {
  let d = await callable('startStudentAssessment', {
    kind: 'daily',
    challengeId: 'd1',
    requestId: randomUUID()
  });
  d = await action(d, {
    action: 'answers',
    answers: {
      d1: 'D'
    }
  });
  await Promise.all([submit(d), submit(d)]);
  assert.equal(await xp(), 10);
  assert.equal((await db.doc('users/alice').get()).data().learningStreak, 1);
  assert.equal((await db.collection('studentDailyChallenges').get()).size, 1);
});
test('content changes and disabled users cannot finalize old issued results', async () => {
  const s = await answered(await start());
  await db.doc('questions/' + s.questions[0].id).update({
    correctAnswer: 'B'
  });
  await assert.rejects(submit(s), /content-changed/);
  assert.equal(await xp(), 0);
  await db.doc('users/alice').update({
    status: 'disabled'
  });
  await assert.rejects(start(), /forbidden/);
});
test('bounded profile names and catalog avatars remain writable; protected fields do not', async () => {
  const save = patch => rest('POST', ':commit', {
    writes: [{
      update: {
        name: `projects/${project}/databases/(default)/documents/users/alice`,
        fields: fields(patch)
      },
      updateMask: {
        fieldPaths: [...Object.keys(patch), 'updatedAt']
      },
      updateTransforms: [{
        fieldPath: 'updatedAt',
        setToServerValue: 'REQUEST_TIME'
      }]
    }]
  });
  assert.equal((await save({
    firstName: 'Ana',
    lastName: 'Dela Cruz',
    avatarId: 'book'
  })).status, 200);
  assert.equal((await save({
    xp: 500
  })).status, 403);
  assert.equal((await save({
    role: 'admin'
  })).status, 403);
  assert.equal((await save({
    status: 'disabled'
  })).status, 403);
  assert.equal((await save({
    firstName: ''
  })).status, 403);
  assert.equal((await rest('GET', 'users/alice', null, otherToken)).status, 403);
});
test('actual student interface uses secured callables with followups and saves the unchanged reward', async () => {
  await db.doc('users/alice').update({
    profileSetupCompletedAt: FieldValue.serverTimestamp()
  });
  await db.doc('missions/m1').update({
    title: 'Fixture mission',
    description: 'Fixture learning content'
  });
  const {
    runSecuredBrowser
  } = require('./secured-browser-emulator.cjs');
  const report = await runSecuredBrowser();
  assert.equal(report.status, 'pass');
});

test('independent concurrent eligible missions accumulate XP without overwriting each other',async()=>{
  const batch=db.batch();batch.set(db.doc('eras/e3'),{status:'active',requiredChapterIds:[]});batch.set(db.doc('chapters/c3'),{status:'active',contentReady:true,eraId:'e3',order:1});batch.set(db.doc('missions/m4'),{status:'active',chapterId:'c3',order:1,xpReward:40});batch.set(db.doc('quizzes/quiz4'),{...seed['quizzes/quiz1'],missionId:'m4'});batch.set(db.doc('artifacts/a4'),{status:'active',missionId:'m4'});
  for(const [p,row]of Object.entries(seed))if(p.startsWith('questions/m1_'))batch.set(db.doc(p.replace('m1_','m4_')),{...row,quizId:'quiz4'});await batch.commit();
  const a=await answered(await start()),b=await answered(await start({chapterId:'c3',missionId:'m4',quizId:'quiz4'}));await Promise.all([submit(a),submit(b)]);assert.equal(await xp(),65);assert.equal((await db.collection('studentArtifacts').get()).size,2);
});

test('all chapter game types are graded from issued content, not client conclusions or keys',async()=>{
  const batch=db.batch();for(const m of ['m1','m2'])batch.set(db.doc('studentProgress/alice_'+m),{userId:'alice',chapterId:'c1',missionId:m,completed:true,bestScore:100});
  batch.set(db.doc('chapterChallengeQuestions/match'),{challengeId:'final',status:'active',gameType:'matching',matchingLeft:['left'],matchingRight:['right'],matchingPairs:[{left:'left',right:'right'}]});
  batch.set(db.doc('chapterChallengeQuestions/trade'),{challengeId:'final',status:'active',gameType:'tradeSimulation',startingQuantity:5,requiredQuantity:3});
  batch.set(db.doc('chapterChallengeQuestions/evidence'),{challengeId:'final',status:'active',correctAnswer:'B',evidenceTask:{instructions:'Fixture only',cards:[{id:'e1'},{id:'e2'}],correctEvidenceId:'e2'}});await batch.commit();
  let c=await callable('startStudentAssessment',{kind:'chapter',chapterId:'c1',challengeId:'final',requestId:randomUUID()});assert.equal(c.questions.some(q=>q.matchingPairs||q.requiredQuantity||q.correctAnswer||q.evidenceTask?.correctEvidenceId),false);
  c=await action(c,{action:'answers',answers:{fq:'C',match:{gameType:'matching',matches:{left:'right'}},trade:{gameType:'tradeSimulation',quantity:3},evidence:{gameType:'evidenceDecision',evidenceId:'e2',conclusion:'B'}}});const r=await submit(c);assert.equal(r.score,100);assert.equal(r.xpReward,0);assert.equal((await db.collection('studentBadges').get()).size,1);
});

test('valid-looking paired forged claims from the original audit are denied, not merely malformed records',async()=>{
 const write=(name,data,stamps,update=false)=>({update:{name:`projects/${project}/databases/(default)/documents/${name}`,fields:fields(data)},updateTransforms:stamps.map(fieldPath=>({fieldPath,setToServerValue:'REQUEST_TIME'})),...(update?{updateMask:{fieldPaths:[...Object.keys(data),...stamps]}}:{})});
 const mission=await rest('POST',':commit',{writes:[write('studentProgress/alice_m2',{userId:'alice',chapterId:'c1',missionId:'m2',quizId:'quiz2',completed:true,bestScore:100,xpEarned:30},['completedAt','updatedAt']),write('users/alice',{xp:30,level:1,lastRewardKind:'mission',lastRewardId:'m2'},['updatedAt'],true)]});assert.equal(mission.status,403);
 const chapter=await rest('POST',':commit',{writes:[write('studentChapterProgress/alice_c1',{userId:'alice',chapterId:'c1',challengeId:'final',completed:true,bestScore:100},['completedAt','updatedAt']),write('studentBadges/alice_b1',{userId:'alice',chapterId:'c1',challengeId:'final',badgeId:'b1'},['earnedAt'])]});assert.equal(chapter.status,403);assert.equal(await xp(),0);
});

test('expired attempts, revoked identities, action conflicts and changed request identities fail closed',async()=>{
 const requestId=randomUUID(),s=await start({requestId});await assert.rejects(start({requestId,missionId:'m2',quizId:'quiz2'}),/request-conflict/);
 const actionId=randomUUID(),data={attemptId:s.attemptId,revision:0,requestId:actionId,action:'answer',questionId:s.questions[0].id,answer:'A'};await callable('advanceStudentAssessment',data);await assert.rejects(callable('advanceStudentAssessment',{...data,answer:'B'}),/request-conflict/);
 await db.doc('serverAssessmentAttempts/alice_'+s.attemptId).update({expiresAt:Date.now()-1});await assert.rejects(callable('resumeStudentAssessment',{attemptId:s.attemptId}),/attempt-expired/);
 await adminAuth.updateUser('alice',{disabled:true});await assert.rejects(start());await adminAuth.updateUser('alice',{disabled:false});token=await signIn('alice@example.com');assert.equal(await xp(),0);
});

test('daily wrong answers do not pay and server midnight invalidates an unfinished daily attempt',async()=>{
 let d=await callable('startStudentAssessment',{kind:'daily',challengeId:'d1',requestId:randomUUID()});d=await action(d,{action:'answers',answers:{d1:'A'}});assert.equal((await submit(d)).passed,false);assert.equal(await xp(),0);assert.equal((await db.collection('studentDailyChallenges').get()).size,0);
 const {createAssessmentService,assessmentStore}=require('../functions/student-assessment');let now=Date.parse('2026-11-06T15:59:00Z');const service=createAssessmentService(assessmentStore(db,()=>FieldValue.serverTimestamp()),{clock:()=>now});let s=await service.start('alice',{kind:'daily',challengeId:'d1',requestId:randomUUID()});s=await service.advance('alice',{attemptId:s.attemptId,revision:s.revision,requestId:randomUUID(),action:'answers',answers:{d1:'D'}});now+=120000;await assert.rejects(service.submit('alice',{attemptId:s.attemptId,revision:s.revision}),/expired/);assert.equal(await xp(),0);
});

test('issuance limits apply to new requests while same request recovery remains available',async()=>{
 await db.doc('learningSettings/securedAssessment').update({perMinuteAttempts:1});const requestId=randomUUID(),s=await start({requestId});assert.equal((await start({requestId})).attemptId,s.attemptId);await assert.rejects(start(),/rate-limit/);assert.equal((await db.collection('serverAssessmentAttempts').get()).size,1);
});

test('a real commit failure leaves no partial rewards and the same attempt can retry safely',async()=>{
 const state=await answered(await start()),{createAssessmentService,assessmentStore}=require('../functions/student-assessment'),baseStore=assessmentStore(db,()=>FieldValue.serverTimestamp());
 const failingStore={run:callback=>baseStore.run(async tx=>{const create=tx.create;tx.create=(p,data)=>{create(p,data);if(p.startsWith('studentProgress/'))create('users/alice',{invalidCollision:true});};return callback(tx);})};
 await assert.rejects(createAssessmentService(failingStore).submit('alice',{attemptId:state.attemptId,revision:state.revision}));
 assert.equal(await xp(),0);assert.equal((await db.collection('studentProgress').get()).size,0);assert.equal((await db.collection('studentArtifacts').get()).size,0);assert.equal((await db.collection('studentQuizAttempts').get()).size,0);assert.equal((await db.doc('serverAssessmentAttempts/alice_'+state.attemptId).get()).data().result,undefined);
 assert.equal((await submit(state)).xpReward,25);
});

test('followups honor the existing configured difficulty list even when other bank levels exist',async()=>{
 await db.doc('quizzes/quiz1').update({'practicePolicy.difficultyLevels':['easy','hard']});let s=await start();for(let i=0;i<5;i++)s=await action(s,{action:'answer',questionId:s.questions[i].id,answer:'A'});s=await action(s,{action:'followupStart'});for(let i=0;i<s.followupLimit;i++){const q=s.followupQuestions.at(-1);assert.ok(['easy','hard'].includes(q.difficulty));s=await action(s,{action:'followupAnswer',questionId:q.id,answer:'B'});if(i+1<s.followupLimit)s=await action(s,{action:'followupNext'});}assert.equal((await submit(s)).score,100);
});

test('targeted practice influences reinforcement but cannot itself award completion or XP',async()=>{
 let s=await start();for(let i=0;i<5;i++)s=await action(s,{action:'answer',questionId:s.questions[i].id,answer:i===0?'B':'A'});const weak=s.questions[0].topic;s=await action(s,{action:'followupStart'});for(let i=0;i<s.followupLimit;i++){s=await action(s,{action:'followupAnswer',questionId:s.followupQuestions.at(-1).id,answer:'A'});if(i+1<s.followupLimit)s=await action(s,{action:'followupNext'});}await submit(s);
 const questions=Object.entries(seed).filter(([p,q])=>p.startsWith('practiceQuestions/m1_')&&q.topic===weak&&q.difficulty==='hard').slice(0,2).map(([p,q])=>({questionId:p.split('/')[1],topic:weak,difficulty:q.difficulty,firstTryCorrect:true,attemptCount:1}));
 for(let i=0;i<2;i++)await db.doc('studentPracticeProgress/clean_'+i).set({userId:'alice',missionId:'m1',chapterId:'c1',completedAt:FieldValue.serverTimestamp(),totalQuestions:2,firstTryCorrectCount:2,questionResults:questions,topicsForReview:[]});
 const before=await xp(),next=await start();assert.equal(next.topicMastery[weak].state,'practice-goal-reached');assert.ok(next.questions.filter(q=>q.topic===weak).every(q=>q.difficulty==='hard'));assert.equal(await xp(),before);assert.equal((await db.collection('studentProgress').get()).size,1);
});

test('privacy and filtered progress reads remain protected under secured rules',async()=>{
 await db.doc('studentProgress/alice_m1').set({userId:'alice',chapterId:'c1',missionId:'m1',completed:true,bestScore:100});
 assert.equal((await rest('GET','studentProgress/alice_m1')).status,200);assert.equal((await rest('GET','studentProgress/alice_m1',null,otherToken)).status,403);
 assert.equal((await rest('POST',':runQuery',{structuredQuery:{from:[{collectionId:'studentProgress'}]}})).status,403);
 const query={structuredQuery:{from:[{collectionId:'studentProgress'}],where:{fieldFilter:{field:{fieldPath:'userId'},op:'EQUAL',value:{stringValue:'alice'}}}}};assert.equal((await rest('POST',':runQuery',query)).status,200);assert.equal((await rest('POST',':runQuery',query,otherToken)).status,403);
});

test('cosmetic eligibility remains tied to saved level and cannot grant XP',async()=>{
 const save=frameId=>rest('POST',':commit',{writes:[{update:{name:`projects/${project}/databases/(default)/documents/studentCosmetics/alice`,fields:fields({frameId})},updateTransforms:[{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}]}]});
 assert.equal((await save('none')).status,200);assert.equal((await save('bamboo')).status,403);await db.doc('users/alice').update({xp:200,level:3});assert.equal((await save('bamboo')).status,200);assert.equal((await save('guardian')).status,403);assert.equal(await xp(),200);
});

test('Option A issuance preserves learning-history reads; issued operations skip them and merge private history atomically',async()=>{
 const {createAssessmentService,assessmentStore}=require('../functions/student-assessment'),base=assessmentStore(db,()=>FieldValue.serverTimestamp()),reads=[];
 const tracked={run:fn=>base.run(tx=>fn({...tx,list:(...args)=>{reads.push(args[0]);return tx.list(...args);}}))},service=createAssessmentService(tracked);
 let s=await service.start('alice',{kind:'mission',chapterId:'c1',missionId:'m1',quizId:'quiz1',requestId:randomUUID()});
 const histories=['studentQuizAttempts','studentPracticeProgress','studentReviewEvents'];for(const c of histories)assert.ok(reads.includes(c));reads.length=0;
 await service.resume('alice',{attemptId:s.attemptId});
 const act=data=>service.advance('alice',{attemptId:s.attemptId,revision:s.revision,requestId:randomUUID(),...data});
 for(let i=0;i<5;i++)s=await act({action:'answer',questionId:s.questions[i].id,answer:'A'});
 s=await act({action:'followupStart'});for(let i=0;i<s.followupLimit;i++){s=await act({action:'followupAnswer',questionId:s.followupQuestions.at(-1).id,answer:'A'});if(i+1<s.followupLimit)s=await act({action:'followupNext'});}
 const r=await service.submit('alice',{attemptId:s.attemptId,revision:s.revision});assert.equal(r.score,100);for(const c of histories)assert.ok(!reads.includes(c),c);
 const history=(await db.doc('serverAssessmentHistory/alice_m1').get()).data();assert.equal(Object.values(history.topicMastery).reduce((n,x)=>n+x.attempted,0),5);assert.equal(history.userId,'alice');
});

test('Option A uncommitted attempts still validate changed prerequisites, catalog and private ownership',async()=>{
 const s=await answered(await start());await db.doc('eras/e1').update({requiredChapterIds:['missing']});await assert.rejects(submit(s),/locked/);assert.equal(await xp(),0);
 await db.doc('eras/e1').update({requiredChapterIds:[]});await db.doc('questions/'+s.questions[0].id).update({correctAnswer:'B'});await assert.rejects(submit(s),/content-changed/);assert.equal(await xp(),0);
});

test('Option A committed receipt recovery survives deleted catalog and expired attempt but not bad ownership, receipt or disabled account',async()=>{
 const s=await answered(await start()),r=await submit(s),p=db.doc('serverAssessmentAttempts/alice_'+s.attemptId),original=(await p.get()).data();
 await p.update({expiresAt:0});await db.doc('missions/m1').delete();await db.doc('quizzes/quiz1').delete();
 await db.doc('users/alice').update({xp:75,level:1});const replay=await submit(s);assert.equal(replay.totalXp,75);assert.equal(replay.xpReward,r.xpReward);assert.equal(replay.replayed,true);
 const resumed=await callable('resumeStudentAssessment',{attemptId:s.attemptId});assert.equal(resumed.result.score,100);
 for(const patch of [{'result.score':0},{'result.xpReward':-1},{'result.correctAnswers':99},{'result.reviewQuestions':[]},{attemptId:randomUUID()}]){await p.set({...original,expiresAt:0});await p.update(patch);await assert.rejects(submit(s),/record-conflict/);}
 await p.set({...original,userId:'bob'});await assert.rejects(submit(s),/attempt-unavailable/);
 await p.set(original);await db.doc('users/alice').update({status:'disabled'});await assert.rejects(submit(s),/forbidden/);assert.equal(await xp(),75);
});

test('Option A chapter submit rechecks prerequisite completion after issuance',async()=>{
 await submit(await answered(await start()));await submit(await answered(await start({missionId:'m2',quizId:'quiz2'})));
 let s=await callable('startStudentAssessment',{kind:'chapter',chapterId:'c1',challengeId:'final',requestId:randomUUID()});
 s=await action(s,{action:'answers',answers:{fq:'C'}});await db.doc('studentProgress/alice_m2').delete();
 await assert.rejects(submit(s),/locked/);assert.equal((await db.doc('studentChapterProgress/alice_c1').get()).exists,false);assert.equal((await db.doc('studentBadges/alice_b1').get()).exists,false);assert.equal(await xp(),55);
});
