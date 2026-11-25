import {classroomAssignmentEvidence} from './classroom-submission-policy.js';
import {appConfirm} from './app-dialog.js';
import {reviewEvidence,assignmentProgressState,publicationVersion} from './teacher-class-policy.js';
import {studentLoadMessage} from './student-status.js';
import {classAnnouncementSeenKey,classAnnouncementVersion,publishedAnnouncements,renderClassAnnouncements} from './class-announcements.js';
import {acknowledgeClassActivity,acknowledgeReflectionGuidance,classActivityUpdateKinds,notificationActivityType} from './class-notification-state.js';
import {renderStudentFeedback,renderClassmates,renderMissionHelp,renderClassReplyIndicator,renderReviewReflection,renderStudentReviewStages} from './student-feedback.js';
﻿import {auth,db} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {collection,doc,getDocFromServer,getDocs,getDocsFromServer,onSnapshot,query,where} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {joinStudentClass,leaveStudentClass,normalizeClassCode} from './student-class-client.js';
import {buildJourneyPath,assignmentReadiness} from './journey-path.js';
import {instructionalSnapshot} from './instructional-snapshot.js';
const container=document.getElementById('studentClasses'),status=document.getElementById('classPageStatus'),refresh=document.getElementById('refreshClasses'),joinForm=document.getElementById('joinClassForm'),joinButton=document.getElementById('joinClassButton'),joinStatus=document.getElementById('joinClassStatus'),code=document.getElementById('classCode');
let generation=0,loadRequest=0,sessionGeneration=0,joining=false,selectedClassId=null;
const classroomSubscriptions=new Set();
let activityRefresh;
const classroomConnection=document.createElement('p');
classroomConnection.className='lp-status-panel';
classroomConnection.setAttribute('role','status');
classroomConnection.hidden=true;
container.before(classroomConnection);
function showClassroomConnection(message=''){
 classroomConnection.textContent=message;
 classroomConnection.hidden=!message;
}
function classroomListenerFailed(stop,current){
 classroomSubscriptions.delete(stop);
 if(!current())return;
 showClassroomConnection('Live updates paused. Use Refresh Classes to reconnect.');
}
function stopClassroomUpdates(){
 clearTimeout(activityRefresh);
 for(const unsubscribe of classroomSubscriptions)unsubscribe();
 classroomSubscriptions.clear();
 showClassroomConnection();
}
function watchClassAnnouncements(record,card,current){
 const address=query(collection(db,'classAnnouncements'),where('classId','==',record.id),where('status','==','published'));
 const stop=onSnapshot(address,{includeMetadataChanges:true},snapshot=>{
  if(!current()||!card.isConnected||snapshot.metadata.fromCache||snapshot.metadata.hasPendingWrites)return;
  const updates=rows(snapshot);
  if(!record.announcementError&&classAnnouncementVersion(publishedAnnouncements(updates,record.id),record.teacherName)===
      classAnnouncementVersion(publishedAnnouncements(record.announcements,record.id),record.teacherName)&&
      updates.every(row=>record.announcements.some(old=>old.id===row.id))&&updates.length===record.announcements.length)return;
  record.announcements=updates;
  record.announcementError=false;
  card.dispatchEvent(new Event('class-announcements-updated'));
 },()=>classroomListenerFailed(stop,current));
 classroomSubscriptions.add(stop);
}
const activityStates=['published','closed','withdrawn'];
function classActivityQuery(classId,uid,targeted){
 return query(collection(db,targeted?'classReviewAssignments':'classAssignments'),where('classId','==',classId),
  ...(targeted?[where('userId','==',uid)]:[]),where('status','in',activityStates));
}
function activityVersion(snapshot){
 return JSON.stringify(rows(snapshot).sort((a,b)=>a.id.localeCompare(b.id)).map(row=>[row.id,publicationVersion(row)]));
}
function classroomInteractionInProgress(){
 const focused=document.activeElement;
 return joining||document.querySelector('dialog[open]')||
  (container.contains(focused)&&focused.matches('input,textarea,select,button,a,summary,[contenteditable=true]')&&
   !focused.matches('.class-section-button,.student-class-select,.class-activity-filter select'))||
  [...container.querySelectorAll('textarea')].some(input=>input.value.trim());
}
function scheduleActivityUpdate(current){
 clearTimeout(activityRefresh);
 activityRefresh=setTimeout(function update(){
  if(!current())return;
  if(refresh.disabled||classroomInteractionInProgress()){
   activityRefresh=setTimeout(update,750);
   return;
  }
  void loadClasses({background:true});
 },200);
}
function watchClassActivities(record,uid,current){
 for(const targeted of [false,true]){
  const stop=onSnapshot(classActivityQuery(record.id,uid,targeted),{includeMetadataChanges:true},snapshot=>{
   if(!current()||snapshot.metadata.fromCache||snapshot.metadata.hasPendingWrites)return;
   if(record.activityVersions[Number(targeted)]!==activityVersion(snapshot))scheduleActivityUpdate(current);
  },()=>classroomListenerFailed(stop,current));
  classroomSubscriptions.add(stop);
 }
}
const classroomReturnParams=new URLSearchParams(window.location.search);let classroomReturnHandled=false;
const joinPanel=joinForm.closest('.class-join-panel'),joinDrawer=document.createElement('details'),joinSummary=document.createElement('summary');
joinDrawer.className='class-join-drawer';joinDrawer.hidden=true;joinSummary.textContent='Join a class';joinPanel.before(joinDrawer);joinDrawer.append(joinSummary,joinPanel);
let classroomMode;
function setClassroomMode(joined){
 const changed=classroomMode!==joined;classroomMode=joined;joinDrawer.hidden=joined;
 joinDrawer.classList.toggle('has-classes',joined);joinSummary.textContent=joined?'Join another class':'Join your teacher’s class';
 if(changed)joinDrawer.open=!joined;
 if(joined)container.after(joinDrawer);else status.closest('.class-load-bar').before(joinDrawer);
 const title=document.getElementById('joinClassTitle');if(title)title.textContent=joined?'Leave your current class before joining another.':'Have a class code?';
 const description=document.querySelector('.class-page-heading p');if(description)description.textContent=joined?'Find your next activity, read teacher updates, or open Classmates for the class directory.':'Use your teacher’s class code to see assignments, announcements, and classmates.';
}
const rows=snapshot=>snapshot.docs.map(d=>({...d.data(),id:d.id}));
function text(tag,value,className){const node=document.createElement(tag);node.textContent=value;if(className)node.className=className;return node;}
function link(label,url,classroom=null,activity=null){const node=text('a',label,'text-button');node.href=url+(classroom&&activity?(url.includes('?')?'&':'?')+new URLSearchParams({classroom,activity}):'');return node;}
function dueDate(value){const date=value?.toDate?.();return date&&Number.isFinite(date.getTime())?date:null;}
const classSectionViews=new Map();
function animateClassView(panel){if(matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('lakbay-reduce-motion'))return;panel.animate?.([{opacity:.4,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'ease-out'});}
const classroomMotionPreference=matchMedia('(prefers-reduced-motion: reduce)');const stopClassMotion=()=>{if(classroomMotionPreference.matches||document.body.classList.contains('lakbay-reduce-motion'))for(const animation of container.getAnimations({subtree:true}))animation.cancel();};classroomMotionPreference.addEventListener('change',stopClassMotion);const classroomMotionSettings=new MutationObserver(stopClassMotion);classroomMotionSettings.observe(document.body,{attributes:true,attributeFilter:['class']});window.addEventListener('pagehide',()=>{classroomMotionPreference.removeEventListener('change',stopClassMotion);classroomMotionSettings.disconnect();},{once:true});
function openVisibleClassDirectory(card) {
 card?.querySelector('.class-community-view:not([hidden]) .classmates-panel')?.dispatchEvent(new Event('classmates:open'));
}
function organizeClass(card,record){
 const navigation=text('nav','','class-section-nav');navigation.setAttribute('role','tablist');navigation.setAttribute('aria-label','Class sections');
 const sections=[
  ['Overview','class-overview-view','house'],
  ['Activities','class-learning-view','book-open'],
  ['Announcements','class-updates-view','mail'],
  ['Classmates','class-community-view','landmark']
 ].map(([label,className,icon])=>({label,icon,panel:text('div','',className)}));
 for(const child of [...card.children]){if(child.matches('header,.class-description,.class-action-status'))continue;const target=child.matches('.class-next-step,.class-feedback')?sections[0]:child.matches('.classmates-panel')?sections[3]:child.matches('.class-announcements')?sections[2]:sections[1];target.panel.append(child);}
 const activate=(entry,focus=false)=>{classSectionViews.set(card.dataset.classId,entry.label);for(const item of sections){const active=item===entry;item.panel.hidden=!active;item.button.setAttribute('aria-selected',String(active));item.button.tabIndex=active?0:-1;}if(focus)entry.button.focus();animateClassView(entry.panel);if(card.isConnected&&!card.hidden)openVisibleClassDirectory(card);};
 for(const [index,entry] of sections.entries()){
  const button=text('button','','class-section-button');button.type='button';entry.button=button;
  const icon=text('span','','interface-icon interface-icon--'+entry.icon);icon.setAttribute('aria-hidden','true');
  entry.caption=text('span',entry.label);button.append(icon,entry.caption);
  button.id='class-tab-'+encodeURIComponent(card.dataset.classId)+'-'+index;entry.panel.id=button.id+'-panel';button.setAttribute('role','tab');button.setAttribute('aria-controls',entry.panel.id);entry.panel.setAttribute('role','tabpanel');entry.panel.setAttribute('aria-labelledby',button.id);navigation.append(button);button.addEventListener('click',()=>activate(entry));button.addEventListener('keydown',event=>{let target;if(event.key==='ArrowRight')target=(index+1)%sections.length;else if(event.key==='ArrowLeft')target=(index+sections.length-1)%sections.length;else if(event.key==='Home')target=0;else if(event.key==='End')target=sections.length-1;else return;event.preventDefault();sections[target].button.click();sections[target].button.focus();});
 }
 card.addEventListener('class-open-activities',event=>{
  activate(sections[1]);
  const assignmentId=event.detail?.assignmentId;if(!assignmentId)return;
  const item=[...sections[1].panel.querySelectorAll('.class-assignment')].find(el=>
   el.dataset.assignmentId===assignmentId&&(!event.detail.activityType||el.dataset.assignmentType===event.detail.activityType));if(!item)return;
  const filter=sections[1].panel.querySelector('.class-activity-filter select');if(filter){filter.value='all';filter.dispatchEvent(new Event('change'));}
  const history=item.closest('details.class-completed-history,details.class-ended-history');if(history)history.open=true;
  const drawer=event.detail.guidance?item.querySelector('.review-reflection'):
   event.detail.help?item.querySelector('.mission-help:not(.review-reflection)'):null;
  if(drawer){
   drawer.open=true;
   drawer.scrollIntoView({block:'nearest',behavior:'instant'});
   drawer.querySelector('summary').focus({preventScroll:true});
   return;
  }
  const steps=item.querySelector('.review-learning-stages');if(event.detail.reviewSteps&&steps){steps.open=true;steps.querySelector('summary')?.focus();}else{item.tabIndex=-1;item.focus();}
  item.scrollIntoView({block:'nearest',behavior:'auto'});
 });
 const feedback=sections[0].panel.querySelector('.class-feedback');
 if(feedback){
  const drawer=document.createElement('details');drawer.className='class-guidance-drawer';
  const summary=text('summary','');
  const icon=text('span','','interface-icon interface-icon--book-open');icon.setAttribute('aria-hidden','true');
  summary.append(icon,text('span',"Your teacher's guidance",'class-guidance-label'));
  drawer.append(summary);feedback.before(drawer);drawer.append(feedback);
 }
 const latest=sections[2].panel.querySelector('.class-announcement');if(latest){const brief=text('section','','class-latest-note');brief.append(text('span','LATEST TEACHER NOTE','eyebrow'),text('h3',latest.querySelector('h4')?.textContent||'A message from your teacher'));const body=(latest.querySelector('.class-announcement-body')||latest.querySelector('p'))?.textContent||'';brief.append(text('p',body.length>180?body.slice(0,177)+'...':body));const open=text('button','Read announcements','text-button');open.type='button';open.addEventListener('click',()=>{sections[2].button.click();sections[2].button.focus();});brief.append(open);const nextStep=sections[0].panel.querySelector('.class-next-step');if(nextStep)nextStep.after(brief);else sections[0].panel.prepend(brief);}
 const directoryShortcut=text('section','','class-roster-shortcut');
 directoryShortcut.append(text('h3','Classmates'),text('p','Find your classmates’ shared profiles and manage what you share.'));
 const openDirectory=text('button','View classmates','text-button');
 openDirectory.type='button';
 openDirectory.addEventListener('click',()=>activate(sections[3],true));
 directoryShortcut.append(openDirectory);
 const overview=sections[0].panel;
 const guidanceDrawer=overview.querySelector('.class-guidance-drawer');
 overview.insertBefore(directoryShortcut,guidanceDrawer);
 const learning=sections[1].panel,items=[...learning.querySelectorAll('.class-assignment')];
 if(items.length){
  const toolbar=text('label','Show activities','class-activity-filter'),filter=text('select','');toolbar.append(filter);for(const [value,label] of [['all','All activities'],['todo','To do'],['waiting','Waiting for teacher'],['complete','Practice / activity goal reached'],['ended','Ended activities']]){const option=text('option',label);option.value=value;filter.append(option);}
  const endedHistory=document.createElement('details');endedHistory.className='class-ended-history';endedHistory.append(text('summary','Ended activities - '+items.filter(el=>el.dataset.ended==='true').length));for(const item of items.filter(el=>el.dataset.ended==='true'))endedHistory.append(item);
  const history=document.createElement('details');history.className='class-completed-history';history.append(text('summary','Practice and activity goals reached · '+items.filter(el=>el.dataset.state==='complete'&&el.dataset.ended!=='true').length));
  for(const item of items.filter(el=>el.dataset.state==='complete'&&el.dataset.ended!=='true'))history.append(item);
  learning.insertBefore(toolbar,learning.querySelector('.class-assignment')||null);if(history.children.length>1)learning.append(history);if(endedHistory.children.length>1)learning.append(endedHistory);
  const filterNotice=text('p','','class-completion-note');filterNotice.setAttribute('role','status');toolbar.after(filterNotice);
  const filterItems=()=>{
   for(const item of items){
    const ended=item.dataset.ended==='true',complete=item.dataset.state==='complete';
    const matches={all:true,todo:!ended&&!complete,waiting:item.dataset.waiting==='true',complete:!ended&&complete,ended};
    item.hidden=!matches[filter.value];
   }
   for(const group of [endedHistory,history]){
    group.hidden=![...group.querySelectorAll('.class-assignment')].some(item=>!item.hidden);
    if(filter.value!=='all'&&!group.hidden)group.open=true;
   }
   const visible=items.filter(item=>!item.hidden).length;
   filterNotice.textContent=filter.value==='all'?'':visible+' matching '+(visible===1?'activity':'activities')+'.'+(filter.value==='waiting'?' Waiting status comes from your latest loaded help requests.':'');
  };
  filter.addEventListener('change',filterItems);card.addEventListener('class-help-state',filterItems);filterItems();
  const shortcuts=sections[0].panel.querySelector('.class-overview-shortcuts');
  for(const control of shortcuts?.querySelectorAll('button[data-activity-filter]')||[])control.addEventListener('click',()=>{
   activate(sections[1]);
   filter.value=control.dataset.activityFilter;
   filterItems();
   filter.focus();
  });
 }
 const unseenKey=classAnnouncementSeenKey(auth.currentUser?.uid,card.dataset.classId);
 let announcementVersion=record.announcementError?'':classAnnouncementVersion(publishedAnnouncements(record.announcements||[],record.id),record.teacherName);
 let announcementsSeen=false;
 try{announcementsSeen=localStorage.getItem(unseenKey)===announcementVersion;}catch{}
 const updateBadge=()=>{const unread=Number(sections[0].panel.querySelector('.class-feedback')?.dataset.unread||0),news=!announcementsSeen&&!!announcementVersion;sections[2].caption.textContent='Announcements'+(news?' - New':'');sections[0].caption.textContent='Overview'+(unread?' - '+unread+' new feedback':'');if(guidanceDrawer){guidanceDrawer.dataset.unread=String(unread>0);guidanceDrawer.querySelector('.class-guidance-label').textContent="Your teacher's guidance"+(unread?' ('+unread+' new)':'');}};
 card.addEventListener('class-feedback-loaded',updateBadge);
 card.addEventListener('class-announcements-updated',()=>{
  const section=sections[2].panel;
  section.querySelector('.class-announcements')?.remove();
  renderClassAnnouncements(section,record);
  announcementVersion=classAnnouncementVersion(publishedAnnouncements(record.announcements,record.id),record.teacherName);
  announcementsSeen=false;
  try{announcementsSeen=localStorage.getItem(unseenKey)===announcementVersion;}catch{}
  if(!section.hidden&&announcementVersion){
   announcementsSeen=true;
   try{localStorage.setItem(unseenKey,announcementVersion);}catch{}
  }
  updateBadge();
  window.dispatchEvent(new Event('lakbay:class-updates-changed'));
 });
 card.addEventListener('class-help-changed',()=>window.dispatchEvent(new Event('lakbay:class-updates-changed')));
 sections[2].button.addEventListener('click',()=>{
  if(!announcementsSeen&&announcementVersion){
   announcementsSeen=true;
   try{localStorage.setItem(unseenKey,announcementVersion);}catch{}
   window.dispatchEvent(new Event('lakbay:class-updates-changed'));
  }
  updateBadge();
 });
 card.addEventListener('class-open-update',event=>{
  const {kind,id,onResolved}=event.detail;
  function reveal(target){
   target.tabIndex=-1;
   target.scrollIntoView({block:'nearest',behavior:'instant'});
   target.focus({preventScroll:true});
  }
  if(kind==='announcement'){
   const item=[...sections[2].panel.querySelectorAll('[data-announcement-id]')].find(row=>row.dataset.announcementId===id);
   if(item){sections[2].button.click();reveal(item);}
   onResolved(Boolean(item));
  }else if(kind==='feedback'){
   activate(sections[0]);
   const drawer=feedback?.closest('details');
   if(!drawer){onResolved(false);return;}
   drawer.open=true;
   const onFailed=()=>onResolved(null);
   function revealFeedback(){
    card.removeEventListener('class-feedback-load-failed',onFailed);
    const item=[...feedback.querySelectorAll('[data-feedback-id]')].find(row=>row.dataset.feedbackId===id);
    if(item&&!sections[0].panel.hidden)reveal(item);
    onResolved(Boolean(item));
   }
   if(feedback.dataset.loadState==='ready')revealFeedback();
   else{
    reveal(drawer.querySelector('summary'));
    card.addEventListener('class-feedback-loaded',revealFeedback,{once:true});
    card.addEventListener('class-feedback-load-failed',onFailed);
    if(feedback.dataset.loadState==='retry')onFailed();
   }
  }
 });
 updateBadge();
 card.append(navigation,...sections.map(entry=>entry.panel));const selected=sections.find(entry=>entry.label===classSectionViews.get(card.dataset.classId))||sections[0];activate(selected);return card;
}
function renderClass(record,path,progress,progressAvailable,request,uid,attempts,attemptsAvailable){
 const card=document.createElement('section');card.className='student-class-card';card.dataset.classId=record.id;
 const heading=document.createElement('header'),details=document.createElement('div');details.append(text('span',record.status==='active'?'YOUR CLASS':'ARCHIVED CLASS','eyebrow'),text('h2',record.name||'Your class'));
 if(record.teacherName)details.append(text('p','Teacher: '+record.teacherName));heading.append(details);
 const leave=text('button','Leave Class','text-button');leave.type='button';const options=document.createElement('details');options.className='student-class-options';options.append(text('summary','Class options'),leave);heading.append(options);card.append(heading);
 const notice=text('p','','class-action-status');notice.setAttribute('role','status');card.append(notice);
 leave.addEventListener('click',async()=>{if(generation!==request||auth.currentUser?.uid!==uid)return;if(!(await appConfirm('Leave this class? Your saved mission progress and rewards will remain.')))return;if(generation!==request||auth.currentUser?.uid!==uid)return;leave.disabled=true;const session=sessionGeneration;try{await leaveStudentClass(record.id);if(sessionGeneration===session&&auth.currentUser?.uid===uid){classroomReturnHandled=true;window.dispatchEvent(new Event('lakbay:class-updates-changed'));await reloadAfterMembershipChange('You left the class. Your learning progress is still saved.');}}catch(error){if(generation===request){notice.textContent=error.code==='class/membership-unconfirmed'?error.message:'Could not leave this class. Please try again.';leave.disabled=false;}}});
 if(record.description)card.append(text('p',record.description,'class-description'));
 const nextStep=text('section','','class-next-step');nextStep.setAttribute('aria-label','Your next class activity');
 const classEvidence=a=>classroomAssignmentEvidence(a,attempts,record.membership,uid);
 const completed=a=>a.status==='withdrawn'?false:a.assignmentType==='targeted-review'?(attemptsAvailable&&reviewEvidence(a,attempts,uid).completed&&!reviewEvidence(a,attempts,uid).unavailable):(attemptsAvailable&&!classEvidence(a).unavailable&&classEvidence(a).completed);
 const assignmentEvidenceKnown=a=>progressAvailable&&(a.assignmentType==='targeted-review'?(attemptsAvailable&&!reviewEvidence(a,attempts,uid).unavailable):attemptsAvailable&&!classEvidence(a).unavailable);
 const completedInJourney=assignment=>progress.some(p=>p.userId===uid&&p.chapterId===assignment.chapterId&&p.missionId===assignment.missionId&&p.completed===true);
 const quizIsNext=assignment=>assignment.assignmentType!=='targeted-review'&&
  (classEvidence(assignment).attempted||completedInJourney(assignment));
 const activeAssignments=record.assignments.filter(a=>a.status==='published');
 const pending=progressAvailable?activeAssignments.filter(a=>!completed(a)):[];
 const next=pending.find(a=>path.some(m=>m.id===a.missionId&&m.chapterId===a.chapterId&&m.accessible));
 const progressUnknown=record.assignmentError||!progressAvailable||activeAssignments.some(a=>!assignmentEvidenceKnown(a));
 const nextState=record.status!=='active'?'ended':progressUnknown?'unknown':next?'available':pending.length?'locked':activeAssignments.length?'complete':'empty';
 const makeRetry=()=>{
  const retry=text('button','Refresh Classes','text-button');
  retry.type='button';
  retry.addEventListener('click',async()=>{
   if(refresh.disabled)return;
   const restoreFocus=document.activeElement===retry;
   await loadClasses();
   if(restoreFocus&&auth.currentUser?.uid===uid&&document.activeElement===document.body)refresh.focus();
  });
  return retry;
 };
 nextStep.dataset.state=nextState;
 nextStep.append(text('span',nextState==='available'&&next.assignmentType==='targeted-review'?'TEACHER-ASSIGNED REVIEW':nextState==='available'?'YOUR CLASS ASSIGNMENT':'CLASS OVERVIEW','eyebrow'));
 if(record.status!=='active'){nextStep.append(text('h3','This class has ended'),text('p','You can revisit your class messages and continue learning in My Journey.'),link('Continue My Journey','my-journey.html'));}
 else if(progressUnknown){
  nextStep.append(text('h3','Assignment progress unavailable'),text('p','Refresh Classes to check assignments and saved progress. Teacher announcements are available when they load successfully.'));
  nextStep.append(makeRetry());
 }
 else if(next){
  const mission=path.find(m=>m.id===next.missionId&&m.chapterId===next.chapterId);
  nextStep.append(text('h3',next.title||mission?.title||'Your next mission'));
  const deadline=dueDate(next.dueAt);
  if(deadline){
   const due=text('time','Due '+deadline.toLocaleDateString('en-PH',{dateStyle:'medium',timeZone:'Asia/Manila'})+' · Philippine time','assignment-due');
   due.dateTime=deadline.toISOString();
   nextStep.append(due);
  }
  const targeted = next.assignmentType === 'targeted-review';
  const takeQuiz = quizIsNext(next);
  const destination = takeQuiz ? 'quiz.html' : 'story.html';
  const params = new URLSearchParams({chapter:next.chapterId, mission:next.missionId});
  if (targeted && next.reviewTopic) params.set('reviewTopic', next.reviewTopic);
  const actions=text('div','','class-next-actions');
  const start=link(targeted?'Review this concept':takeQuiz?(classEvidence(next).attempted?'Continue quiz review':'Take class quiz'):'Start assignment',
   destination + '?' + params, record.id, next.id);
  start.classList.add('class-next-primary');
  actions.append(start);
  const help=text('button','I’m stuck','text-button class-help-shortcut');
  help.type='button';
  help.addEventListener('click',()=>card.dispatchEvent(new CustomEvent('class-open-activities',{detail:{assignmentId:next.id,help:true}})));
  actions.append(help);
  nextStep.append(actions);
  if(next.instructions)nextStep.append(assignmentGuidance(next.instructions,targeted));
  else nextStep.append(text('p',takeQuiz?'Take the quiz from this assignment to record your result for your class.':'Read the lesson first, then take the quiz to save your result for your class.'));
 }else if(pending.length){const preparation=assignmentReadiness(path,pending[0]);nextStep.append(text('h3',preparation.state==='unavailable'?'Your assigned lesson is unavailable':'A few steps before your assignment'),text('p',preparation.state==='unavailable'?'Ask your teacher to check this assignment. You can continue your learning journey.':'Your teacher assigned a later lesson. Your place is saved: complete the earlier lessons and chapter checks to unlock it.'));if(preparation.next)nextStep.append(text('p','Continue with: '+preparation.next.title),link('Continue the earlier lesson','story.html?'+new URLSearchParams({chapter:preparation.next.chapterId,mission:preparation.next.id})));else nextStep.append(link('See my next learning step','my-journey.html'));}
 else if(activeAssignments.length){
  nextStep.append(text('h3','Practice goals reached'),text('p','Nice work finishing your practice goals. Your explanation helps your teacher see how you used the clues.'));
  const review=activeAssignments.find(a=>a.assignmentType==='targeted-review'&&a.reflectionQuestion);
  if(review){const check=text('button','Check explanation and guidance','primary-button');check.type='button';check.addEventListener('click',()=>card.dispatchEvent(new CustomEvent('class-open-activities',{detail:{assignmentId:review.id,reviewSteps:true}})));nextStep.append(check,text('p','Open one review at a time to check your saved steps. Checking is optional and does not change your score.','class-completion-note'));}
  nextStep.append(link('Keep exploring','my-journey.html'));
 }
 else{nextStep.append(text('h3','You’re connected to your teacher'),text('p','There are no active assigned missions. You can explore lessons and read your class activity history.'),link('Explore lessons','my-journey.html'));}
 if(nextState==='available'){
  const tracking=text('details','','class-sharing-note');
  tracking.append(text('summary','What progress does my teacher see?'),
   text('p','Your teacher can see progress saved from this class activity. Open it here and submit a new quiz attempt to record classroom work.'));
  nextStep.append(tracking);
 }
 card.append(nextStep);
 if(record.status==='active'&&!progressUnknown&&activeAssignments.length){
  const shortcuts=text('div','','class-overview-shortcuts');
  shortcuts.setAttribute('role','group');
  shortcuts.setAttribute('aria-label','Class activities by status');
  for(const [count,label,value] of [[pending.length,'To do','todo'],[activeAssignments.length-pending.length,'Goals reached','complete']]){
   const shortcut=text('button','','class-overview-shortcut');
   shortcut.type='button';
   shortcut.dataset.activityFilter=value;
   shortcut.append(text('strong',String(count)),text('span',label));
   shortcuts.append(shortcut);
  }
  nextStep.append(shortcuts);
 }
 renderClassmates(card,record,()=>generation===request&&auth.currentUser?.uid===uid);
 renderClassAnnouncements(card,record);
 const targetFeedback=!classroomReturnHandled&&classroomReturnParams.get('classroom')===record.id&&
  classroomReturnParams.get('update')==='feedback'?classroomReturnParams.get('item'):null;
 renderStudentFeedback(card,record,path,()=>generation===request&&auth.currentUser?.uid===uid,targetFeedback);
 card.append(text('h3','Class goals and your reviews'));
 if(progressAvailable&&!record.assignmentError&&activeAssignments.length&&activeAssignments.every(assignmentEvidenceKnown)){const done=activeAssignments.filter(completed).length;const summary=text('div','','class-quest-progress');summary.append(text('strong',done+' / '+activeAssignments.length+' practice / activity goals reached'));const meter=document.createElement('progress');meter.max=activeAssignments.length;meter.value=done;meter.setAttribute('aria-label','Practice and activity goals reached');summary.append(meter);card.append(summary);}
 if(record.assignmentError){
  const warning=text('div','','class-warning class-activities-warning');
  warning.append(text('p','Assignments could not load.'),makeRetry());
  card.append(warning);
  return organizeClass(card,record);
 }
 if(!record.assignments.length){
  const empty=text('div','','class-activities-empty');
  empty.append(text('strong','No missions assigned yet'),
   text('p','Keep exploring until your teacher adds a mission.'),
   link('Continue My Journey','my-journey.html'));
  card.append(empty);
  return organizeClass(card,record);
 }
 card.append(text('p','Class activities require a fresh passing quiz opened from this assignment. Earlier solo completion does not finish classroom work. Your personal progress and earned rewards stay saved.','class-completion-note'));
 for(const assignment of record.assignments){
  const item=document.createElement('article');item.className='class-assignment';item.dataset.assignmentId=assignment.id;const ended=['closed','withdrawn'].includes(assignment.status);item.dataset.ended=String(ended);
  const mission=path.find(m=>m.id===assignment.missionId&&m.chapterId===assignment.chapterId);
  const review=assignment.assignmentType==='targeted-review',evidence=review&&attemptsAvailable?reviewEvidence(assignment,attempts,uid):null;
  item.dataset.assignmentType=review?'targeted-review':'class-goal';
  const complete=progressAvailable&&completed(assignment);
  const evidenceKnown=assignmentEvidenceKnown(assignment);
  if(review){item.append(text('p','Your teacher chose this topic for you to revisit. Read the guidance, review the lesson, then save a new passing quiz result.'));if(!attemptsAvailable||evidence?.unavailable)item.append(text('p','Review results could not be verified. Refresh Classes to check again.','class-warning'));else if(evidence?.attempted)item.append(text('p','Latest review score: '+(evidence.latest??'unavailable')+'%'+(evidence.baseline!=null?' | Before assignment: '+evidence.baseline+'%':'')+(evidence.change!=null?' | Change: '+(evidence.change>0?'+':'')+evidence.change+' percentage points':'')+'. '+(evidence.completed?'Practice goal reached. Your explanation and teacher guidance are separate steps.':'Keep practicing and try again.')));}
  const deadline=dueDate(assignment.dueAt),late=!complete&&deadline&&deadline.getTime()<Date.now();item.dataset.state=ended?assignment.status:!evidenceKnown?'unknown':complete?'complete':!mission||!mission.accessible?'locked':late?'late':'available';
  const heading=text('div','','assignment-heading');
  const meta=text('div','','assignment-meta');
  meta.append(text('span',ended?(assignment.status==='closed'?'Closed activity':'Withdrawn - no longer required'):!evidenceKnown?'Progress unavailable':complete?'Completed':!mission?'Content unavailable':!mission.accessible?'Earlier lessons needed':late?'Past due':'Ready','assignment-state'+(complete?' is-complete':'')));
  if(!ended&&deadline)meta.append(text('p','Due '+deadline.toLocaleString('en-PH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Manila'})+' (Philippine time)','assignment-due'));
  heading.append(text('span',review?'PERSONAL REVIEW':'CLASS LEARNING GOAL','assignment-purpose'),text('h4',assignment.title||mission?.title||'Assigned mission'),meta);
  item.prepend(heading);
  if(!review&&!ended&&completedInJourney(assignment)&&!complete)item.append(text('p','You completed this mission in your personal journey. Take a fresh class quiz here to submit this assignment.','class-completion-note'));
  if(!ended&&progressAvailable&&mission&&!mission.accessible&&record.status==='active'){
   const readiness=assignmentReadiness(path,assignment),preparation=text('div','','assignment-preparation');
   preparation.append(text('strong','This lesson is further along your journey'),text('p','Being assigned a mission does not skip earlier lessons. Complete your next learning step first; this assignment will stay here.'));
   if(readiness.next)preparation.append(text('p','Your next lesson: '+readiness.next.title),link('Continue earlier lesson','story.html?'+new URLSearchParams({chapter:readiness.next.chapterId,mission:readiness.next.id})));
   else preparation.append(text('p','You may need to finish a chapter check or meet another chapter requirement. My Journey shows the next step.'));
   item.append(preparation);
  }
  if(review&&assignment.reviewTopic)item.append(text('p','Focus on: '+assignment.reviewTopic.replace(/[-_]+/g,' '),'review-focus-label'));
  if(assignment.instructions)item.append(assignmentGuidance(assignment.instructions,review));
  if(ended)item.append(text('p',assignment.status==='closed'?'Your teacher finished this activity. Earlier results and messages stay here; new independent learning does not change this activity.':'Your teacher cancelled this activity. You do not need to finish it. Your own learning progress and rewards are unchanged.','class-ended-note'));
  if(ended&&assignment.status==='closed')item.append(text('p',!evidenceKnown?'Earlier results could not be verified.':complete?'Completed before this activity closed.':'No verified completion recorded before this activity closed.','class-ended-outcome'));
  if(ended&&dueDate(assignment.endedAt))item.append(text('p','Ended '+dueDate(assignment.endedAt).toLocaleString('en-PH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Manila'})+' (Philippine time)','assignment-ended-date'));
  if(!ended&&deadline&&progressAvailable&&mission&&!mission.accessible)item.append(text('p','If you cannot reach this lesson before the due date, use Ask your teacher for help below.','class-completion-note'));
  if(ended){item.append(link('Continue my own learning','my-journey.html'));}
  else if(progressAvailable&&mission?.accessible&&record.status==='active'){
   const actions=text('div','','assignment-actions');
   const lesson=link(review?(assignment.reviewTopic?'Review this concept':'Revisit lesson'):complete?'Review Lesson':'Open Lesson','story.html?'+new URLSearchParams({chapter:assignment.chapterId,mission:assignment.missionId,...(review&&assignment.reviewTopic?{reviewTopic:assignment.reviewTopic}:{})}),record.id,assignment.id);
   const quiz=link(complete?'Try another class quiz':'Take class quiz','quiz.html?'+new URLSearchParams({chapter:assignment.chapterId,mission:assignment.missionId}),record.id,assignment.id);
   if(!complete){const next=quizIsNext(assignment)?quiz:lesson;next.classList.add('assignment-primary-action');actions.append(next,next===lesson?quiz:lesson);}
   else actions.append(lesson,quiz);
   heading.after(actions);
  }
  else if(progressAvailable&&mission&&!mission.accessible)item.append(link('View prerequisites in My Journey','my-journey.html'));
  else if(!progressAvailable)item.append(text('p','We could not verify your progress. Refresh before opening this assignment.','class-warning'));
  else if(record.status!=='active')item.append(text('p','This class is archived. Your completed missions remain saved.'));
  if(review)renderStudentReviewStages(item,record,assignment,evidence,()=>generation===request&&auth.currentUser?.uid===uid);
  renderMissionHelp(item,record,assignment,()=>generation===request&&auth.currentUser?.uid===uid);
  if(review&&(complete||ended)&&record.status==='active'){
   renderReviewReflection(item,record,assignment,evidence,()=>generation===request&&auth.currentUser?.uid===uid);
   item.addEventListener('review-reflection-changed',event=>{
    if(!item.querySelector('.review-reflection')?.open||event.detail?.reviewId!==assignment.id)return;
    if(acknowledgeReflectionGuidance(uid,record.membership,event.detail.record))window.dispatchEvent(new Event('lakbay:class-updates-changed'));
   });
  }
  card.append(item);
 }
 const explanation=card.querySelector('.review-reflection');if(explanation){const action=text('button','Share or revisit your explanation','text-button');action.type='button';nextStep.append(action);action.addEventListener('click',()=>{card.dispatchEvent(new Event('class-open-activities'));const filter=card.querySelector('.class-activity-filter select');if(filter){filter.value='all';filter.dispatchEvent(new Event('change'));}const history=explanation.closest('.class-completed-history');if(history)history.open=true;explanation.open=true;explanation.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});explanation.querySelector('summary')?.focus();});}
 return organizeClass(card,record);
}
function assignmentGuidance(instructions, review) {
 const guidance = text('div', '', 'class-assignment-guidance');
 const heading = text('strong', '', 'class-assignment-guidance-heading');
 const icon = text('span', '', 'interface-icon interface-icon--book-open');
 icon.setAttribute('aria-hidden', 'true');
 heading.append(icon, document.createTextNode(review ? 'Your teacher’s follow-up' : 'Your teacher’s instructions'));
 guidance.append(heading, text('p', instructions));
 return guidance;
}
async function loadClasses({background=false}={}){
 const user=auth.currentUser,request=++loadRequest;
 const current=()=>loadRequest===request&&auth.currentUser?.uid===user?.uid;
 const panelCurrent=()=>generation===request&&auth.currentUser?.uid===user?.uid;
 const commit=()=>{generation=request;stopClassroomUpdates();container.replaceChildren();delete status.dataset.state;};
 if(!background){commit();status.textContent=user?'Loading your classes...':'Sign in to view your classes.';}
 refresh.disabled=!!user;
 if(!user)return;
 const deferUpdate=()=>{
  if(!background||!classroomInteractionInProgress())return false;
  scheduleActivityUpdate(current);
  return true;
 };
 const returningClass=classroomReturnParams.get('classroom');
 const updateKind=classroomReturnParams.get('update'),updateId=classroomReturnParams.get('item'),activityType=classroomReturnParams.get('type');
 const activityUpdate=['reply','guidance',...classActivityUpdateKinds].includes(updateKind);
 const openingUpdate=!classroomReturnHandled&&returningClass&&updateId&&(activityUpdate||['announcement','feedback'].includes(updateKind));
 const readMemberships=openingUpdate?getDocsFromServer:getDocs;
 try{
  const memberships=rows(await readMemberships(query(collection(db,'classMembers'),where('userId','==',user.uid)))).filter(m=>m.userId===user.uid&&m.status==='active');if(!current())return;
  const ids=[...new Set(memberships.map(m=>m.classId))];
  if(!ids.length){
   if(deferUpdate())return;
   if(background)commit();
   setClassroomMode(false);
   const empty=text('section','','class-empty-panel class-enrollment-empty');
   empty.setAttribute('aria-labelledby','classEnrollmentTitle');
   const emblem=text('span','','class-enrollment-emblem');
   emblem.setAttribute('aria-hidden','true');
   emblem.append(text('span','','interface-icon interface-icon--book-open'));
   const copy=text('div','','class-enrollment-copy');
   const title=text('h2','Ready to join your class?');
   title.id='classEnrollmentTitle';
   copy.append(title,text('p','Ask your teacher for a class code. You can keep exploring on your own while you wait.'));
   const actions=text('div','','class-enrollment-actions');
   const enterCode=text('button','Enter class code','lp-button lp-button-primary');
   enterCode.type='button';
   enterCode.addEventListener('click',()=>{
    joinDrawer.open=true;
    (code.disabled?joinSummary:code).focus();
   });
   const continueJourney=link('Continue My Journey','my-journey.html');
   continueJourney.classList.add('lp-button','lp-button-secondary');
   actions.append(enterCode,continueJourney);
   empty.append(emblem,copy,actions);
   container.append(empty);
   status.textContent=openingUpdate?'This notification is no longer available. You are not currently in a class.':'You have not joined a class yet.';
   if(openingUpdate)classroomReturnHandled=true;
   return;
  }
  const names=['eras','chapters','missions','studentProgress','studentChapterProgress','studentQuizAttempts'];
  const [catalogs,classResults]=await Promise.all([
   Promise.allSettled(names.map(name=>name.startsWith('student')
    ? getDocs(query(collection(db,name),where('userId','==',user.uid)))
    : instructionalSnapshot(name,()=>getDocs(collection(db,name))))),
   Promise.allSettled(ids.map(async id=>{
    const snapshot=await getDocFromServer(doc(db,'classes',id));
    if(!snapshot.exists())throw Error('Missing class');
    const record={...snapshot.data(),id,membership:memberships.find(m=>m.classId===id)};
    const openingThisClass=openingUpdate&&id===returningClass;
    const readAnnouncements=openingThisClass&&updateKind==='announcement'?getDocsFromServer:getDocs;
    const readActivities=background||(openingThisClass&&activityUpdate)?getDocsFromServer:getDocs;
    record.activityVersions=[null,null];
    try{
     record.announcements=rows(await readAnnouncements(query(collection(db,'classAnnouncements'),where('classId','==',id),where('status','==','published'))));
    }catch{record.announcements=[];record.announcementError=true;}
    try{
     const assignments=await readActivities(classActivityQuery(id,user.uid,false));
     record.activityVersions[0]=activityVersion(assignments);
     record.assignments=rows(assignments).filter(a=>a.classId===id&&activityStates.includes(a.status));
    }catch{record.assignments=[];record.assignmentError=true;}
    try{
     const reviews=await readActivities(classActivityQuery(id,user.uid,true));
     record.activityVersions[1]=activityVersion(reviews);
     record.assignments.push(...rows(reviews).map(a=>({...a,assignmentType:'targeted-review'})));
    }catch{record.assignmentError=true;}
    record.assignments.sort((a,b)=>(dueDate(a.dueAt)?.getTime()??Infinity)-(dueDate(b.dueAt)?.getTime()??Infinity)||a.id.localeCompare(b.id));
    return record;
   }))
  ]);if(!current()||deferUpdate())return;
  if(background&&classResults.some(result=>result.status==='rejected'||result.value.assignmentError||result.value.announcementError)){
   showClassroomConnection('New class details could not load. Showing your last loaded activities. Use Refresh Classes to try again.');
   return;
  }
  const previousCard=background?container.querySelector('.student-class-card:not([hidden])'):null;
  const focusedId=container.contains(document.activeElement)?document.activeElement.id:null;
  const previousFilter=previousCard?.querySelector('.class-activity-filter select');
  const filterValue=previousFilter?.value,filterFocused=previousFilter===document.activeElement;
  const chooserFocused=document.activeElement?.matches('.student-class-select');
  if(background)commit();
  setClassroomMode(true);
  const progressAvailable=catalogs.slice(0,5).every(r=>r.status==='fulfilled'),attemptsAvailable=catalogs[5].status==='fulfilled',attempts=attemptsAvailable?rows(catalogs[5].value):[];let path=[],progress=[];
  if(progressAvailable){const [eras,chapters,missions,missionProgress,chapterProgress]=catalogs.slice(0,5).map(r=>rows(r.value));progress=missionProgress;path=buildJourneyPath({userId:user.uid,eras,chapters,missions,challenges:[],missionProgress,chapterProgress}).flatMap(e=>e.chapters.flatMap(c=>c.missions));}
  const available=classResults.filter(result=>result.status==='fulfilled').map(result=>result.value);
  if(!classroomReturnHandled&&returningClass&&available.some(record=>record.id===returningClass))selectedClassId=returningClass;
  if(!available.some(record=>record.id===selectedClassId))selectedClassId=available[0]?.id;
  const chooser=text('label','Your classroom','class-switcher'),select=text('select','','student-class-select');select.setAttribute('aria-label','Choose your classroom');chooser.append(select);const panels=[];
  for(const record of available){const option=text('option',record.name||'Your class');option.value=record.id;select.append(option);const panel=renderClass(record,path,progress,progressAvailable,request,user.uid,attempts,attemptsAvailable);panel.id='joined-class-'+record.id;renderClassReplyIndicator(panel,record,()=>generation===request&&auth.currentUser?.uid===user.uid);panels.push({panel,id:record.id});}
  select.value=selectedClassId||'';select.addEventListener('change',()=>{selectedClassId=select.value;for(const entry of panels){entry.panel.hidden=entry.id!==selectedClassId;if(!entry.panel.hidden){animateClassView(entry.panel);openVisibleClassDirectory(entry.panel);}}});
  if(available.length)container.append(chooser);for(const entry of panels){entry.panel.hidden=entry.id!==selectedClassId;container.append(entry.panel);}
  for(const entry of panels){
   const record=available.find(item=>item.id===entry.id);
   watchClassAnnouncements(record,entry.panel,panelCurrent);
   watchClassActivities(record,user.uid,panelCurrent);
  }
  const visible=panels.find(entry=>entry.id===selectedClassId)?.panel;
  openVisibleClassDirectory(visible);
  if(background){
   const filter=visible?.querySelector('.class-activity-filter select');
   if(filter&&filterValue){filter.value=filterValue;filter.dispatchEvent(new Event('change'));}
   if(filterFocused)filter?.focus({preventScroll:true});
   else if(chooserFocused&&select.isConnected)select.focus({preventScroll:true});
   else if(focusedId)document.getElementById(focusedId)?.focus({preventScroll:true});
   window.dispatchEvent(new Event('lakbay:class-updates-changed'));
  }
  const unavailable=classResults.some(result=>result.status==='rejected')||available.some(record=>record.assignmentError||record.announcementError);
  if(unavailable||!progressAvailable)status.dataset.state='warning';
  status.textContent=unavailable?'Some class details could not load. Use Refresh Classes to retry.':!progressAvailable||!attemptsAvailable?'Classes loaded, but assignment progress could not be verified. Use Refresh Classes to retry.':background?'Class activities updated.':'Your classes are up to date.';
  if(openingUpdate){
   const record=available.find(row=>row.id===returningClass),entry=panels.find(row=>row.id===returningClass);
   const onResolved=found=>{
    if(!current())return;
    if(found===null){
     status.textContent='This update could not load. Try again in My Class.';
     return;
    }
    classroomReturnHandled=true;
    status.textContent=found?'Opened from class notifications.':'This notification is no longer available. Your current class updates are still in My Class.';
   };
   if((!record&&ids.includes(returningClass))||(updateKind==='announcement'&&record?.announcementError)||(activityUpdate&&record?.assignmentError)){
    status.textContent='This update could not load. Use Refresh Classes to try again.';
   }else if(!entry)onResolved(false);
   else if(activityUpdate){
    const assignment=record.assignments.find(row=>row.id===updateId&&(!activityType||notificationActivityType(row)===activityType));
    const item=[...entry.panel.querySelectorAll('.class-assignment')].find(row=>
     row.dataset.assignmentId===updateId&&(!activityType||row.dataset.assignmentType===activityType));
    if(!assignment||!item)onResolved(false);
    else{
     const guidance=updateKind==='guidance';
     entry.panel.dispatchEvent(new CustomEvent('class-open-activities',{detail:{assignmentId:updateId,activityType,help:updateKind==='reply',guidance}}));
     if(guidance&&!item.querySelector('.review-reflection')){
      status.textContent='Your explanation could not open. Refresh Classes to check the saved activity.';
     }else{
      if(classActivityUpdateKinds.includes(updateKind)){
       const version=classroomReturnParams.get('version');
       const acknowledged=acknowledgeClassActivity(user.uid,record.membership,assignment,updateKind,version);
       window.dispatchEvent(new Event('lakbay:class-updates-changed'));
       if(version&&!acknowledged){
        classroomReturnHandled=true;
        status.textContent='This notification is out of date. The current activity details are shown below.';
        return;
       }
      }
      onResolved(true);
     }
    }
   }else{
    status.textContent='Opening your class update…';
    entry.panel.dispatchEvent(new CustomEvent('class-open-update',{detail:{kind:updateKind,id:updateId,onResolved}}));
   }
   return;
  }
  const returningActivity=classroomReturnParams.get('activity');
  if(!classroomReturnHandled&&returningClass&&returningActivity){
   const record=available.find(entry=>entry.id===returningClass),entry=panels.find(entry=>entry.id===returningClass);
   if(record?.assignmentError||(!record&&ids.includes(returningClass))){
    status.textContent='Your class activity could not be checked. Refresh Classes to try returning again.';
   }
   else {
    classroomReturnHandled=true;
    if(record?.assignments.some(assignment=>assignment.id===returningActivity)&&entry){
     entry.panel.dispatchEvent(new CustomEvent('class-open-activities',{detail:{assignmentId:returningActivity}}));
     status.textContent=progressAvailable&&attemptsAvailable?'Back at your class activity.':'Back at your class activity. Refresh Classes to check saved progress.';
    }
    else status.textContent='That class activity is no longer available to this account. You can choose from your current classes.';
   }
  }
 }catch(error){if(current()){
  if(background)showClassroomConnection('The classroom update could not load. Showing your last loaded activities. Use Refresh Classes to try again.');
  else{
   if(classroomMode===undefined)setClassroomMode(false);
   status.dataset.state='warning';
   status.textContent=studentLoadMessage(error,'We could not load your classes. Use Refresh Classes to retry.');
  }
 }}
 finally{if(current())refresh.disabled=false;}
}
async function reloadAfterMembershipChange(message,classId=null){
 const loading=loadClasses(),request=generation;
 await loading;
 if(generation!==request)return;
 const card=container.querySelector('.student-class-card:not([hidden])');
 const heading=classId&&card?.dataset.classId!==classId?null:card?.querySelector('header h2')||document.getElementById('classEnrollmentTitle');
 const needsRefresh=status.dataset.state==='warning'||!heading;
 status.textContent=needsRefresh?`${message} ${status.textContent}`:message;
 status.dataset.state=needsRefresh?'warning':'success';
 const target=heading||status;
 target.tabIndex=-1;
 target.focus();
}
function clearClassCodeError(){code.removeAttribute('aria-invalid');delete joinStatus.dataset.state;joinStatus.textContent='';}
code.addEventListener('input',()=>{if(!joining)clearClassCodeError();});
joinForm.addEventListener('submit',async event=>{
 event.preventDefault();
 if(joining||!auth.currentUser)return;
 clearClassCodeError();
 let classCode;
 try{classCode=normalizeClassCode(code.value);}catch(error){
  code.setAttribute('aria-invalid','true');joinStatus.dataset.state='error';joinStatus.textContent=error.message;code.focus();return;
 }
 const session=sessionGeneration,uid=auth.currentUser.uid;
 const current=()=>sessionGeneration===session&&auth.currentUser?.uid===uid;
 joining=true;joinButton.disabled=true;joinStatus.textContent='Checking your class code…';
 try{
  const result=await joinStudentClass(classCode,invite=>appConfirm(
   `Join ${invite.className||'the classroom linked to this code'}${invite.teacherName?' taught by '+invite.teacherName:''}?\n\nCode: ${invite.code}\nThis code joins one classroom only.`
  ));
  if(!current())return;
  if(result.cancelled){joinStatus.textContent='Join cancelled. You can check the code and try again.';code.focus();return;}
  selectedClassId=result.classId;
  classroomReturnHandled=true;
  classSectionViews.set(result.classId,'Overview');
  code.value='';
  window.dispatchEvent(new Event('lakbay:class-updates-changed'));
  await reloadAfterMembershipChange(result.alreadyJoined?'You’re already in this class.':'You joined the class.',result.classId);
 }catch(error){
  if(current()){joinStatus.dataset.state='error';joinStatus.textContent=error.code==='class/membership-unconfirmed'?error.message:studentLoadMessage(error,error.code?'We could not join this class. Check the code with your teacher and try again.':error.message);code.focus();}
 }finally{
  if(current()){joining=false;joinButton.disabled=false;}
 }
});
refresh.addEventListener('click',()=>loadClasses());
onAuthStateChanged(auth,user=>{generation++;sessionGeneration++;classSectionViews.clear();joining=false;classroomMode=undefined;joinDrawer.hidden=true;joinButton.disabled=!user;code.disabled=!user;code.value='';clearClassCodeError();container.replaceChildren();loadClasses();});
window.addEventListener('pageshow',event=>{if(event.persisted)loadClasses();});
window.addEventListener('pagehide',()=>{++loadRequest;++generation;stopClassroomUpdates();});
