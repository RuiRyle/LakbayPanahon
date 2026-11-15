import {sharedAppCheck,verifyAppCheck} from './app-verification.js';
﻿import {app,auth,db} from './firebase-config.js';
import {doc,getDocFromServer} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {createBayaniBackendClient,validateBayaniBackendEndpoint} from './bayani-backend-client.js';

// Model selection and authored assistant instructions belong to Firestore.
export async function connectBayani() {
    if(!auth.currentUser)throw Error('Please sign in to use Bayani AI.');
    const uid=auth.currentUser.uid;
    const snapshot=await getDocFromServer(doc(db,'learningSettings','bayaniAI'));
    if(auth.currentUser?.uid!==uid)throw Error('Your session changed. Please reconnect.');
    const settings=snapshot.exists()?snapshot.data():null;
    if(settings?.enabled!==true)throw Error('Bayani AI is not available yet. Please try again later.');
    // Older Firebase AI Logic settings predate the provider field.
    const provider = settings.provider ?? 'gemini';
    if(!['gemini','anthropic'].includes(provider)) throw Error('Bayani AI provider settings are incomplete.');
    if(provider==='anthropic'&&settings.minorsUseApproved!==true) throw Error('Bayani AI is being prepared for student use. You can continue with your lessons and practice.');
    if(!Number.isInteger(settings.maxMessageCharacters)||settings.maxMessageCharacters<1||settings.maxMessageCharacters>4000)throw Error('Bayani AI settings are incomplete. Please try again later.');
    if(provider==='anthropic') validateBayaniBackendEndpoint(settings.backendEndpoint);
    else if(typeof settings.model!=='string'||!settings.model.trim()||typeof settings.systemInstruction!=='string'||!settings.systemInstruction.trim()) throw Error('Bayani AI settings are incomplete. Please try again later.');
    if(!settings.appCheckSiteKey)throw Error('Bayani AI is still being connected. Please try again later.');
    const appCheck=sharedAppCheck(settings.appCheckSiteKey);
    if(auth.currentUser?.uid!==uid)throw Error('Your session changed. Please reconnect.');
    if(provider==='anthropic') return createBayaniBackendClient({auth,appCheck,getAppCheckToken:(_instance,force)=>verifyAppCheck(settings.appCheckSiteKey,force),settings});
    const sdk=await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-ai.js');
    if(auth.currentUser?.uid!==uid)throw Error('Your session changed. Please reconnect.');
    return createFirebaseBayaniClient({sdk,settings,user:auth.currentUser});
}

export function createFirebaseBayaniClient({sdk,settings,user}) {
    const {getAI,GoogleAIBackend,getGenerativeModel,HarmCategory,HarmBlockThreshold}=sdk;
    const ai=getAI(app,{backend:new GoogleAIBackend()});
    const model=getGenerativeModel(ai,{
        model:settings.model,
        systemInstruction:settings.systemInstruction,
        generationConfig:{maxOutputTokens:1024,temperature:.5},
        safetySettings:['HARM_CATEGORY_HARASSMENT','HARM_CATEGORY_HATE_SPEECH','HARM_CATEGORY_SEXUALLY_EXPLICIT','HARM_CATEGORY_DANGEROUS_CONTENT'].map(category=>({category:HarmCategory[category],threshold:HarmBlockThreshold.BLOCK_LOW_AND_ABOVE}))
    });
    const current=()=>{
        if(auth.currentUser!==user||auth.currentUser?.uid!==user.uid)throw Object.assign(Error('Your session changed. Please reconnect.'),{code:'bayani/unauthenticated'});
    };
    return {
        settings:{maxMessageCharacters:settings.maxMessageCharacters,welcomeMessage:typeof settings.welcomeMessage==='string'?settings.welcomeMessage:''},
        async send(message,history=[]) {
            current();
            if(typeof message!=='string'||!message.trim()||message.length>settings.maxMessageCharacters||!Array.isArray(history)||history.length%2!==0)throw Object.assign(Error('Invalid history question.'),{code:'bayani/invalid-request'});
            const recent=history.slice(-12).map((entry,index)=>{
                const text=entry?.parts?.[0]?.text;
                if(entry?.role!==(index%2===0?'user':'model')||entry.parts.length!==1||typeof text!=='string'||!text.trim()||text.length>12000)throw Object.assign(Error('Invalid conversation.'),{code:'bayani/invalid-request'});
                return {role:entry.role,parts:[{text}]};
            });
            const chat=model.startChat({history:recent});
            const result=await chat.sendMessage(message.trim());
            current();
            const answer=result.response.text();
            if(typeof answer!=='string'||!answer.trim())throw Object.assign(Error('Bayani AI returned no text.'),{code:'bayani/no-content'});
            return answer;
        }
    };
}
