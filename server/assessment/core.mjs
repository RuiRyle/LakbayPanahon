import {randomInt, randomUUID, createHash} from 'node:crypto';
import {selectMissionQuestions} from '../../js/mission-assessment.js';
import {selectDailyChallenge, learningDateKey} from '../../js/daily-policy.js';
import {progressionState, requireProgressionPolicy} from '../../js/progression-policy.js';

// Inactive preparation. All content, thresholds, rewards and operating policy
// are read through the private server store, never accepted from a browser.
export class AssessmentError extends Error {
    constructor(code) { super(code); this.code=code; }
}
const fail=code=>{throw new AssessmentError(code);};
const id=value=>typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value);
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const integer=(value,min,max)=>Number.isSafeInteger(value)&&value>=min&&value<=max;
const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const stable=value=>Array.isArray(value)?value.map(stable):record(value)?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
const fingerprint=value=>createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
const random=()=>randomInt(0,0x100000000)/0x100000000;
const active=value=>value?.status==='active';
const completed=(value,uid)=>value?.userId===uid&&value.completed===true&&value.serverVerified===true;
const ownedId=(uid,key)=>uid+'_'+key;
const exactKeys=(value,allowed)=>record(value)&&Object.keys(value).every(key=>allowed.includes(key));
const safeXp=value=>integer(value,0,Number.MAX_SAFE_INTEGER)?value:fail('assessment/content-unavailable');

export function requireAssessmentPolicy(value) {
    if(value?.enabled!==true||value.mode!=='trusted'||value.schemaVersion!==1||value.privateKeysReady!==true||value.clientWritesBlocked!==true)fail('assessment/not-active');
    if(!integer(value.attemptTtlSeconds,60,3600)||!integer(value.perMinuteAttempts,1,20)||!integer(value.perStudentDailyAttempts,1,1000))fail('assessment/not-active');
    return value;
}

function publicQuestion(question) {
    // Allowlist output rather than copying arbitrary private/catalog metadata.
    const out={};
    for(const key of ['id','question','optionA','optionB','optionC','optionD','topic','topicLabel','difficulty','gameType','instructions','startingQuantity','matchingLeft','matchingRight']) {
        if(question[key]!==undefined)out[key]=structuredClone(question[key]);
    }
    if(question.evidenceTask)out.evidenceTask={instructions:question.evidenceTask.instructions,cards:structuredClone(question.evidenceTask.cards)};
    return out;
}

function privateKeyPath(collection,questionId) { return 'assessmentAnswerKeys/'+collection+'_'+questionId; }
function validateKey(question,key,collection,activity) {
    if(!key||key.questionId!==question.id||key.questionCollection!==collection||key.activityId!==activity.id||key.assessmentVersion!==activity.assessmentVersion)fail('assessment/key-unavailable');
    // The public bank must be migrated too: hiding a field in an HTTP reply
    // does not prevent a student from reading that public Firestore document.
    const prohibited=['correctAnswer','answerExplanations','explanation','historicalClue','learningPoint','matchingPairs','requiredQuantity'];
    if(prohibited.some(field=>Object.hasOwn(question,field))||Object.hasOwn(question.evidenceTask||{},'correctEvidenceId'))fail('assessment/migration-required');
    if(question.gameType==='matching') {
        if(!record(key.matches)||!Object.keys(key.matches).length||!Array.isArray(question.matchingLeft)||!Array.isArray(question.matchingRight))fail('assessment/key-unavailable');
    } else if(question.gameType==='tradeSimulation') {
        if(!integer(key.requiredQuantity,1,Number.MAX_SAFE_INTEGER)||key.requiredQuantity>question.startingQuantity)fail('assessment/key-unavailable');
    } else {
        if(!['A','B','C','D'].includes(key.correctAnswer)||!['A','B','C','D'].every(letter=>typeof question['option'+letter]==='string'))fail('assessment/key-unavailable');
        if(question.evidenceTask&&!question.evidenceTask.cards?.some(card=>card.id===key.correctEvidenceId))fail('assessment/key-unavailable');
    }
}

function mark(question,key,answer) {
    if(question.gameType==='matching')return exactKeys(answer,['gameType','matches'])&&answer.gameType==='matching'&&record(answer.matches)&&
        Object.keys(answer.matches).length===Object.keys(key.matches).length&&Object.entries(key.matches).every(([left,right])=>answer.matches[left]===right);
    if(question.gameType==='tradeSimulation')return exactKeys(answer,['gameType','quantity'])&&answer.gameType==='tradeSimulation'&&Number.isSafeInteger(answer.quantity)&&answer.quantity===key.requiredQuantity;
    if(question.evidenceTask)return exactKeys(answer,['gameType','evidenceId','conclusion'])&&answer.gameType==='evidenceDecision'&&answer.evidenceId===key.correctEvidenceId&&answer.conclusion===key.correctAnswer;
    if(typeof answer!=='string'||!['A','B','C','D'].includes(answer))fail('assessment/invalid-request');
    return answer===key.correctAnswer;
}

async function loadContext(tx,uid,input) {
    if(input.kind==='daily') {
        const bank=await tx.list('dailyChallenges','status','active');
        const activity=selectDailyChallenge(bank,new Date(tx.now));
        if(!activity||activity.id!==input.challengeId)fail('assessment/content-unavailable');
        if(!integer(activity.assessmentVersion,1,Number.MAX_SAFE_INTEGER))fail('assessment/migration-required');
        return {activity,bank:[activity],collection:'dailyChallenges',passingScore:100,chapter:null,mission:null};
    }
    const chapter=await tx.get('chapters/'+input.chapterId);
    if(!active(chapter)||chapter.contentReady===false||!id(chapter.eraId)||!Number.isFinite(chapter.order))fail('assessment/content-unavailable');
    const era=await tx.get('eras/'+chapter.eraId);
    if(!active(era)||!Array.isArray(era.requiredChapterIds)||era.requiredChapterIds.length>100||era.requiredChapterIds.some(value=>!id(value)))fail('assessment/content-unavailable');
    const chapters=(await tx.list('chapters','eraId',chapter.eraId)).filter(c=>active(c)&&c.contentReady!==false);
    const missions=(await tx.list('missions','chapterId',input.chapterId)).filter(active);
    if(!chapters.some(c=>c.id===input.chapterId)||chapters.some(c=>!Number.isFinite(c.order))||new Set(chapters.map(c=>c.order)).size!==chapters.length||
        !missions.length||missions.some(m=>!Number.isFinite(m.order))||new Set(missions.map(m=>m.order)).size!==missions.length)fail('assessment/content-unavailable');
    missions.sort((a,b)=>a.order-b.order);
    const ownChapter=await tx.get('studentChapterProgress/'+ownedId(uid,input.chapterId));
    const ownMission=input.kind==='mission'?await tx.get('studentProgress/'+ownedId(uid,input.missionId)):null;
    const reviewing=completed(ownChapter,uid)||completed(ownMission,uid);
    if(!reviewing) {
        const required=new Set([...era.requiredChapterIds,...chapters.filter(c=>c.order<chapter.order&&c.requiredForProgression!==false).map(c=>c.id)]);
        for(const requiredId of required)if(!completed(await tx.get('studentChapterProgress/'+ownedId(uid,requiredId)),uid))fail('assessment/locked');
    }
    const mission=input.kind==='mission'?missions.find(m=>m.id===input.missionId):null;
    if(input.kind==='mission'&&!mission)fail('assessment/content-unavailable');
    for(const earlier of input.kind==='chapter'?missions:reviewing?[]:missions.filter(m=>m.order<mission.order)) {
        if(!completed(await tx.get('studentProgress/'+ownedId(uid,earlier.id)),uid))fail('assessment/locked');
    }
    const activity=await tx.get((input.kind==='mission'?'quizzes/':'chapterChallenges/')+(input.kind==='mission'?input.quizId:input.challengeId));
    if(!active(activity)||(input.kind==='mission'?activity.missionId!==input.missionId:activity.chapterId!==input.chapterId)||
        !integer(activity.assessmentVersion,1,Number.MAX_SAFE_INTEGER))fail('assessment/content-unavailable');
    if(typeof activity.passingScore!=='number'||!Number.isFinite(activity.passingScore)||activity.passingScore<0||activity.passingScore>100)fail('assessment/content-unavailable');
    const collection=input.kind==='mission'?'questions':'chapterChallengeQuestions';
    const bank=(await tx.list(collection,input.kind==='mission'?'quizId':'challengeId',activity.id)).filter(active);
    if(!bank.length||bank.length>400)fail('assessment/content-unavailable');
    return {activity,bank,collection,passingScore:activity.passingScore,chapter,mission};
}

export function createAssessmentService(store,{clock=Date.now,newId=randomUUID,randomNumber=random}={}) {
    async function transact(uid,callback) {
        if(typeof uid!=='string'||!uid||uid.length>128||/[\/\u0000-\u001f]/.test(uid))fail('assessment/unauthenticated');
        return store.runTransaction(async tx=>{
            tx.now=clock();
            const profile=await tx.get('users/'+uid);
            if(!active(profile)||profile.role!=='student')fail('assessment/forbidden');
            const policy=requireAssessmentPolicy(await tx.get('learningSettings/trustedAssessment'));
            return callback(tx,profile,policy);
        });
    }
    function validateStart(input) {
        if(!exactKeys(input,['kind','chapterId','missionId','quizId','challengeId'])||!['mission','chapter','daily'].includes(input.kind))fail('assessment/invalid-request');
        const required=input.kind==='mission'?['chapterId','missionId','quizId']:input.kind==='chapter'?['chapterId','challengeId']:['challengeId'];
        if(required.some(key=>!id(input[key]))||Object.keys(input).some(key=>key!=='kind'&&!required.includes(key)))fail('assessment/invalid-request');
    }
    return {
        async start(uid,input) {
            validateStart(input);
            return transact(uid,async(tx,profile,policy)=>{
                const day=learningDateKey(new Date(tx.now));
                const usageId=ownedId(uid,day),usage=await tx.get('serverAssessmentUsage/'+usageId)||{count:0,minute:Math.floor(tx.now/60000),minuteCount:0};
                if(usage.userId!==undefined&&usage.userId!==uid)fail('assessment/record-conflict');
                if(!integer(usage.count,0,1000)||!integer(usage.minute,0,Number.MAX_SAFE_INTEGER)||!integer(usage.minuteCount,0,20))fail('assessment/not-active');
                const minute=Math.floor(tx.now/60000),minuteCount=usage.minute===minute?usage.minuteCount:0;
                if(usage.count>=policy.perStudentDailyAttempts||minuteCount>=policy.perMinuteAttempts)fail('assessment/rate-limit');
                const ctx=await loadContext(tx,uid,input),historyId=ownedId(uid,input.kind+'_'+ctx.activity.id);
                const history=await tx.get('serverAssessmentHistory/'+historyId);
                if(history&&history.userId!==uid)fail('assessment/record-conflict');
                const selected=input.kind==='mission'?selectMissionQuestions(ctx.bank,ctx.activity,history?.lastQuestionIds||[],randomNumber,history?.seenQuestionIds||[],history?.topicMastery||{}).questions:ctx.bank;
                if(selected.length>200)fail('assessment/content-unavailable');
                const keys=[];
                for(const question of selected){const key=await tx.get(privateKeyPath(ctx.collection,question.id));validateKey(question,key,ctx.collection,ctx.activity);keys.push(key);}
                const attemptId=newId();if(!uuid(attemptId))fail('assessment/not-active');
                const attempt={userId:uid,attemptId,...input,activityId:ctx.activity.id,assessmentVersion:ctx.activity.assessmentVersion,
                    questions:selected,keys,issuedAt:tx.now,expiresAt:tx.now+policy.attemptTtlSeconds*1000,historyId};
                tx.create('serverAssessmentAttempts/'+ownedId(uid,attemptId),attempt);
                tx.set('serverAssessmentUsage/'+usageId,{userId:uid,dateKey:day,count:usage.count+1,minute,minuteCount:minuteCount+1});
                return {attemptId,expiresAt:attempt.expiresAt,passingScore:ctx.passingScore,questions:selected.map(publicQuestion)};
            });
        },
        async submit(uid,input) {
            if(!exactKeys(input,['attemptId','answers'])||!uuid(input.attemptId)||!record(input.answers))fail('assessment/invalid-request');
            const bounded=(value,depth=0)=>{
                if(depth>5)fail('assessment/invalid-request');
                if(typeof value==='string'){if(value.length>4096)fail('assessment/invalid-request');return;}
                if(typeof value==='number'&&Number.isSafeInteger(value))return;
                if(!record(value)||Object.keys(value).length>200)fail('assessment/invalid-request');
                for(const [key,child]of Object.entries(value)){if(key.length>128)fail('assessment/invalid-request');bounded(child,depth+1);}
            };
            bounded(input.answers);
            return transact(uid,async(tx,profile,policy)=>{
                const attemptPath='serverAssessmentAttempts/'+ownedId(uid,input.attemptId),attempt=await tx.get(attemptPath);
                if(!attempt||attempt.userId!==uid||attempt.attemptId!==input.attemptId)fail('assessment/attempt-unavailable');
                const signature=fingerprint(input.answers);
                if(attempt.result){if(attempt.answerFingerprint!==signature)fail('assessment/attempt-conflict');return {...attempt.result,replayed:true};}
                if(!integer(attempt.expiresAt,1,Number.MAX_SAFE_INTEGER)||attempt.expiresAt<=tx.now)fail('assessment/attempt-expired');
                if(attempt.kind==='daily'&&learningDateKey(new Date(attempt.issuedAt))!==learningDateKey(new Date(tx.now)))fail('assessment/attempt-expired');
                const ctx=await loadContext(tx,uid,attempt);
                if(ctx.activity.assessmentVersion!==attempt.assessmentVersion)fail('assessment/content-changed');
                if(Object.keys(input.answers).length!==attempt.questions.length||attempt.questions.some(q=>!Object.hasOwn(input.answers,q.id)))fail('assessment/invalid-request');
                const marks=attempt.questions.map((q,i)=>mark(q,attempt.keys[i],input.answers[q.id]));
                const correctAnswers=marks.filter(Boolean).length,score=Math.round(correctAnswers/marks.length*100),passed=score>=ctx.passingScore;
                const topicsForReview=[...new Set(attempt.questions.filter((q,i)=>!marks[i]&&typeof q.topic==='string').map(q=>q.topic))];
                const kind=attempt.kind,recordId=kind==='mission'?attempt.missionId:kind==='chapter'?attempt.chapterId:learningDateKey(new Date(tx.now));
                const collection=kind==='mission'?'studentProgress':kind==='chapter'?'studentChapterProgress':'studentDailyChallenges';
                const progressPath=collection+'/'+ownedId(uid,recordId),progress=await tx.get(progressPath);
                if(progress&&(progress.userId!==uid||progress.completed!==true||progress.serverVerified===true&&!integer(progress.bestScore,0,100)))fail('assessment/record-conflict');
                const firstCompletion=passed&&!progress;
                const authoredReward=kind==='chapter'?0:safeXp(kind==='mission'?ctx.mission.xpReward??0:ctx.activity.xpReward??0);
                const xpReward=firstCompletion?authoredReward:0,totalXp=safeXp(profile.xp??0)+xpReward;
                if(!Number.isSafeInteger(totalXp))fail('assessment/content-unavailable');
                const progressionPolicy=requireProgressionPolicy(await tx.get('learningSettings/progression')),level=progressionState(totalXp,progressionPolicy).level;
                const catalogs=kind==='daily'?[]:await tx.list(kind==='mission'?'artifacts':'badges',kind==='mission'?'missionId':'chapterId',recordId);
                const catalog=catalogs.find(active)||null;
                const ownershipPath=catalog?(kind==='mission'?'studentArtifacts/':'studentBadges/')+ownedId(uid,catalog.id):null;
                const owned=ownershipPath?await tx.get(ownershipPath):null;
                const history=await tx.get('serverAssessmentHistory/'+attempt.historyId)||{};
                if(owned&&owned.userId!==uid||history.userId!==undefined&&history.userId!==uid)fail('assessment/record-conflict');
                const newlyEarned=passed&&!!catalog&&!owned;
                const timestamp=tx.timestamp();
                let learningStreak=integer(profile.learningStreak,0,Number.MAX_SAFE_INTEGER)?profile.learningStreak:0;
                if(firstCompletion) {
                    const completion={userId:uid,completed:true,bestScore:score,completedAt:timestamp,updatedAt:timestamp,serverVerified:true};
                    if(kind==='mission')Object.assign(completion,{chapterId:attempt.chapterId,missionId:attempt.missionId,quizId:ctx.activity.id,xpEarned:xpReward});
                    if(kind==='chapter')Object.assign(completion,{chapterId:attempt.chapterId,challengeId:ctx.activity.id});
                    if(kind==='daily')Object.assign(completion,{challengeId:ctx.activity.id,dateKey:recordId,correct:true,selectedAnswer:input.answers[ctx.activity.id],xpEarned:xpReward});
                    tx.create(progressPath,completion);
                    if(kind!=='chapter') {
                        const update={xp:totalXp,level,updatedAt:timestamp,lastRewardKind:kind,lastRewardId:recordId};
                        if(kind==='daily'){
                            const yesterday=learningDateKey(new Date(tx.now-86400000));
                            learningStreak=profile.lastStreakDate===recordId?Math.max(1,learningStreak):profile.lastStreakDate===yesterday?learningStreak+1:1;
                            Object.assign(update,{learningStreak,lastStreakDate:recordId});
                        }
                        tx.update('users/'+uid,update);
                    }
                }else if(passed&&kind!=='daily')tx.update(progressPath,{bestScore:progress.serverVerified===true?Math.max(score,progress.bestScore||0):score,updatedAt:timestamp,serverVerified:true});
                if(newlyEarned)tx.create(ownershipPath,{userId:uid,chapterId:attempt.chapterId,earnedAt:timestamp,
                    ...(kind==='mission'?{missionId:attempt.missionId,artifactId:catalog.id}:{challengeId:ctx.activity.id,badgeId:catalog.id})});
                const result={score,correctAnswers,totalQuestions:marks.length,passed,topicsForReview,firstCompletion,xpReward,totalXp,level,learningStreak,progressionPolicy,
                    bestScore:Math.max(score,progress?.bestScore||0),artifactResult:{artifact:kind==='mission'?catalog:null,newlyEarned:kind==='mission'&&newlyEarned},
                    badgeResult:{badge:kind==='chapter'?catalog:null,newlyEarned:kind==='chapter'&&newlyEarned}};
                // Only private server records supply adaptive selection history.
                const topicMastery=structuredClone(history.topicMastery||{});
                attempt.questions.forEach((q,i)=>{if(typeof q.topic!=='string')return;const old=topicMastery[q.topic]||{attempted:0,correct:0,missed:0};topicMastery[q.topic]={attempted:old.attempted+1,correct:old.correct+(marks[i]?1:0),missed:old.missed+(marks[i]?0:1),state:marks[i]?'assessed':'review-needed'};});
                tx.set('serverAssessmentHistory/'+attempt.historyId,{userId:uid,lastQuestionIds:attempt.questions.map(q=>q.id),seenQuestionIds:[...new Set([...(history.seenQuestionIds||[]),...attempt.questions.map(q=>q.id)])].slice(-400),topicMastery});
                tx.update(attemptPath,{answers:input.answers,answerFingerprint:signature,result,submittedAt:tx.now});
                if(kind==='mission')tx.create('studentQuizAttempts/'+ownedId(uid,input.attemptId),{userId:uid,chapterId:attempt.chapterId,missionId:attempt.missionId,quizId:ctx.activity.id,attemptId:input.attemptId,
                    questionIds:attempt.questions.map(q=>q.id),answers:input.answers,score,correctAnswers,totalQuestions:marks.length,passed,topicsForReview,completedAt:timestamp,response:result,serverVerified:true});
                return result;
            });
        }
    };
}
