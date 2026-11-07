// Explicit exploration preview only. Reads catalog content; never persists
// attempts, completion, ownership, XP, or server assessment requests.
import {db} from './firebase-config.js';
import {collection,getDocs,query,where} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {selectMissionQuestions,validateAdaptiveQuestionSet,diagnoseMissionTopics} from './mission-assessment.js';
import {evidenceDecisionCorrect} from './evidence-decision.js';
const rows=async(name,field,value)=>(await getDocs(query(collection(db,name),where(field,'==',value)))).docs.map(d=>({...d.data(),id:d.id})).filter(q=>q.status==='active');
const guard=()=>{if(globalThis.__lakbayExplorationPreview!==true)throw Error('Exploration preview is not active.');};
export async function startPreviewMission({missionId,quizId,attemptId}){
 guard();const quiz=(await rows('quizzes','missionId',missionId)).find(q=>q.id===quizId);if(!quiz)throw Error('Quiz unavailable.');
 const bank=await rows('questions','quizId',quizId),practice=await rows('practiceQuestions','missionId',missionId),issued=selectMissionQuestions(bank,quiz);guard();
 return{...issued,attemptId,questionBank:bank,adaptiveQuestions:practice,topicMastery:{},seenQuestionIds:[],seenAdaptiveIds:[],passingScore:quiz.passingScore,practicePolicy:quiz.practicePolicy,attemptNumber:1,secured:false,preview:true};
}
export async function previewActivity(input){
 guard();if(input.kind==='daily')throw Error('Daily rewards require verified assessment saving.');
 const mission=input.kind==='mission',activity=(await rows(mission?'quizzes':'chapterChallenges',mission?'missionId':'chapterId',mission?input.missionId:input.chapterId)).find(q=>q.id===(mission?input.quizId:input.challengeId));if(!activity)throw Error('Activity unavailable.');
 const bank=await rows(mission?'questions':'chapterChallengeQuestions',mission?'quizId':'challengeId',activity.id),questions=mission?validateAdaptiveQuestionSet(bank,activity,input.questionIds):bank;
 const correctAnswers=questions.filter(q=>{const a=input.answers?.[q.id];if(q.evidenceTask)return evidenceDecisionCorrect(q,a);if(q.gameType==='matching')return a?.gameType==='matching'&&q.matchingPairs.every(p=>a.matches?.[p.left]===p.right);if(q.gameType==='tradeSimulation')return a?.gameType==='tradeSimulation'&&a.quantity===Number(q.requiredQuantity);return a===q.correctAnswer;}).length;
 const score=Math.round(correctAnswers/questions.length*100);guard();return{score,correctAnswers,totalQuestions:questions.length,passed:score>=activity.passingScore,topicsForReview:mission?diagnoseMissionTopics(questions,input.answers):[],preview:true,firstCompletion:false,xpReward:0,artifactResult:{artifact:null,newlyEarned:false},badgeResult:{badge:null,newlyEarned:false}};
}
