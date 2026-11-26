import {appConfirm} from './app-dialog.js';
﻿import {auth} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {connectBayani} from './bayani-client.js';
import {BAYANI_CONNECT_TIMEOUT_MS,BAYANI_REPLY_TIMEOUT_MS,withBayaniDeadline,bayaniFailureMessage} from './bayani-request.js';
const log=document.getElementById('bayaniMessages'),form=document.getElementById('bayaniForm'),input=document.getElementById('bayaniInput'),send=document.getElementById('sendBayani'),status=document.getElementById('bayaniStatus'),retry=document.getElementById('retryBayani');
const transcript = log.closest('.bayani-chat');
let generation=0,client=null,history=[],busy=false;
const recentChats = document.getElementById('bayaniRecentChats');
const openHistory = document.getElementById('openBayaniHistory');
openHistory?.addEventListener('click', () => {
 if (!auth.currentUser || recentChats.open) return;
 openHistory.focus({preventScroll:true});
 recentChats.showModal();
});
let activeChatId = null;

function chatStorageKey(uid) {
 return 'lakbay.bayani.chats.' + uid;
}

function readChats(uid) {
 const saved = JSON.parse(localStorage.getItem(chatStorageKey(uid)) || '[]');
 return Array.isArray(saved) ? saved : [];
}

function renderRecentChats() {
 if (!recentChats) return;
 const uid = auth.currentUser?.uid;
 const list = recentChats.querySelector('ul');
 const notice = recentChats.querySelector('[role=status]');
 openHistory.hidden = !uid;
 list.replaceChildren();
 notice.textContent = '';
 if (!uid) {
  if (recentChats.open) recentChats.close();
  return;
 }
 try {
  const chats = readChats(uid);
  if (!chats.length) notice.textContent = 'No saved chats yet. Your conversations will appear here after Bayani replies.';
  for (const chat of chats) {
   if (typeof chat?.title !== 'string' || !Array.isArray(chat.turns)) continue;
   const row = document.createElement('li');
   const open = document.createElement('button');
   const remove = document.createElement('button');
   open.type = remove.type = 'button';
   open.className = 'bayani-history-open';
   const title = document.createElement('strong');title.textContent = chat.title;
   const preview = document.createElement('span');preview.className = 'bayani-history-preview';
   const reply = chat.turns.find(turn => turn?.role === 'model' && typeof turn.parts?.[0]?.text === 'string');
   preview.textContent = reply ? reply.parts[0].text.replace(/[*#]/g,'').slice(0,110) : 'Open this conversation';
   const meta = document.createElement('small');meta.className = 'bayani-history-meta';
   const messages = chat.turns.length;
   const date = new Date(chat.updatedAt);
   meta.textContent = (chat.id === activeChatId ? 'Current chat · ' : '') + messages + ' messages' + (Number.isFinite(date.getTime()) ? ' · ' + date.toLocaleDateString(undefined,{month:'short',day:'numeric'}) : '');
   open.append(title,preview,meta);
   open.setAttribute('aria-label','Open chat: ' + chat.title);
   if (chat.id === activeChatId) open.setAttribute('aria-current', 'true');
   remove.textContent = 'Delete';
   remove.className = 'bayani-history-delete';
   remove.setAttribute('aria-label', 'Delete chat: ' + chat.title);
   open.onclick = async () => {
    if (auth.currentUser?.uid !== uid || busy) return;
    const request = generation;
    if (input.value.trim() && !(await appConfirm('Open this chat and clear your unsent question?').catch(() => false))) return;
    if (request !== generation || busy || auth.currentUser?.uid !== uid) return;
    generation += Number(Boolean(client));
    activeChatId = chat.id;
    history = chat.turns;
    input.value = '';
    log.replaceChildren();
    for (const turn of history) {
     if (typeof turn?.parts?.[0]?.text === 'string') {
      bubble(turn.role === 'user' ? 'user' : 'assistant', turn.parts[0].text, false);
     }
    }
    syncChatAppearance();
    transcript.scrollTop = 0;
    if (recentChats.open) recentChats.close();
    renderRecentChats();
    if (!input.disabled) input.focus({preventScroll:true});
    else openHistory.focus({preventScroll:true});
   };
   remove.onclick = async () => {
    const request = generation;
    if (busy || auth.currentUser?.uid !== uid || !(await appConfirm('Delete this saved chat?').catch(() => false))) return;
    if (request !== generation || busy || auth.currentUser?.uid !== uid) return;
    try {
     localStorage.setItem(chatStorageKey(uid), JSON.stringify(readChats(uid).filter(item => item.id !== chat.id)));
     if (activeChatId === chat.id) {
      activeChatId = null;
      history = [];
      log.replaceChildren();
      syncChatAppearance();
     }
     renderRecentChats();
     if (recentChats.open) (list.querySelector('.bayani-history-open') || recentChats.querySelector('form button')).focus();
    } catch {
     notice.textContent = 'Could not delete this chat. Try again.';
    }
   };
   row.append(open, remove);
   list.append(row);
  }
 } catch {
  notice.textContent = 'Chat history is unavailable in this browser.';
 }
}

function saveCurrentChat(uid) {
 if (!recentChats || !uid || !history.length) return;
 try {
  activeChatId ||= globalThis.crypto.randomUUID();
  const chats = readChats(uid).filter(chat => chat.id !== activeChatId);
  const question = history[0].parts[0].text;
  const title = question.length > 60 ? question.slice(0, 59) + '…' : question;
  chats.unshift({id: activeChatId, title, turns: history, updatedAt: new Date().toISOString()});
  localStorage.setItem(chatStorageKey(uid), JSON.stringify(chats.slice(0, 10)));
  renderRecentChats();
 } catch {
  recentChats.querySelector('[role=status]').textContent = 'This conversation could not be saved.';
 }
}
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

function revealMessage(article) {
 const pane = transcript.getBoundingClientRect();
 const message = article.getBoundingClientRect();
 if (message.height > transcript.clientHeight || message.top < pane.top) {
  transcript.scrollTop += message.top - pane.top;
 } else if (message.bottom > pane.bottom) {
  transcript.scrollTop += message.bottom - pane.bottom;
 }
}

function bubble(role,message,scroll=true){
 const article=document.createElement('article');article.className='bayani-message '+role;
 const label=document.createElement('strong');label.textContent=role==='user'?'You':'Bayani';
 if(role==='user'){const body=document.createElement('p');body.textContent=message;article.append(label,body);}
 else{const body=document.createElement('div');body.className='bayani-message-content';renderAssistantMessage(body,message);article.append(label,body);}
 log.append(article);
 syncChatAppearance();
 if (scroll) revealMessage(article);
 return article;
}
async function connect(){const request=++generation,uid=auth.currentUser?.uid;client=null;history=[];activeChatId=null;busy=false;log.replaceChildren();input.value='';input.disabled=send.disabled=true;retry.hidden=true;if(recentChats?.open)recentChats.close();renderRecentChats();status.textContent=uid?'Connecting to Bayani...':'Sign in to chat with Bayani.';syncChatAppearance();if(!uid)return;
 try{const next=await withBayaniDeadline(connectBayani,BAYANI_CONNECT_TIMEOUT_MS);if(request!==generation||auth.currentUser?.uid!==uid)return;client=next;input.maxLength=next.settings.maxMessageCharacters;input.disabled=send.disabled=false;status.textContent='Ready to chat.';if(!activeChatId&&next.settings.welcomeMessage)bubble('assistant',next.settings.welcomeMessage);syncChatAppearance();}
 catch(error){if(request!==generation)return;status.textContent=chatFailure(error,true);retry.hidden=false;syncChatAppearance();}
}
form.addEventListener('submit',async event=>{event.preventDefault();const message=input.value.trim();if(!client||busy||!message)return;if(message.length>client.settings.maxMessageCharacters)return;const request=generation,uid=auth.currentUser?.uid,requestClient=client,requestHistory=history;busy=true;input.disabled=send.disabled=true;retry.hidden=true;status.textContent='Bayani is thinking...';const userBubble=bubble('user',message);input.value='';
 try{const answer=await withBayaniDeadline(()=>requestClient.send(message,requestHistory),BAYANI_REPLY_TIMEOUT_MS);if(request!==generation||auth.currentUser?.uid!==uid)return;if(typeof answer!=='string'||!answer.trim())throw Object.assign(Error('Bayani returned no text.'),{code:'bayani/no-content'});bubble('assistant',answer);history.push({role:'user',parts:[{text:message}]},{role:'model',parts:[{text:answer}]});saveCurrentChat(uid);status.textContent='Ready to chat.';}
 catch(error){if(request!==generation||auth.currentUser?.uid!==uid)return;userBubble.remove();input.value=message;status.textContent=chatFailure(error)+' Your question is still here. Select Send to try again.';}
 finally{if(request===generation&&auth.currentUser?.uid===uid){busy=false;input.disabled=send.disabled=false;syncChatAppearance();input.focus({preventScroll:true});}}
});
retry.addEventListener('click',connect);
document.getElementById('newBayaniChat').addEventListener('click',async ()=>{
 const request=generation,uid=auth.currentUser?.uid,requestClient=client;
 if(!uid)return;
 try{
  if((busy||history.length||input.value.trim())&&!(await appConfirm('Start a new chat? Any unsent question will be cleared.')))return;
 }catch{return;}
 // A confirmation belongs to its original session, including an A -> B -> A transition.
 if(request!==generation||auth.currentUser?.uid!==uid||client!==requestClient)return;
 if(!client){connect();return;}
 generation++;
 history=[];activeChatId=null;busy=false;log.replaceChildren();input.value='';renderRecentChats();
 input.disabled=send.disabled=false;retry.hidden=true;
 status.textContent='Ready to chat.';
 syncChatAppearance();input.focus({preventScroll:true});
});
onAuthStateChanged(auth,connect);
window.addEventListener('pagehide',()=>{generation++;client=null;history=[];busy=false;activeChatId=null;log.replaceChildren();input.value='';input.disabled=send.disabled=true;if(recentChats){if(recentChats.open)recentChats.close();openHistory.hidden=true;recentChats.querySelector('ul').replaceChildren();recentChats.querySelector('[role=status]').textContent='';}syncChatAppearance();});
window.addEventListener('pageshow',event=>{if(event.persisted)connect();});
