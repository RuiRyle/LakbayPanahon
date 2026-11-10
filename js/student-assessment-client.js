import { app, auth, db } from './firebase-config.js';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-functions.js';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, getToken } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app-check.js';
import { doc, getDocFromServer } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import { firebaseEnvironment } from './firebase-environment.js';
const functions = getFunctions(app, 'asia-southeast1');
if (firebaseEnvironment?.mode === 'emulator') connectFunctionsEmulator(functions, '127.0.0.1', 5001);
const attempts = new Map(),
  pendingActions = new Map();
let ready;
let assessmentAppCheck;
async function prepare() {
  if (firebaseEnvironment?.mode === 'emulator') return;
  const snapshot = await getDocFromServer(doc(db, 'learningSettings', 'bayaniAI')),
    siteKey = snapshot.data()?.appCheckSiteKey;
  if (typeof siteKey !== 'string' || !siteKey) throw Error('Assessment verification is unavailable. Please try again later.');
  try {
    assessmentAppCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true
    });
  } catch (error) {
    if (error.code !== 'appCheck/already-initialized') throw error;
    // Another feature already initialized this app. The Functions SDK uses
    // that existing provider; do not replace Bayani's App Check configuration.
  }
}
function key(identity) {
  const context=classroomIdentity(identity).classroom;
  return auth.currentUser?.uid + ':' + identity.kind + ':' + (identity.missionId || identity.chapterId || identity.challengeId)+(context?':class:'+context.classId+':'+context.assignmentId:'');
}
function classroomIdentity(identity){
  if(identity.kind!=='mission')return identity;
  const params=new URLSearchParams(globalThis.location?.search||'');
  const classId=params.get('classroom'),assignmentId=params.get('activity');
  const valid=value=>typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value);
  if((classId||assignmentId)&&(!valid(classId)||!valid(assignmentId)))throw Error('Reopen this assignment from My Class.');
  return classId&&assignmentId?{...identity,classroom:{classId,assignmentId}}:identity;
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
  if (firebaseEnvironment?.mode !== 'emulator' && assessmentAppCheck) {
    try {
      const attestation = await getToken(assessmentAppCheck, false);
      if (!attestation?.token) throw Error('Missing attestation');
    } catch {
      throw Error('App verification is unavailable. Please try again later.');
    }
  }
  try {
    const result = (await httpsCallable(functions, name)(data)).data;
    if (auth.currentUser?.uid !== uid) throw Error('Your account changed. Reopen the activity.');
    return result;
  } catch (error) {
    const code = error.details?.assessmentCode || '';
    if(/classroom-(unavailable|changed)/.test(code))throw Object.assign(Error('This class activity or your membership changed. Return to My Class, refresh, and open the current assignment. Your personal progress is safe.'),{code:'assessment/restart-required'});
    if (/revision-conflict|request-conflict/.test(code)) throw Error('This assessment changed in another session. Reopen it to continue from your saved place.');
    if (/expired|content-changed|attempt-unavailable|restart-required/.test(code)) throw Object.assign(Error('Please restart this unfinished assessment. Your completed missions and earned rewards are still saved.'), {
      code: 'assessment/restart-required'
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
  let cached;
  try {
    cached = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
  } catch {}
  if (!retry && (attemptId || cached?.attemptId)) {
    try {
      const state = await call('resumeStudentAssessment', {
        attemptId: attemptId || cached.attemptId
      });
      if(JSON.stringify(state.classroom?{classId:state.classroom.classId,assignmentId:state.classroom.assignmentId}:null)!==JSON.stringify(identity.classroom||null))throw Object.assign(Error('Reopen this assignment from My Class.'),{code:'assessment/restart-required'});
      if (!state.result || (completedReview && !identity.classroom)) {
        attempts.set(key(identity), state);
        return state;
      }
      cached = null;
    } catch (error) {
      if (error.code !== 'assessment/restart-required') throw error;
      cached = null;
    }
  }
  const request = requestId || !retry && cached?.requestId || crypto.randomUUID();
  try {
    sessionStorage.setItem(storageKey, JSON.stringify({
      requestId: request
    }));
  } catch {}
  const state = await call('startStudentAssessment', {
    ...identity,
    requestId: request
  });
  attempts.set(key(identity), state);
  try {
    sessionStorage.setItem(storageKey, JSON.stringify({
      requestId: request,
      attemptId: state.attemptId
    }));
  } catch {}
  return state;
}
export function assessmentState(identity) {
  return attempts.get(key(identity));
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
  attempts.delete(key(identity));
  try {
    sessionStorage.removeItem('securedAssessment:' + key(identity));
  } catch {}
}
