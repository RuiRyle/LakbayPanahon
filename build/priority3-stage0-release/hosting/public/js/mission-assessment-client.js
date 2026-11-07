import { beginAssessment } from './student-assessment-client.js';
export async function startMissionQuiz({
  chapterId,
  missionId,
  quizId,
  attemptId
}) {
  if(globalThis.__lakbayExplorationPreview===true){const {startPreviewMission}=await import('./assessment-preview.js');return startPreviewMission({chapterId,missionId,quizId,attemptId});}
  const state = await beginAssessment({
    kind: 'mission',
    chapterId,
    missionId,
    quizId
  }, {
    attemptId,completedReview:true
  });
  return {
    ...state,
    secured: true,
    questions: state.questions,
    questionBank: state.questions,
    adaptiveQuestions: state.followupQuestions,
    seenQuestionIds: [],
    seenAdaptiveIds: [],
    topicMastery: state.topicMastery,
    attemptNumber: state.attemptNumber,
    repeatedQuestions: state.repeatedQuestions
  };
}
