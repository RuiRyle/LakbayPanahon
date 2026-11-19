import {app,auth,db} from './firebase-config.js';
import {doc,getDocFromServer} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {sharedAppCheck,verifyAppCheck} from './app-verification.js';
export async function connectBayani(){
 const user=auth.currentUser;
 const current=()=>{if(!user||auth.currentUser!==user)throw Object.assign(Error('Please sign in again.'),{code:'bayani/unauthenticated'});};
 current();
 const snapshot=await getDocFromServer(doc(db,'learningSettings','bayaniAI'));
 current();const settings=snapshot.exists()?snapshot.data():null;
 if(settings?.enabled!==true||!['gemini',undefined,null].includes(settings.provider))throw Object.assign(Error('Bayani AI is unavailable. Please try again later.'),{code:'bayani/unavailable'});
 if(typeof settings.model!=='string'||!settings.model.trim()||typeof settings.systemInstruction!=='string'||!settings.systemInstruction.trim()||!Number.isInteger(settings.maxMessageCharacters)||settings.maxMessageCharacters<1||settings.maxMessageCharacters>4000)throw Error('Bayani AI settings are incomplete.');
 sharedAppCheck(settings.appCheckSiteKey);await verifyAppCheck(settings.appCheckSiteKey);current();
 const sdk=await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-ai.js');current();
 return createFirebaseBayaniClient({sdk,settings,user});
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
