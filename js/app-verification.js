import './local-app-check-debug.js';
import {app} from './firebase-config.js';
import {initializeAppCheck,ReCaptchaEnterpriseProvider,getToken} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app-check.js';
let instance;
let configuredKey;
export function sharedAppCheck(siteKey) {
    if(typeof siteKey!=='string'||!siteKey.trim())throw Error('App verification configuration is unavailable. Please try again later.');
    if(instance){if(configuredKey!==siteKey)throw Error('App verification settings changed. Refresh this page.');return instance;}
    instance=initializeAppCheck(app,{provider:new ReCaptchaEnterpriseProvider(siteKey),isTokenAutoRefreshEnabled:true});
    configuredKey=siteKey;
    return instance;
}
export async function verifyAppCheck(siteKey,forceRefresh=false){
    const check=sharedAppCheck(siteKey);
    try{
        const result=await getToken(check,forceRefresh);
        if(!result?.token)throw Error('Missing app attestation');
        return result;
    }catch(error){
        const local=['localhost','127.0.0.1','[::1]'].includes(globalThis.location?.hostname);
        const message=local?'This local browser is not verified. Open the deployed website, or register this browser’s App Check debug token for development. Your progress is safe.':'App verification could not complete. Refresh and try again. If it continues, check browser privacy extensions or contact support. Your progress is safe.';
        throw Object.assign(Error(message),{code:'app/verification-unavailable',cause:error});
    }
}
