const {
  HttpsError
} = require('firebase-functions/v2/https');
const {
  getAuth
} = require('firebase-admin/auth');
const {
  createAssessmentService,
  assessmentStore
} = require('./student-assessment');
function assessmentHandlers(db, timestamp) {
  const service = createAssessmentService(assessmentStore(db, timestamp));
  const handler = method => async request => {
    if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Please sign in to continue.');
    // Emulator invocation must still use real emulator Auth; only App Check is
    // unavailable there. Production onCall additionally enforces App Check.
    if (process.env.FUNCTIONS_EMULATOR !== 'true' && !request.app) throw new HttpsError('unauthenticated', 'App verification is required.');
    try {
      const bearer = request.rawRequest?.headers?.authorization?.match(/^Bearer (.+)$/i);
      if (!bearer) throw new HttpsError('unauthenticated', 'Please sign in again.');
      const identity = await getAuth().verifyIdToken(bearer[1], true);
      if (identity.uid !== request.auth.uid) throw new HttpsError('unauthenticated', 'Please sign in again.');
      return await service[method](request.auth.uid, request.data);
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      if (/^auth\//.test(error.code || '')) throw new HttpsError('unauthenticated', 'Please sign in again.');
      if (!String(error.code || '').startsWith('assessment/')) {
        console.error('Assessment failure', error.code || 'internal');
        throw new HttpsError('unavailable', 'Your assessment could not be saved. Retry the same request.');
      }
      const code = /unauthenticated/.test(error.code) ? 'unauthenticated' : /forbidden|locked/.test(error.code) ? 'permission-denied' : /rate-limit/.test(error.code) ? 'resource-exhausted' : /invalid|unissued/.test(error.code) ? 'invalid-argument' : 'failed-precondition';
      throw new HttpsError(code, error.code, {
        assessmentCode: error.code
      });
    }
  };
  return {
    start: handler('start'),
    advance: handler('advance'),
    resume: handler('resume'),
    submit: handler('submit')
  };
}
module.exports = {
  assessmentHandlers
};
