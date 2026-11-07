// Explicit UI-only callable fixtures. Security, real transactions and actual
// transport are tested separately by student-security.test.cjs + real browser.
function fixtureSource(name,source,recordMap){
 if(name==='mission-assessment-client.js')return `async function startMissionQuiz({missionId,quizId,attemptId,questionIds}){
 const catalog=(await getDocs(query(collection(db,'quizzes'),where('missionId','==',missionId)))).docs.map(d=>({...d.data(),id:d.id}));
 const quiz=catalog.find(q=>q.id===quizId),bank=(await getDocs(query(collection(db,'questions'),where('quizId','==',quizId)))).docs.map(d=>({...d.data(),id:d.id})).filter(q=>q.status==='active');
 const attempts=[...${recordMap}].filter(([key,row])=>key.startsWith('studentQuizAttempts/')&&row.userId===auth.currentUser.uid&&row.quizId===quizId).map(([,row])=>row);
 const previous=attempts.at(-1)?.questionIds||[];const issued=questionIds?{questions:validateAdaptiveQuestionSet(bank,quiz,questionIds)}:selectMissionQuestions(bank,quiz,previous,()=>.25,attempts.flatMap(a=>a.questionIds));
 return{...issued,attemptId,secured:false,questionBank:bank,adaptiveQuestions:[],passingScore:quiz.passingScore,practicePolicy:quiz.practicePolicy,topicMastery:{},attemptNumber:attempts.length+1};
 }`;
 if(name!=='student-rewards-client.js')return source;
 return `const beginAssessment=async()=>({}),forgetAssessment=()=>{},assessmentState=()=>null;
 async function submitStudentActivity(input){
 const owner=auth.currentUser?.uid;if(!owner)throw Error('Sign in');const mission=input.kind==='mission',chapter=input.kind==='chapter';
 const catalogName=mission?'quizzes':chapter?'chapterChallenges':'dailyChallenges',field=mission?'missionId':chapter?'chapterId':'id',identity=mission?input.missionId:chapter?input.chapterId:input.challengeId;
 const activity=(await getDocs(query(collection(db,catalogName),where(field,'==',identity)))).docs.map(d=>({...d.data(),id:d.id})).find(q=>q.id===(input.quizId||input.challengeId));if(!activity)throw Error('Unavailable');
 const bank=mission?(await getDocs(query(collection(db,'questions'),where('quizId','==',activity.id)))).docs.map(d=>({...d.data(),id:d.id})):(await getDocs(query(collection(db,'chapterChallengeQuestions'),where('challengeId','==',activity.id)))).docs.map(d=>({...d.data(),id:d.id}));
 const questions=mission?validateAdaptiveQuestionSet(bank,activity,input.questionIds):bank;
 const correct=questions.filter(q=>{const a=input.answers[q.id];if(q.evidenceTask)return evidenceDecisionCorrect(q,a);if(q.gameType==='matching')return a?.gameType==='matching'&&q.matchingPairs.every(p=>a.matches?.[p.left]===p.right);if(q.gameType==='tradeSimulation')return a?.quantity===Number(q.requiredQuantity);return a===q.correctAnswer;}).length,score=Math.round(correct/questions.length*100),passed=score>=activity.passingScore;
 const topics=mission?diagnoseMissionTopics(questions,input.answers):[];
 return runTransaction(db,async tx=>{const profilePath='users/'+owner,profile=(await tx.get(profilePath)).data(),policy=(await tx.get('learningSettings/progression')).data();if(auth.currentUser?.uid!==owner)throw Error('Session changed');
 const progressPath=(mission?'studentProgress/':'studentChapterProgress/')+owner+'_'+(input.missionId||input.chapterId),progress=await tx.get(progressPath),firstCompletion=passed&&!progress.exists();const reward=mission?Number(${recordMap}.get('missions/'+input.missionId)?.xpReward)||0:0,xpReward=firstCompletion?reward:0,totalXp=(profile.xp||0)+xpReward,level=progressionState(totalXp,policy).level;
 const item=[...${recordMap}].filter(([k,row])=>k.startsWith(mission?'artifacts/':'badges/')&&row[mission?'missionId':'chapterId']===(input.missionId||input.chapterId)).map(([k,row])=>({...row,id:k.split('/')[1]}))[0],ownedPath=item?(mission?'studentArtifacts/':'studentBadges/')+owner+'_'+item.id:null,owned=ownedPath?await tx.get(ownedPath):null,newlyEarned=passed&&!!item&&!owned.exists();
 const result={score,correctAnswers:correct,passed,topicsForReview:topics,firstCompletion,xpReward,totalXp,level,progressionPolicy:policy,bestScore:Math.max(score,progress.data()?.bestScore||0),artifactResult:{artifact:mission?item:null,newlyEarned:mission&&newlyEarned},badgeResult:{badge:chapter?item:null,newlyEarned:chapter&&newlyEarned}};
 if(firstCompletion){tx.set(progressPath,{userId:owner,completed:true,missionId:input.missionId||null,chapterId:input.chapterId,bestScore:score,completedAt:serverTimestamp()});if(mission)tx.update(profilePath,{xp:totalXp,level});}
 if(newlyEarned)tx.set(ownedPath,{userId:owner,[mission?'artifactId':'badgeId']:item.id});if(mission)tx.set('studentQuizAttempts/'+owner+'_'+input.attemptId,{userId:owner,quizId:activity.id,questionIds:input.questionIds,answers:input.answers,score,passed,topicsForReview:topics});return result;});
 }`;
}
module.exports={fixtureSource};
