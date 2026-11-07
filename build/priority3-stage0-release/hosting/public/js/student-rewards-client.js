import { beginAssessment, assessmentState, assessmentAction, submitAssessment } from './student-assessment-client.js';
// Canonical progress and rewards are written exclusively by the trusted service.
export async function submitStudentActivity(input) {
  if(!['mission','chapter','daily'].includes(input?.kind))throw Error('Invalid activity.');
  if(globalThis.__lakbayExplorationPreview===true&&input.kind!=='daily'){const {previewActivity}=await import('./assessment-preview.js');return previewActivity(input);}
  const identity = input.kind === 'mission' ? {
    kind: 'mission',
    chapterId: input.chapterId,
    missionId: input.missionId,
    quizId: input.quizId
  } : input.kind === 'chapter' ? {
    kind: 'chapter',
    chapterId: input.chapterId,
    challengeId: input.challengeId
  } : {
    kind: 'daily',
    challengeId: input.challengeId
  };
  if (!assessmentState(identity)) await beginAssessment(identity);
  const answers = identity.kind === 'daily' ? {
    [identity.challengeId]: input.answer
  } : input.answers;
  if (identity.kind !== 'mission' && !assessmentState(identity).result && JSON.stringify(assessmentState(identity).answers) !== JSON.stringify(answers)) await assessmentAction(identity, {
    action: 'answers',
    answers
  });
  return submitAssessment(identity);
}
