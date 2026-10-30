import {app,auth,db} from './firebase-config.js';
import {doc,getDocFromServer} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {createBayaniBackendClient,validateBayaniBackendEndpoint} from './bayani-backend-client.js';

// Model selection and authored assistant instructions belong to Firestore.
export async function connectBayani() {
    if(!auth.currentUser)throw Error('Please sign in to use Bayani AI.');
    const uid=auth.currentUser.uid;
    const snapshot=await getDocFromServer(doc(db,'learningSettings','bayaniAI'));
    if(auth.currentUser?.uid!==uid)throw Error('Your session changed. Please reconnect.');
    const settings=snapshot.exists()?snapshot.data():null;
    if(!settings?.enabled)throw Error('Bayani AI is not available yet. Please try again later.');
    // This is a Grade 5 application. Never fall back to the legacy Gemini
    // Developer API route or infer approval from a working connection.
    if(settings.provider!=='anthropic'||settings.minorsUseApproved!==true) {
        throw Error('Bayani AI is being prepared for student use. You can continue with your lessons and practice.');
    }
    if(!Number.isInteger(settings.maxMessageCharacters)||settings.maxMessageCharacters<1||settings.maxMessageCharacters>4000)throw Error('Bayani AI settings are incomplete. Please try again later.');
    validateBayaniBackendEndpoint(settings.backendEndpoint);
    if(!settings.appCheckSiteKey)throw Error('Bayani AI is still being connected. Please try again later.');
    // Explicit opt-in for this local browser tab; never activate debug mode on a hosted domain.
    const localHost = ['localhost','127.0.0.1','[::1]'].includes(globalThis.location?.hostname);
    if(localHost && globalThis.sessionStorage?.getItem('bayaniAppCheckDebug') === 'true') {
        globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    const {initializeAppCheck,ReCaptchaEnterpriseProvider,getToken}=await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-app-check.js');
    if(!connectBayani.appCheck)connectBayani.appCheck=initializeAppCheck(app,{provider:new ReCaptchaEnterpriseProvider(settings.appCheckSiteKey),isTokenAutoRefreshEnabled:true});
    if(auth.currentUser?.uid!==uid)throw Error('Your session changed. Please reconnect.');
    return createBayaniBackendClient({auth,appCheck:connectBayani.appCheck,getAppCheckToken:getToken,settings});
}
