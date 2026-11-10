import {appConfirm} from './app-dialog.js';
import {reviewLearningStages} from './teacher-class-policy.js';
import {auth,db} from './firebase-config.js';
import {collection,doc,query,where,orderBy,documentId,startAfter,limit,getDocsFromServer,getDocFromServer,setDoc,deleteDoc,runTransaction,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';

function feedbackElement(tag,value,parent,className) {
    const element=document.createElement(tag);
    if(value!=null)element.textContent=value;
    if(className)element.className=className;
    parent?.append(element);return element;
}
export async function renderStudentFeedback(parent,classroom,path,isCurrent) {
    const user=auth.currentUser;if(!user)return;
    const section=feedbackElement('section',null,parent,'class-feedback');
    feedbackElement('h3','Feedback from your teacher',section);
    const notice=feedbackElement('p','Loading your feedback...',section,'class-feedback-status');notice.setAttribute('role','status');
    const content=feedbackElement('div',null,section);
    const current=()=>isCurrent()&&auth.currentUser===user&&section.isConnected;
    const load=async()=>{
        notice.textContent='Loading your feedback...';content.replaceChildren();
        try {
            const snapshot=await getDocsFromServer(query(collection(db,'classFeedback'),where('classId','==',classroom.id),where('userId','==',user.uid),orderBy(documentId()),limit(100)));
            if(!current())return;
            const messages=snapshot.docs.map(d=>({...d.data(),id:d.id})).filter(item=>item.classId===classroom.id&&item.userId===user.uid).sort((a,b)=>(b.updatedAt?.toMillis?.()||0)-(a.updatedAt?.toMillis?.()||0));
            notice.textContent=messages.length ? 'Your teacher’s latest guidance for each mission. Marking feedback as read does not complete the mission.' : 'No feedback yet. Your teacher’s guidance will appear here.';
            section.dataset.unread=String(messages.filter(item=>!item.readAt).length);section.closest('.student-class-card')?.dispatchEvent(new CustomEvent('class-feedback-loaded'));
            if(messages.length===100)feedbackElement('p','Showing up to 100 mission feedback records.',content,'class-feedback-status');
            for(const message of messages){
                const article=feedbackElement('article',null,content,'class-feedback-message');
                const mission=path.find(m=>m.id===message.missionId&&m.chapterId===message.chapterId);
                feedbackElement('h4',mission?.title||'Mission: '+message.missionId,article);
                feedbackElement('p',message.body,article,'class-feedback-body');
                if(message.updatedAt?.toDate)feedbackElement('p','Updated '+message.updatedAt.toDate().toLocaleString('en-PH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Manila'})+' (Philippine time)',article,'class-feedback-status');
                const state=feedbackElement('p',message.readAt?'Marked as read':'New feedback',article,'class-feedback-status');state.setAttribute('role','status');
                const actions=feedbackElement('div',null,article,'class-feedback-actions');
                const canOpen=classroom.status==='active'&&mission?.accessible;
                const journey=feedbackElement('a',canOpen?'Revisit this lesson':'Find this mission in My Journey',actions,'text-button');journey.href=canOpen?'story.html?'+new URLSearchParams({chapter:message.chapterId,mission:message.missionId}):'my-journey.html';
                if(!message.readAt){
                    const button=feedbackElement('button','Mark as Read',actions,'text-button');button.type='button';
                    button.addEventListener('click',async()=>{
                        if(!current())return;button.disabled=true;state.textContent='Saving...';
                        try {
                            await runTransaction(db,async tx=>{
                                const reference=doc(db,'classFeedback',message.id),fresh=await tx.get(reference);
                                if(!current())throw Error('Your session changed.');
                                if(!fresh.exists()||fresh.data().userId!==user.uid||fresh.data().classId!==classroom.id)throw Error('Feedback unavailable.');
                                if(fresh.data().revision!==message.revision)throw Error('Your teacher updated this feedback. Refresh Classes to read the new message.');
                                if(!fresh.data().readAt)tx.update(reference,{readAt:serverTimestamp()});
                            });
                            if(current()){state.textContent='Marked as read';section.dataset.unread=String(Math.max(0,Number(section.dataset.unread||0)-1));section.closest('.student-class-card')?.dispatchEvent(new CustomEvent('class-feedback-loaded'));button.remove();}
                        }catch(error){if(current()){state.textContent=error.message?.includes('updated this feedback')?error.message:'Could not mark this feedback as read. Refresh Classes and try again.';button.disabled=false;}}
                    });
                }
            }
        }catch{
            if(!current())return;
            notice.textContent='Feedback could not load. Your lessons and assignments are still available.';
            const retry=feedbackElement('button','Retry Feedback',content,'text-button');retry.type='button';retry.addEventListener('click',load);
        }
    };
    await load();
}


function node(tag,value,parent,className){const el=document.createElement(tag);el.textContent=value;if(className)el.className=className;parent.append(el);return el;}
const helpReasons={lesson:'I need the lesson explained',question:'I am stuck on a question','next-step':'I do not know what to do next'};
export function renderStudentReviewStages(parent,classroom,assignment,evidence,isCurrent){
 const user=auth.currentUser,requested=!!assignment.reflectionQuestion;const host=node('details','',parent,'review-learning-stages');node('summary','Review learning steps',host);const list=node('ol','',host,'review-stage-list');const notice=node('p','Practice, explanation, and teacher guidance are separate. This checklist does not change scores or rewards.',host,'teacher-note');notice.setAttribute('role','status');const refresh=node('button','Check review steps',host,'text-button');refresh.type='button';refresh.hidden=!requested;let record=null,available=!requested,busy=false,loaded=false,checked=false;
 const current=()=>isCurrent()&&auth.currentUser===user&&host.isConnected;
 const render=()=>{const stages=reviewLearningStages(evidence,record,{requested,reflectionAvailable:available});list.replaceChildren();for(const [key,title,label]of [['practice','Practice',stages.practiceLabel],['explanation','Your explanation',stages.explanationLabel],['guidance','Teacher guidance',stages.guidanceLabel]]){const item=node('li','',list);item.dataset.reviewStage=key;item.dataset.state=stages[key];node('strong',title,item);node('span',requested&&!checked&&key!=='practice'?'Not checked yet':label,item);}};render();
 async function load(){if(!current()||busy||!requested)return;checked=true;busy=true;refresh.disabled=true;notice.textContent='Checking your saved explanation and teacher guidance...';try{const snapshot=await getDocFromServer(doc(db,'classReviewReflections',assignment.id));if(!current())return;record=snapshot.exists()?snapshot.data():null;available=!record||(record.classId===classroom.id&&record.userId===user.uid&&record.reviewId===assignment.id);loaded=true;render();notice.textContent=available?'Saved review steps checked. A passing practice result does not mean your teacher has reviewed your explanation.':'The explanation record could not be verified. Refresh Classes to check the activity.';}catch{if(current()){available=false;render();notice.textContent='Explanation and guidance status could not load. Your practice result is unchanged.';}}finally{busy=false;if(current()){refresh.disabled=false;refresh.textContent='Refresh review steps';}}}
 host.addEventListener('toggle',()=>{if(host.open&&!loaded)load();});refresh.addEventListener('click',load);parent.addEventListener('review-reflection-changed',event=>{if(!current()||event.detail?.reviewId!==assignment.id)return;checked=true;record=event.detail.record;available=!record||(record.classId===classroom.id&&record.userId===user.uid&&record.reviewId===assignment.id);loaded=true;render();notice.textContent='Review steps updated from your saved explanation. Practice scores and rewards are unchanged.';});
}
export function renderReviewReflection(parent,classroom,assignment,evidence,isCurrent){
 const ended=['closed','withdrawn'].includes(assignment.status);if(!assignment.reflectionQuestion||(!ended&&(!evidence?.completed||!evidence.passingAttemptId)))return;
 const user=auth.currentUser,host=node('details','',parent,'mission-help review-reflection');node('summary',ended?'Read your explanation and guidance':'Explain what you learned',host);node('p','A short explanation helps your teacher understand your thinking. This is separate from your quiz result and earns no extra XP.',host);
 node('strong',assignment.reflectionQuestion,host);
 const state=node('p','',host,'class-feedback-status');state.setAttribute('role','status');const previous=node('div','',host);
 const form=node('form','',host,'mission-help-form'),label=node('label','Your explanation (up to 600 characters)',form),body=node('textarea','',label);body.required=true;body.maxLength=600;body.rows=3;form.hidden=ended;
 const save=node('button','Share my explanation',form,'text-button');save.type='submit';const retry=node('button','Refresh explanation',host,'text-button');retry.type='button';
 const ref=doc(db,'classReviewReflections',assignment.id);let loaded=false,busy=false,revision=0;const current=()=>isCurrent()&&auth.currentUser===user&&host.isConnected;
 const load=async()=>{if(busy)return;busy=true;save.disabled=retry.disabled=true;try{const snapshot=await getDocFromServer(ref);if(!current())return;previous.replaceChildren();loaded=true;const savedReflection=snapshot.exists()?snapshot.data():null;if(savedReflection&&(savedReflection.classId!==classroom.id||savedReflection.userId!==user.uid||savedReflection.reviewId!==assignment.id))throw Error('Review context changed');parent.dispatchEvent(new CustomEvent('review-reflection-changed',{detail:{reviewId:assignment.id,record:savedReflection}}));if(snapshot.exists()){const row=snapshot.data();revision=row.revision;body.value=row.body;if(ended){node('strong','Your saved explanation',previous);node('p',row.body,previous,'class-feedback-body');}state.textContent=row.response?'Your teacher responded to your explanation.':'Explanation shared. Your teacher can now read it.';if(row.response){node('strong','Your teacher’s guidance',previous);node('p',row.response,previous,'class-feedback-body');}save.textContent='Update my explanation';}else state.textContent=ended?'No explanation was shared before this activity ended.':'Explain the idea in your own words and include a clue.';}catch{if(current())state.textContent='Your saved explanation could not load. Refresh before sending.';}finally{busy=false;if(current()){save.disabled=!loaded||ended;retry.disabled=false;}}};
 host.addEventListener('toggle',()=>{if(host.open&&!loaded)load();});retry.addEventListener('click',async ()=>{if(body.value.trim()&&!(await appConfirm('Refresh and replace your current explanation with the saved version?')))return;load();});
 form.addEventListener('submit',async event=>{event.preventDefault();if(ended||!current()||busy||!loaded||!body.value.trim())return;const submittedText=body.value.trim();busy=true;save.disabled=true;body.readOnly=true;state.textContent='Sharing...';try{await runTransaction(db,async tx=>{const snapshot=await tx.get(ref);if(!current()||(snapshot.exists()?snapshot.data().revision:0)!==revision)throw Error('changed');tx.set(ref,{classId:classroom.id,userId:user.uid,reviewId:assignment.id,question:assignment.reflectionQuestion,body:submittedText,attemptId:evidence.passingAttemptId,revision:revision+1,submittedAt:serverTimestamp(),response:'',respondedAt:null});});if(current()){revision++;parent.dispatchEvent(new CustomEvent('review-reflection-changed',{detail:{reviewId:assignment.id,record:{classId:classroom.id,userId:user.uid,reviewId:assignment.id,body:submittedText,response:'',revision}}}));state.textContent='Explanation shared with your teacher. Your quiz result is unchanged.';previous.replaceChildren();save.textContent='Update my explanation';}}catch{if(current())state.textContent='Could not share your explanation. Your text is preserved; refresh if this record changed.';}finally{busy=false;if(current()){save.disabled=false;body.readOnly=false;}}});
}
// Shared, cursor-paged teacher inbox. Loading another page never replaces reply drafts.
function renderTeacherFollowupInbox(parent,classroom,members,studentName,isCurrent,kind){
 const reflection=kind==='explanation',name=reflection?'classReviewReflections':'classHelpRequests';
 const host=node('details','',parent,'teacher-help-inbox');host.dataset.followupKind=kind;
 const summary=node('summary',reflection?'Understanding checks and completed reviews':'Student help requests',host);
 const state=node('p',reflection?'Check student explanations alongside quiz evidence. Explanations are not automatically graded.':'Open this section to review private requests for this class.',host,'teacher-note');state.setAttribute('role','status');
 const toolbar=node('div','',host,'teacher-inbox-toolbar'),refresh=node('button',reflection?'Load understanding checks':'Refresh requests',toolbar,'text-button');refresh.type='button';
 const filterLabel=node('label','Show',toolbar),filter=node('select','',filterLabel);filter.setAttribute('aria-label',reflection?'Filter explanations':'Filter help requests');for(const [value,label]of [['all','All loaded'],['pending','Needs a response'],['answered','Guidance sent']]){const option=node('option',label,filter);option.value=value;}
 const targetState=node('p','',host,'teacher-note');targetState.setAttribute('role','status');const targetRetry=node('button','Retry selected request',host,'text-button');targetRetry.type='button';targetRetry.hidden=true;
 const list=node('div','',host,'teacher-inbox-list'),pageState=node('p','',host,'teacher-note'),more=node('button','Load more requests',host,'text-button');more.type='button';more.hidden=true;
 const records=new Map(),allowed=new Set(members.map(member=>member.userId));const user=auth.currentUser;let loaded=false,busy=false,cursor=null,hasMore=false,pageCount=0,targetId=null,pendingTarget=null;
 const current=()=>isCurrent()&&auth.currentUser===user&&host.isConnected;
 const pending=row=>reflection?!row.response:row.status==='open'||row.understanding==='needs-help';
 const sending=()=>!!list.querySelector('form[data-sending=true]');
 const dirty=()=>[...list.querySelectorAll('textarea')].some(input=>!input.disabled&&input.value.trim());
 function controls(){for(const form of list.querySelectorAll('form')){const input=form.querySelector('textarea');if(input)input.readOnly=busy;const send=form.querySelector('button[type=submit]');if(send)send.disabled=busy||!!input?.disabled;}refresh.disabled=more.disabled=targetRetry.disabled=busy||sending();more.hidden=!hasMore;refresh.textContent=reflection?(loaded?'Refresh understanding checks':'Load understanding checks'):'Refresh requests';}
 function update(){
  const values=[...records.values()],count=values.filter(entry=>pending(entry.row)).length;
  if(!reflection)summary.textContent='Student help requests - '+count+' need a response'+(!loaded||hasMore?' (loaded)':'');
  state.textContent=count+(reflection?' explanations waiting for guidance.':' need your response.')+' Among '+values.length+' loaded current-member records.'+(!loaded?' Full inbox pages have not been loaded.':hasMore?' More records are available; load the next page before concluding the class is caught up.':' All pages in this loaded snapshot have been checked.');
  for(const entry of values)entry.card.hidden=filter.value==='pending'?!pending(entry.row):filter.value==='answered'?pending(entry.row):false;
  let empty=list.querySelector('.teacher-inbox-empty');const visible=values.some(entry=>!entry.card.hidden);if(!visible){if(!empty)empty=node('p','',list,'teacher-note teacher-inbox-empty');empty.textContent=values.length?'No loaded records match this filter.':reflection?'No explanations from current members in the loaded pages yet.':'No requests from current members in the loaded pages yet.';}else empty?.remove();
  pageState.textContent=loaded?pageCount+' page'+(pageCount===1?'':'s')+' loaded'+(hasMore?' - more available.':' - end of current results.'):targetId?'Selected request only. Load the inbox to browse other records.':'Open or refresh the inbox to load records.';
  controls();
 }
 function render(row){
  if(!allowed.has(row.userId)||row.classId!==classroom.id||records.has(row.id))return;
  const card=node('article','',list,'teacher-help-request');card.dataset.followupId=row.id;card.dataset.followupUserId=row.userId;records.set(row.id,{row,card});
  node('h4',studentName(row.userId),card);
  node('p',reflection?(classroom.assignmentTitles?.[row.reviewId]||'Personal review'):(helpReasons[row.reason]||'Learning help'),card,'teacher-note');
  if(reflection){node('strong',row.question,card);node('p',row.body,card,'class-feedback-body');}
  else{node('p','Assignment: '+(classroom.assignmentTitles?.[row.assignmentId]||'Assigned mission'),card,'teacher-note');if(row.message)node('p',row.message,card,'class-feedback-body');}
  if(row.response){node('strong',reflection?'Guidance sent':row.understanding==='understood'?'Student understands':row.understanding==='needs-help'?'Student still needs help':'Waiting for student response',card,'help-response-chip');node('p',row.response,card,'class-feedback-body teacher-saved-help-response');}
  if(!pending(row))return;
  const form=node('form','',card),label=node('label',reflection?'Acknowledge the idea or give one next step':'Give a helpful next step',form),reply=node('textarea','',label);reply.required=true;reply.maxLength=1500;reply.rows=3;
  const send=node('button',reflection?'Send private guidance':'Send private reply',form,'text-button');send.type='submit';const notice=node('p','',form,'teacher-note');notice.setAttribute('role','status');
  form.addEventListener('submit',async event=>{
   event.preventDefault();if(!current()||busy||form.dataset.sending==='true'||!reply.value.trim())return;
   const replyText=reply.value.trim();send.disabled=reply.disabled=true;form.dataset.sending='true';notice.textContent='Sending...';controls();
   try{
    await runTransaction(db,async tx=>{const ref=doc(db,name,row.id),fresh=await tx.get(ref);if(!current()||!fresh.exists()||fresh.data().classId!==classroom.id||fresh.data().revision!==row.revision)throw Error('changed');
     if(reflection){if(fresh.data().response)throw Error('changed');tx.update(ref,{response:replyText,respondedAt:serverTimestamp()});}
     else{if(fresh.data().answeredAt?.toMillis?.()!==row.answeredAt?.toMillis?.()||(fresh.data().status!=='open'&&fresh.data().understanding!=='needs-help'))throw Error('changed');tx.update(ref,{status:'answered',response:replyText,answeredAt:serverTimestamp(),updatedAt:serverTimestamp(),understanding:'',understandingAt:null});}
    });
    if(!current())return;row.response=replyText;if(!reflection){row.status='answered';row.understanding='';}
    let saved=card.querySelector('.teacher-saved-help-response');if(saved)saved.textContent=replyText;else node('p',replyText,card,'class-feedback-body teacher-saved-help-response');
    card.querySelector('.help-response-chip')?.remove();node('strong',reflection?'Guidance sent':'Waiting for student response',card,'help-response-chip');
    notice.textContent=reflection?'Guidance sent. The student can read it beside their explanation.':'Reply sent. The student can read it under this assignment in My Class.';
    delete form.dataset.sending;update();host.dispatchEvent(new Event('followups:updated'));
   }catch{if(current()){notice.textContent=reflection?'Could not send. Your text is preserved. Reload if the explanation changed.':'Reply could not be sent. Your text is preserved; refresh if the request changed.';send.disabled=reply.disabled=false;}}
   finally{delete form.dataset.sending;if(current())controls();}
  });
 }
 function sort(){for(const entry of [...records.values()].sort((a,b)=>Number(!pending(a.row))-Number(!pending(b.row))||(b.row.updatedAt?.toMillis?.()||b.row.submittedAt?.toMillis?.()||0)-(a.row.updatedAt?.toMillis?.()||a.row.submittedAt?.toMillis?.()||0)))list.append(entry.card);}
 async function load(reset=true){
  if(busy||sending()||!current())return;if(reset&&dirty()&&!(await appConfirm('Refresh requests and discard your unsent guidance?')))return;
  busy=true;controls();state.textContent=reset?'Loading '+(reflection?'explanations':'requests')+'...':'Loading the next page...';
  try{
   const snapshot=await getDocsFromServer(query(collection(db,name),where('classId','==',classroom.id),orderBy(documentId()),...(!reset&&cursor?[startAfter(cursor)]:[]),limit(101)));if(!current())return;
   const docs=snapshot.docs.slice(0,100);if(reset){records.clear();list.replaceChildren();pageCount=0;}
   for(const document of docs)render({...document.data(),id:document.id});
   cursor=docs.at(-1)||null;hasMore=snapshot.docs.length>100;loaded=true;pageCount++;if(targetId&&!records.has(targetId))pendingTarget=targetId;sort();update();host.dataset.followupsLoaded='true';host.dispatchEvent(new Event('followups:loaded'));
  }catch{if(current())state.textContent=(reflection?'Understanding checks':'Requests')+' could not load. '+(records.size?'Previously loaded records and unsent text are kept. ':'')+'Use '+(reset?'Refresh':'Load more')+' to try again. No automatic retry was sent.';}
  finally{busy=false;if(current()){controls();if(pendingTarget){const id=pendingTarget;pendingTarget=null;loadTarget(id);}}}
 }
 async function loadTarget(id){
  if(!current()||typeof id!=='string'||!id||id.includes('/')||id.length>1500)return;
  targetId=id;if(busy){pendingTarget=id;return;}if(records.has(id)){filter.value='all';update();host.dispatchEvent(new Event('followups:loaded'));return;}
  busy=true;controls();targetRetry.hidden=true;targetState.textContent='Finding the selected request in this classroom...';
  try{
   const snapshot=await getDocsFromServer(query(collection(db,name),where('classId','==',classroom.id),where(documentId(),'==',id),limit(1)));if(!current())return;
   for(const document of snapshot.docs)render({...document.data(),id:document.id});sort();
   if(records.has(id)){filter.value='all';targetState.textContent='Selected request loaded directly; no need to load all earlier pages.';update();}
   else targetState.textContent='This request is unavailable or no longer belongs to a current class member.';
   host.dataset.followupsLoaded='true';host.dispatchEvent(new Event('followups:loaded'));
  }catch{if(current()){targetState.textContent='The selected request could not load. Your current records and text are kept.';targetRetry.hidden=false;}}
  finally{busy=false;if(current())controls();}
 }
 filter.addEventListener('change',()=>{if(loaded)update();});refresh.addEventListener('click',async ()=>(await load(true)));more.addEventListener('click',async ()=>(await load(false)));targetRetry.addEventListener('click',()=>loadTarget(targetId));
 host.addEventListener('followups:target',event=>loadTarget(event.detail?.id));host.addEventListener('toggle',async ()=>{if(host.open&&!loaded&&!targetId)(await load(true));});if(!reflection)queueMicrotask(async ()=>(await load(true)));
 return host;
}

export function renderTeacherReflectionQueue(parent,classroom,members,studentName,isCurrent){return renderTeacherFollowupInbox(parent,classroom,members,studentName,isCurrent,'explanation');}
function renderUnderstanding(parent,reference,request,current,reload){
 const panel=node('div','',parent,'help-understanding');node('strong','Did this explanation help?',panel);
 const notice=node('p',request.understanding==='understood'?'You told your teacher you understand.':request.understanding==='needs-help'?'Your teacher knows you still need help.':'Choose a response when you have read the guidance.',panel);notice.setAttribute('role','status');
 const actions=node('div','',panel,'class-feedback-actions');
 for(const [value,label] of [['understood','I understand'],['needs-help','I still need help']]){const button=node('button',label,actions,'text-button');button.type='button';button.setAttribute('aria-pressed',String(request.understanding===value));button.addEventListener('click',async()=>{if(!current())return;actions.querySelectorAll('button').forEach(b=>b.disabled=true);notice.textContent='Saving your response...';try{await runTransaction(db,async tx=>{const snapshot=await tx.get(reference);if(!current()||!snapshot.exists()||snapshot.data().revision!==request.revision||snapshot.data().answeredAt?.toMillis?.()!==request.answeredAt?.toMillis?.())throw Error('changed');tx.update(reference,{understanding:value,understandingAt:serverTimestamp()});});if(current()){parent.closest('.student-class-card')?.dispatchEvent(new CustomEvent('class-help-changed'));await reload();}}catch{if(current()){notice.textContent='Could not save your response. Refresh the request if your teacher replied again.';actions.querySelectorAll('button').forEach(b=>b.disabled=false);}}});}
}
export function renderClassReplyIndicator(card,classroom,isCurrent){
 const user=auth.currentUser;if(!user)return;
 const strip=node('section','',card,'class-reply-indicator');strip.setAttribute('aria-label','Teacher reply updates');strip.hidden=true;card.querySelector('.class-section-nav')?.after(strip);
 let loading=false;
 const load=async()=>{if(loading)return;loading=true;try{const snapshot=await getDocsFromServer(query(collection(db,'classHelpRequests'),where('classId','==',classroom.id),where('userId','==',user.uid),orderBy(documentId()),limit(100)));if(!isCurrent()||auth.currentUser!==user||!card.isConnected)return;const requests=snapshot.docs.map(d=>d.data());for(const item of card.querySelectorAll('.class-assignment')){const request=requests.find(row=>row.assignmentId===item.dataset.assignmentId);item.dataset.waiting=String(request?.status==='open'||request?.understanding==='needs-help');}card.dispatchEvent(new CustomEvent('class-help-state'));const replies=requests.filter(row=>row.status==='answered'&&!row.understanding);strip.replaceChildren();strip.hidden=!replies.length;if(replies.length){node('strong',replies.length+' teacher '+(replies.length===1?'reply needs':'replies need')+' your attention',strip);node('p','Open the matching assignment below, read the reply, and tell your teacher if it helped.',strip);for(const reply of replies){const item=[...card.querySelectorAll('.class-assignment')].find(el=>el.dataset.assignmentId===reply.assignmentId);if(!item)continue;const button=node('button','Read reply: '+(item.querySelector('h4')?.textContent||'Assigned mission'),strip,'text-button');button.type='button';button.addEventListener('click',()=>{card.dispatchEvent(new Event('class-open-activities'));const filter=card.querySelector('.class-activity-filter select');if(filter){filter.value='all';filter.dispatchEvent(new Event('change'));}const completed=item.closest('.class-completed-history,.class-ended-history');if(completed)completed.open=true;const help=item.querySelector('.mission-help');if(help){help.open=true;help.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});help.querySelector('summary')?.focus();}});}}}catch{if(isCurrent()&&card.isConnected){strip.hidden=false;strip.replaceChildren();node('p','Reply updates could not load. You can still open an assignment to check its help request.',strip);}}finally{loading=false;}};
 card.addEventListener('class-help-changed',load);queueMicrotask(load);
}
export function renderMissionHelp(parent,classroom,assignment,isCurrent){
 const user=auth.currentUser;if(!user||classroom.status!=='active')return;
 const ended=['closed','withdrawn'].includes(assignment.status);const host=node('details','',parent,'mission-help');node('summary',ended?'Read help and teacher replies':'Ask your teacher for help',host);
 node('p','Only you and your teacher can read this request. You can keep learning while you wait.',host);
 const state=node('p','',host,'class-feedback-status');state.setAttribute('role','status');
 const history=node('div','',host,'mission-help-history'),form=node('form','',host,'mission-help-form');
 const reasonLabel=node('label','What do you need help with?',form),reason=node('select','',reasonLabel);for(const [value,label] of Object.entries(helpReasons))node('option',label,reason).value=value;
 const messageLabel=node('label','Tell your teacher more (optional)',form),message=node('textarea','',messageLabel);message.maxLength=500;message.rows=3;message.placeholder='Which idea or activity is confusing?';
 const send=node('button','Send help request',form,'text-button');send.type='submit';
 const retry=node('button','Refresh request',host,'text-button');retry.type='button';
 const reference=doc(db,'classHelpRequests',classroom.id+'_'+user.uid+'_'+assignment.id);
 let loaded=false,busy=false;
 const current=()=>isCurrent()&&auth.currentUser===user&&host.isConnected;
 const load=async()=>{if(busy)return;busy=true;send.disabled=true;retry.disabled=true;state.textContent='Checking your request...';try{const snapshot=await getDocFromServer(reference);if(!current())return;history.replaceChildren();const request=snapshot.exists()?snapshot.data():null;loaded=true;form.hidden=ended||request?.status==='open';parent.dataset.waiting=String(request?.status==='open'||request?.understanding==='needs-help');parent.closest('.student-class-card')?.dispatchEvent(new CustomEvent('class-help-state'));if(request){node('strong',helpReasons[request.reason]||'Help requested',history);if(request.message)node('p',request.message,history,'class-feedback-body');if(request.status==='answered'){node('h5','Your teacher replied',history);node('p',request.response,history,'class-feedback-body');renderUnderstanding(history,reference,request,current,()=>load());state.textContent='Tell your teacher whether this explanation helped. Your response does not complete the mission.';send.textContent='Ask a follow-up question';}else state.textContent='Sent to your teacher. You do not need to send this again.';}else state.textContent=ended?'This activity has ended. New help requests are closed; your own learning stays available.':'Choose a reason and send your request.';}catch{if(current()){form.hidden=true;state.textContent='Your request could not load. Refresh the request to try again.';}}finally{busy=false;if(current()){send.disabled=false;retry.disabled=false;}}};
 host.addEventListener('toggle',()=>{if(host.open&&!loaded)load();});retry.addEventListener('click',load);
 form.addEventListener('submit',async event=>{event.preventDefault();if(ended||!current()||busy)return;busy=true;send.disabled=true;retry.disabled=true;const values={reason:reason.value,message:message.value.trim()};state.textContent='Sending...';try{await runTransaction(db,async tx=>{const snapshot=await tx.get(reference);if(!current())throw Error('Session changed');const old=snapshot.exists()?snapshot.data():null;if(old?.status==='open')throw Error('already-open');tx.set(reference,{classId:classroom.id,userId:user.uid,assignmentId:assignment.id,assignmentKind:assignment.assignmentType==='targeted-review'?'targeted-review':'class-goal',chapterId:assignment.chapterId,missionId:assignment.missionId,...values,status:'open',response:'',answeredAt:null,understanding:'',understandingAt:null,createdAt:old?.createdAt||serverTimestamp(),updatedAt:serverTimestamp(),revision:(old?.revision||0)+1});});if(current()){message.value='';busy=false;await load();}}catch(error){if(current())state.textContent=error.message==='already-open'?'A request is already waiting for your teacher. Select Refresh request.':'Your request could not be sent. Your text is still here; try again.';}finally{busy=false;if(current()){send.disabled=false;retry.disabled=false;}}});
}

export function renderTeacherHelp(parent,classroom,members,studentName,isCurrent){return renderTeacherFollowupInbox(parent,classroom,members,studentName,isCurrent,'help');}

export function renderClassmates(parent,classroom,isCurrent){
 const user=auth.currentUser;if(!user)return;
 const section=node('section','',parent,'classmates-panel');
 node('h3','Meet your classmates',section);
 node('p','Learn alongside your class. Only classmates’ chosen display names appear here. Scores and teacher feedback stay private.',section);
 const open=node('button','Refresh classmates',section,'text-button');open.type='button';
 const content=node('div','',section);content.hidden=false;
 const status=node('p','',content,'classmates-status');status.setAttribute('role','status');
 const toolbar=node('div','',content,'classmates-roster-toolbar');node('strong',classroom.name||'Your class',toolbar);const count=node('span','',toolbar,'classmates-count');
 const wrap=node('div','',content,'classmates-table-wrap'),table=node('table','',wrap,'classmates-table');const caption=node('caption','Classmates in '+(classroom.name||'your class'),table);const head=node('thead','',table),headRow=node('tr','',head);for(const title of ['Classmate','Class','Membership']){const th=node('th',title,headRow);th.scope='col';}const list=node('tbody','',table);
 const pager=node('div','',content,'classmates-pager');const previous=node('button','Previous',pager,'text-button');previous.type='button';const pageLabel=node('span','',pager);const next=node('button','Next',pager,'text-button');next.type='button';
 const profile=node('details','',content,'classmates-name-settings');node('summary','Manage my classroom name',profile);const form=node('form','',profile,'classmates-profile');
 const label=node('label','Your classroom display name',form);const input=node('input','',label);input.maxLength=60;input.required=true;input.placeholder='For example, Ana M.';input.autocomplete='off';
 node('p','Optional: use a first name or nickname. Saving makes this name visible to members of this class.',form);
 const save=node('button','Share my display name',form,'text-button');save.type='submit';
 const remove=node('button','Hide my name',form,'text-button');remove.type='button';remove.hidden=true;
 let entries=[],page=0,loaded=false;
 const current=()=>isCurrent()&&auth.currentUser===user&&section.isConnected;
 const render=()=>{list.replaceChildren();const sorted=[...entries].sort((a,b)=>a.displayName.localeCompare(b.displayName)||a.id.localeCompare(b.id));const pages=Math.max(1,Math.ceil(sorted.length/20));page=Math.min(page,pages-1);count.textContent=entries.length+' shared names';for(const row of sorted.slice(page*20,(page+1)*20)){const item=node('tr','',list);if(row.id===user.uid)item.className='is-current-student';const name=node('td','',item),identity=node('div','',name,'classmate-identity');const avatar=node('span',row.displayName.slice(0,1).toLocaleUpperCase(),identity,'classmate-avatar');avatar.setAttribute('aria-hidden','true');node('strong',row.displayName,identity);node('td',classroom.name||'Your class',item);const membership=node('td','',item);node('span',row.id===user.uid?'You':'Classmate',membership,'classmate-membership');}if(!entries.length){const cell=node('td','No shared names yet. Open Manage my classroom name to add yours.',node('tr','',list));cell.colSpan=3;}previous.disabled=page===0;next.disabled=page>=pages-1;pageLabel.textContent='Page '+(page+1)+' of '+pages;pager.hidden=pages===1;};
 previous.addEventListener('click',()=>{page--;render();});next.addEventListener('click',()=>{page++;render();});
 const load=async()=>{open.disabled=true;status.textContent='Loading classmates…';try{const snapshot=await getDocsFromServer(query(collection(db,'classes',classroom.id,'classmates'),orderBy(documentId()),limit(100)));if(!current())return;loaded=true;entries=snapshot.docs.map(d=>({id:d.id,displayName:String(d.data().displayName||'Classmate')}));const own=entries.find(row=>row.id===user.uid);if(own)input.value=own.displayName;remove.hidden=!own;status.textContent=entries.length+' shared display name'+(entries.length===1?'':'s')+'.'+(snapshot.size===100?' Showing the first 100.':'')+' Members appear when they choose to share a name.';render();}catch{if(current())status.textContent='Classmates could not load. Select Refresh classmates to try again.';}finally{if(current()){open.disabled=false;open.textContent='Refresh classmates';}}};
 open.addEventListener('click',load);section.addEventListener('classmates:open',()=>{if(!loaded&&!open.disabled)load();});
 form.addEventListener('submit',async event=>{event.preventDefault();if(!current()||!input.value.trim())return;save.disabled=true;try{await setDoc(doc(db,'classes',classroom.id,'classmates',user.uid),{displayName:input.value.trim().slice(0,60)});if(current())await load();}catch{if(current())status.textContent='Your display name could not be saved. Try again.';}finally{if(current())save.disabled=false;}});
 remove.addEventListener('click',async()=>{if(!current())return;remove.disabled=true;try{await deleteDoc(doc(db,'classes',classroom.id,'classmates',user.uid));if(current()){input.value='';await load();}}catch{if(current())status.textContent='Your name could not be hidden. Try again.';}finally{if(current())remove.disabled=false;}});
}
