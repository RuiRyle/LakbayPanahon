import { app, auth, db } from './firebase-config.js';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-functions.js';
import {sharedAppCheck,verifyAppCheck} from './app-verification.js';
import { doc, getDocFromServer } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import { firebaseEnvironment } from './firebase-environment.js';
import { readQuizRecovery, writeQuizRecovery, clearQuizRecovery } from './student-session-storage.js';
let functions = getFunctions(app, 'asia-southeast1');
if (firebaseEnvironment?.mode === 'emulator') connectFunctionsEmulator(functions, '127.0.0.1', 5001);
const attempts = new Map(),
  issuanceRequests = new Map(),
  pendingActions = new Map();
let ready;
let assessmentSiteKey;
async function prepare() {
  if (firebaseEnvironment?.mode === 'emulator') return;
  const [snapshot,assessment] = await Promise.all([getDocFromServer(doc(db, 'learningSettings', 'bayaniAI')),getDocFromServer(doc(db,'learningSettings','securedAssessment'))]),
    siteKey = snapshot.data()?.appCheckSiteKey;
  if(assessment.data()?.enabled===false)throw Error('Quiz saving is not activated yet. Your progress is safe. Please wait while the assessment backend is connected.');
  const endpoint=assessment.data()?.backendUrl;
  if(endpoint){let url;try{url=new URL(endpoint);}catch{throw Error('Assessment backend configuration is invalid.');}
    if(url.protocol!=='https:'||url.origin!==endpoint||url.username||url.password)throw Error('Assessment backend configuration is invalid.');
    functions=getFunctions(app,endpoint);
  }
  if (typeof siteKey !== 'string' || !siteKey) throw Error('Assessment verification is unavailable. Please try again later.');
  assessmentSiteKey=siteKey;
  sharedAppCheck(siteKey);
}
function key(identity) {
  const context=classroomIdentity(identity).classroom;
  return auth.currentUser?.uid + ':' + identity.kind + ':' + JSON.stringify([
    identity.chapterId, identity.missionId, identity.quizId, identity.challengeId, context?.classId, context?.assignmentId
  ]);
}
function previousAssessmentKey(identity) {
  const context = identity.classroom;
  return auth.currentUser?.uid + ':' + identity.kind + ':' + (identity.missionId || identity.chapterId || identity.challengeId)
    + (context ? ':class:' + context.classId + ':' + context.assignmentId : '');
}
function matchesAssessment(identity, state) {
  return state?.kind === identity.kind && ['chapterId','missionId','quizId','challengeId'].every(field =>
    (state[field] ?? null) === (identity[field] ?? null));
}
function classroomIdentity(identity){
  if(identity.kind!=='mission')return identity;
  const params=new URLSearchParams(globalThis.location?.search||'');
  const classId=params.get('classroom'),assignmentId=params.get('activity');
  const valid=value=>typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value);
  if((classId||assignmentId)&&(!valid(classId)||!valid(assignmentId)))throw Error('Reopen this assignment from My Class.');
  return classId&&assignmentId?{...identity,classroom:{classId,assignmentId}}:identity;
}
function quizRecoveryScope(identity) {
  return JSON.stringify([identity.chapterId, identity.missionId, identity.quizId,
    identity.classroom?.classId, identity.classroom?.assignmentId]);
}
function saveAssessmentReference(storageKey, recovery, reference) {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(reference));
    if (recovery) clearQuizRecovery(recovery.uid, recovery.scope);
  } catch {
    if (recovery) writeQuizRecovery(recovery.uid, recovery.scope, reference);
  }
}
async function call(name, data) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw Error('Please sign in to continue.');
  ready = ready || prepare().catch(error => {
    ready = null;
    throw error;
  });
  await ready;
  // The Functions SDK sends this token automatically. Fail before issuance if
  // attestation is unavailable; never substitute a debug token in production.
  if (firebaseEnvironment?.mode !== 'emulator') await verifyAppCheck(assessmentSiteKey);
  if (auth.currentUser?.uid !== uid) throw Error('Your account changed. Reopen the activity.');
  try {
    const result = (await httpsCallable(functions, name)(data)).data;
    if (auth.currentUser?.uid !== uid) throw Error('Your account changed. Reopen the activity.');
    return result;
  } catch (error) {
    const code = error.details?.assessmentCode || '';
    if(/classroom-(unavailable|changed)/.test(code))throw Object.assign(Error('This class activity or your membership changed. Open My Class to check your current assignments. Your personal progress is safe.'),{code:'assessment/classroom-changed'});
    if (/revision-conflict|request-conflict/.test(code)) throw Object.assign(Error('This attempt changed in another tab. Reopen it to continue from the latest saved answer.'),{code:'assessment/reopen-required'});
    if (/expired|content-changed|attempt-unavailable|restart-required/.test(code)) throw Object.assign(Error('Please restart this unfinished assessment. Your completed missions and earned rewards are still saved.'), {
      code: 'assessment/restart-required',
      assessmentCode: code
    });
    if (/locked/.test(code)) throw Error('Complete the required missions and chapters first.');
    if (/not-active/.test(code)) throw Error('Assessment saving is being prepared. Your earned progress is safe. Please try again later.');
    throw error;
  }
}
export async function beginAssessment(identity, {
  attemptId = null,
  requestId = null,
  retry = false,
  completedReview = false
} = {}) {
  identity=classroomIdentity(identity);
  const storageKey = 'securedAssessment:' + key(identity);
  const recovery = identity.kind === 'mission' && auth.currentUser?.uid
    ? {uid: auth.currentUser.uid, scope: quizRecoveryScope(identity)}
    : null;
  let cached;
  let legacyAttempt;
  try {
    cached = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    if (!cached) legacyAttempt = JSON.parse(sessionStorage.getItem('securedAssessment:' + previousAssessmentKey(identity)) || 'null')?.attemptId;
  } catch {}
  const fromHistory = !retry && recovery && readQuizRecovery(recovery.uid, recovery.scope);
  if (fromHistory) cached = fromHistory;
  const resumeId = fromHistory ? fromHistory.attemptId : attemptId || cached?.attemptId || legacyAttempt;
  if (!retry && resumeId) {
    try {
      const state = await call('resumeStudentAssessment', {
        attemptId: resumeId
      });
      if (!matchesAssessment(identity, state)) {
        throw Object.assign(Error('The saved attempt belongs to a different activity.'),{code:'assessment/restart-required'});
      }
      if(JSON.stringify(state.classroom?{classId:state.classroom.classId,assignmentId:state.classroom.assignmentId}:null)!==JSON.stringify(identity.classroom||null))throw Object.assign(Error('Reopen this assignment from My Class.'),{code:'assessment/restart-required'});
      if (!state.result || completedReview) {
        attempts.set(key(identity), state);
        saveAssessmentReference(storageKey, recovery, {requestId: cached?.requestId, attemptId: state.attemptId});
        return state;
      }
      cached = null;
    } catch (error) {
      if (error.code !== 'assessment/restart-required') throw error;
      cached = null;
    }
  }
  const request = requestId || !retry && (cached?.requestId || issuanceRequests.get(storageKey)) || crypto.randomUUID();
  // Persist the request before transmission so a lost reply can be retried
  // after a reload. The history fallback holds identifiers only.
  issuanceRequests.set(storageKey, request);
  saveAssessmentReference(storageKey, recovery, {requestId: request});
  let state;
  try {
    state = await call('startStudentAssessment', {...identity, requestId: request});
  } catch (error) {
    // A replay that definitively cannot resume must not lock the learner
    // into retrying the same issuance forever.
    if ((error.code === 'assessment/reopen-required' || error.code === 'assessment/restart-required') &&
        issuanceRequests.get(storageKey) === request) {
      issuanceRequests.delete(storageKey);
      try { sessionStorage.removeItem(storageKey); } catch {}
      if (recovery) clearQuizRecovery(recovery.uid, recovery.scope);
    }
    throw error;
  }
  issuanceRequests.delete(storageKey);
  attempts.set(key(identity), state);
  saveAssessmentReference(storageKey, recovery, {requestId: request, attemptId: state.attemptId});
  return state;
}
export function assessmentState(identity) {
  return attempts.get(key(identity));
}
export async function checkAssessmentResult(identity) {
  const k = key(classroomIdentity(identity));
  const state = attempts.get(k);
  const user = auth.currentUser;
  if (!state || !user) throw Error('Reopen the assessment to check its saved result.');
  const saved = await call('resumeStudentAssessment', {attemptId: state.attemptId});
  if (auth.currentUser !== user || attempts.get(k) !== state ||
      saved?.attemptId !== state.attemptId || saved.kind !== state.kind ||
      saved.chapterId !== state.chapterId || saved.missionId !== state.missionId ||
      saved.quizId !== state.quizId || saved.challengeId !== state.challengeId ||
      saved.classroom?.classId !== state.classroom?.classId ||
      saved.classroom?.assignmentId !== state.classroom?.assignmentId ||
      saved.classroom?.version !== state.classroom?.version) {
    throw Error('This result could not be matched to the open assessment.');
  }
  return saved.result ? {result: saved.result, answers: saved.answers} : null;
}
export async function assessmentAction(identity, action) {
  const k = key(identity),
    state = attempts.get(k);
  if (!state) throw Error('Reopen this assessment before continuing.');
  const signature = JSON.stringify({
    attemptId: state.attemptId,
    revision: state.revision,
    ...action
  });
  let input = pendingActions.get(signature);
  if (!input) {
    input = {
      attemptId: state.attemptId,
      revision: state.revision,
      requestId: crypto.randomUUID(),
      ...action
    };
    pendingActions.set(signature, input);
  }
  const next = await call('advanceStudentAssessment', input);
  attempts.set(k, next);
  pendingActions.delete(signature);
  return next;
}
export async function submitAssessment(identity) {
  const k = key(identity),
    state = attempts.get(k);
  if (!state) throw Error('Reopen the assessment before saving.');
  const result = await call('submitStudentActivity', {
    attemptId: state.attemptId,
    revision: state.revision
  });
  state.result = result;
  return result;
}
export function forgetAssessment(identity) {
  identity = classroomIdentity(identity);
  attempts.delete(key(identity));
  issuanceRequests.delete('securedAssessment:' + key(identity));
  if (identity.kind === 'mission') clearQuizRecovery(auth.currentUser?.uid, quizRecoveryScope(identity));
  try {
    sessionStorage.removeItem('securedAssessment:' + key(identity));
    sessionStorage.removeItem('securedAssessment:' + previousAssessmentKey(identity));
  } catch {}
}
