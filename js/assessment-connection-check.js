// Read-only setup check. No issuance, answers, submissions or reward writes.
import {app,auth,db} from './firebase-config.js';
import {doc,getDocFromServer} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {initializeAppCheck,ReCaptchaEnterpriseProvider,getToken} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app-check.js';
import {getFunctions,httpsCallable} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-functions.js';
export async function verifyAssessmentConnection(){
 if(['localhost','127.0.0.1','[::1]'].includes(globalThis.location?.hostname)&&!(globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN===true||typeof globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN)))throw Error('Local App Check debug mode is not active in this frame. Select quiz.html in Console, enable the local debug setting, and reload before retrying.');
 await auth.authStateReady();if(!auth.currentUser)throw Error('Sign in with your student test account first.');
 const [policy,appSettings]=await Promise.all([getDocFromServer(doc(db,'learningSettings','securedAssessment')),getDocFromServer(doc(db,'learningSettings','bayaniAI'))]);
 const settings=policy.data(),siteKey=appSettings.data()?.appCheckSiteKey;
 if(settings?.enabled!==false)throw Error('This setup check requires Firestore grading to remain disabled.');
 if(settings.backendUrl!=='https://lakbaypanahon-assessment.onrender.com')throw Error('The Render backend address does not match the reviewed service.');
 if(!siteKey)throw Error('App Check site key is missing.');
 let attestation;
 try{attestation=initializeAppCheck(app,{provider:new ReCaptchaEnterpriseProvider(siteKey),isTokenAutoRefreshEnabled:true});}
 catch(error){if(error.code!=='appCheck/already-initialized')throw error;}
 if(attestation)await getToken(attestation,true);
 try{await httpsCallable(getFunctions(app,settings.backendUrl),'resumeStudentAssessment')({attemptId:crypto.randomUUID()});throw Error('Unexpected result: keep grading disabled and review configuration.');}
 catch(error){if(error.details?.assessmentCode==='assessment/not-active'){const result={verified:true,authentication:true,appCheck:true,backendFirestoreRead:true,gradingEnabled:false};console.log('PASS: Render authenticated connection verified. Grading remains disabled.');return result;}throw error;}
}
