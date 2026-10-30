import {auth} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {connectBayani} from './bayani-client.js';
import {BAYANI_CONNECT_TIMEOUT_MS,BAYANI_REPLY_TIMEOUT_MS,withBayaniDeadline,bayaniFailureMessage} from './bayani-request.js';
const log=document.getElementById('bayaniMessages'),form=document.getElementById('bayaniForm'),input=document.getElementById('bayaniInput'),send=document.getElementById('sendBayani'),status=document.getElementById('bayaniStatus'),retry=document.getElementById('retryBayani');
let generation=0,client=null,history=[],busy=false;
// Translate technical failures into safe guidance without displaying provider responses.
function chatFailure(error,connecting=false){
 return bayaniFailureMessage(error,{connecting,online:globalThis.navigator?.onLine});
}
function syncChatAppearance(){document.getElementById('bayaniEmpty').hidden=log.children.length>0;document.querySelector('.bayani-connection').dataset.state=busy?'thinking':client?'ready':retry.hidden?'connecting':'unavailable';log.setAttribute('aria-busy',String(busy));}
function appendInlineText(target,text){
 const parts=text.split(/(\*\*[^*]+\*\*)/g);
 for(const part of parts){
  if(part.startsWith('**')&&part.endsWith('**')){const emphasis=document.createElement('strong');emphasis.textContent=part.slice(2,-2);target.append(emphasis);}
  else target.append(document.createTextNode(part));
 }
}
function renderAssistantMessage(target,message){
 const lines=String(message).replace(/\\([*_])/g,'$1').replace(/\r\n?/g,'\n').split('\n');
 let paragraph=[],list=null;
 const flushParagraph=()=>{if(!paragraph.length)return;const block=document.createElement('p');appendInlineText(block,paragraph.join(' ').trim());target.append(block);paragraph=[];};
 const flushList=()=>{list=null;};
 for(const line of lines){
  if(!line.trim()){flushParagraph();flushList();continue;}
  const item=line.match(/^\s*(?:(\d+)[.)]|[-*•])\s+(.+)$/);
  if(item){
   flushParagraph();
   const ordered=Boolean(item[1]);
   if(!list||list.ordered!==ordered){list={ordered,element:document.createElement(ordered?'ol':'ul')};target.append(list.element);}
   const entry=document.createElement('li');appendInlineText(entry,item[2]);list.element.append(entry);
   continue;
  }
  flushList();paragraph.push(line.trim());
 }
 flushParagraph();
}
function bubble(role,message){
 const article=document.createElement('article');article.className='bayani-message '+role;
 const label=document.createElement('strong');label.textContent=role==='user'?'You':'Bayani AI';
 if(role==='user'){const body=document.createElement('p');body.textContent=message;article.append(label,body);}
 else{const body=document.createElement('div');body.className='bayani-message-content';renderAssistantMessage(body,message);article.append(label,body);}
 log.append(article);syncChatAppearance();article.scrollIntoView({block:'nearest',behavior:'instant'});return article;
}
async function connect(){const request=++generation,uid=auth.currentUser?.uid;client=null;history=[];busy=false;log.replaceChildren();input.value='';input.disabled=send.disabled=true;retry.hidden=true;status.textContent=uid?'Connecting to Bayani AI...':'Sign in to chat with Bayani AI.';syncChatAppearance();if(!uid)return;
 try{const next=await withBayaniDeadline(connectBayani,BAYANI_CONNECT_TIMEOUT_MS);if(request!==generation||auth.currentUser?.uid!==uid)return;client=next;input.maxLength=next.settings.maxMessageCharacters;input.disabled=send.disabled=false;status.textContent='Ready to chat.';if(next.settings.welcomeMessage)bubble('assistant',next.settings.welcomeMessage);syncChatAppearance();}
 catch(error){if(request!==generation)return;status.textContent=chatFailure(error,true);retry.hidden=false;syncChatAppearance();}
}
form.addEventListener('submit',async event=>{event.preventDefault();const message=input.value.trim();if(!client||busy||!message)return;if(message.length>client.settings.maxMessageCharacters)return;const request=generation,uid=auth.currentUser?.uid,requestClient=client,requestHistory=history;busy=true;input.disabled=send.disabled=true;retry.hidden=true;status.textContent='Bayani AI is thinking...';const userBubble=bubble('user',message);input.value='';
 try{const answer=await withBayaniDeadline(()=>requestClient.send(message,requestHistory),BAYANI_REPLY_TIMEOUT_MS);if(request!==generation||auth.currentUser?.uid!==uid)return;if(typeof answer!=='string'||!answer.trim())throw Object.assign(Error('Bayani AI returned no text.'),{code:'bayani/no-content'});bubble('assistant',answer);history.push({role:'user',parts:[{text:message}]},{role:'model',parts:[{text:answer}]});status.textContent='Ready to chat.';}
 catch(error){if(request!==generation||auth.currentUser?.uid!==uid)return;userBubble.remove();input.value=message;status.textContent=chatFailure(error)+' Your question is still here.';}
 finally{if(request===generation&&auth.currentUser?.uid===uid){busy=false;input.disabled=send.disabled=false;syncChatAppearance();input.focus({preventScroll:true});}}
});
retry.addEventListener('click',connect);
document.getElementById('newBayaniChat').addEventListener('click',()=>{
 if(!client){connect();return;}
 generation++;
 history=[];busy=false;log.replaceChildren();input.value='';
 input.disabled=send.disabled=false;retry.hidden=true;
 status.textContent='Ready to chat.';
 syncChatAppearance();input.focus({preventScroll:true});
});
onAuthStateChanged(auth,connect);
window.addEventListener('pagehide',()=>{generation++;client=null;history=[];busy=false;log.replaceChildren();input.value='';input.disabled=send.disabled=true;syncChatAppearance();});
window.addEventListener('pageshow',event=>{if(event.persisted)connect();});
