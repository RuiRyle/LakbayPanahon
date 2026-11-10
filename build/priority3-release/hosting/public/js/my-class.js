import {reviewEvidence,assignmentProgressState} from './teacher-class-policy.js';
import {studentLoadMessage} from './student-status.js';
import {renderClassAnnouncements} from './class-announcements.js';
import {renderStudentFeedback,renderClassmates,renderMissionHelp,renderClassReplyIndicator,renderReviewReflection,renderStudentReviewStages} from './student-feedback.js';
﻿import {auth,db} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {collection,doc,getDocFromServer,getDocs,query,where} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {joinStudentClass,leaveStudentClass} from './student-class-client.js';
import {buildJourneyPath,assignmentReadiness} from './journey-path.js';
import {instructionalSnapshot} from './instructional-snapshot.js';
const container=document.getElementById('studentClasses'),status=document.getElementById('classPageStatus'),refresh=document.getElementById('refreshClasses'),joinForm=document.getElementById('joinClassForm'),joinButton=document.getElementById('joinClassButton'),joinStatus=document.getElementById('joinClassStatus'),code=document.getElementById('classCode');
let generation=0,sessionGeneration=0,joining=false,selectedClassId=null;
const classroomReturnParams=new URLSearchParams(window.location.search);let classroomReturnHandled=false;
const joinPanel=joinForm.closest('.class-join-panel'),joinDrawer=document.createElement('details'),joinSummary=document.createElement('summary');
joinDrawer.className='class-join-drawer';joinDrawer.hidden=true;joinSummary.textContent='Join a class';joinPanel.before(joinDrawer);joinDrawer.append(joinSummary,joinPanel);
let classroomMode;
function setClassroomMode(joined){
 const changed=classroomMode!==joined;classroomMode=joined;joinDrawer.hidden=false;
 joinDrawer.classList.toggle('has-classes',joined);joinSummary.textContent=joined?'Join another class':'Join your teacher’s class';
 if(changed){const focusInside=joinPanel.contains(document.activeElement);joinDrawer.open=!joined;if(joined&&focusInside)joinSummary.focus();}
 if(joined)container.after(joinDrawer);else status.closest('.class-load-bar').before(joinDrawer);
 const title=document.getElementById('joinClassTitle');if(title)title.textContent=joined?'Have another class code?':'Have a class code?';
 const description=document.querySelector('.class-page-heading p');if(description)description.textContent=joined?'Your lessons, teacher updates, and classmates — all in one place. Choose a class to get started.':'Join your teacher’s class to find assigned missions, learning updates, and classmates.';
}
const rows=snapshot=>snapshot.docs.map(d=>({...d.data(),id:d.id}));
function text(tag,value,className){const node=document.createElement(tag);node.textContent=value;if(className)node.className=className;return node;}
function link(label,url,classroom=null,activity=null){const node=text('a',label,'text-button');node.href=url+(classroom&&activity?(url.includes('?')?'&':'?')+new URLSearchParams({classroom,activity}):'');return node;}
function dueDate(value){const date=value?.toDate?.();return date&&Number.isFinite(date.getTime())?date:null;}
const classSectionViews=new Map();
function animateClassView(panel){if(matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('lakbay-reduce-motion'))return;panel.animate?.([{opacity:.4,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'ease-out'});}
const classroomMotionPreference=matchMedia('(prefers-reduced-motion: reduce)');const stopClassMotion=()=>{if(classroomMotionPreference.matches||document.body.classList.contains('lakbay-reduce-motion'))for(const animation of container.getAnimations({subtree:true}))animation.cancel();};classroomMotionPreference.addEventListener('change',stopClassMotion);const classroomMotionSettings=new MutationObserver(stopClassMotion);classroomMotionSettings.observe(document.body,{attributes:true,attributeFilter:['class']});window.addEventListener('pagehide',()=>{classroomMotionPreference.removeEventListener('change',stopClassMotion);classroomMotionSettings.disconnect();},{once:true});
function organizeClass(card){
 const navigation=text('nav','','class-section-nav');navigation.setAttribute('role','tablist');navigation.setAttribute('aria-label','Class sections');
 const sections=[['Overview','class-overview-view'],['Activities','class-learning-view'],['Announcements','class-updates-view'],['Classmates','class-community-view']].map(([label,className])=>({label,panel:text('div','',className)}));
 for(const child of [...card.children]){if(child.matches('header,.class-description,.class-action-status'))continue;const target=child.matches('.class-next-step,.class-feedback')?sections[0]:child.matches('.classmates-panel')?sections[3]:child.matches('.class-announcements')?sections[2]:sections[1];target.panel.append(child);}
 const activate=(entry,focus=false)=>{classSectionViews.set(card.dataset.classId,entry.label);for(const item of sections){const active=item===entry;item.panel.hidden=!active;item.button.setAttribute('aria-pressed',String(active));item.button.setAttribute('aria-selected',String(active));item.button.tabIndex=active?0:-1;}if(focus)entry.button.focus();animateClassView(entry.panel);if(entry===sections[3])entry.panel.querySelector('.classmates-panel')?.dispatchEvent(new Event('classmates:open'));};
 for(const [index,entry]of sections.entries()){const button=text('button',entry.label,'class-section-button');button.type='button';entry.button=button;button.id='class-tab-'+encodeURIComponent(card.dataset.classId)+'-'+index;entry.panel.id=button.id+'-panel';button.setAttribute('role','tab');button.setAttribute('aria-controls',entry.panel.id);entry.panel.setAttribute('role','tabpanel');entry.panel.setAttribute('aria-labelledby',button.id);navigation.append(button);button.addEventListener('click',()=>activate(entry));button.addEventListener('keydown',event=>{let target;if(event.key==='ArrowRight')target=(index+1)%sections.length;else if(event.key==='ArrowLeft')target=(index+sections.length-1)%sections.length;else if(event.key==='Home')target=0;else if(event.key==='End')target=sections.length-1;else return;event.preventDefault();sections[target].button.click();sections[target].button.focus();});}
 card.addEventListener('class-open-activities',event=>{
  activate(sections[1]);
  const assignmentId=event.detail?.assignmentId;if(!assignmentId)return;
  const item=[...sections[1].panel.querySelectorAll('.class-assignment')].find(el=>el.dataset.assignmentId===assignmentId);if(!item)return;
  const filter=sections[1].panel.querySelector('.class-activity-filter select');if(filter){filter.value='all';filter.dispatchEvent(new Event('change'));}
  const history=item.closest('details.class-completed-history,details.class-ended-history');if(history)history.open=true;
  const steps=item.querySelector('.review-learning-stages');if(event.detail.reviewSteps&&steps){steps.open=true;steps.querySelector('summary')?.focus();}else{item.tabIndex=-1;item.focus();}
  item.scrollIntoView({block:'nearest',behavior:'auto'});
 });
 const feedback=sections[0].panel.querySelector('.class-feedback');if(feedback){const drawer=document.createElement('details');drawer.className='class-guidance-drawer';drawer.append(text('summary',"Your teacher's guidance"));feedback.before(drawer);drawer.append(feedback);}
 const latest=sections[2].panel.querySelector('.class-announcement');if(latest){const brief=text('section','','class-latest-note');brief.append(text('span','LATEST TEACHER NOTE','eyebrow'),text('h3',latest.querySelector('h4')?.textContent||'A message from your teacher'));const body=(latest.querySelector('.class-announcement-body')||latest.querySelector('p'))?.textContent||'';brief.append(text('p',body.length>180?body.slice(0,177)+'...':body));const open=text('button','Read announcements','text-button');open.type='button';open.addEventListener('click',()=>{sections[2].button.click();sections[2].button.focus();});brief.append(open);const nextStep=sections[0].panel.querySelector('.class-next-step');if(nextStep)nextStep.after(brief);else sections[0].panel.prepend(brief);}
 const learning=sections[1].panel,items=[...learning.querySelectorAll('.class-assignment')];
 if(items.length){
  const toolbar=text('label','Show activities','class-activity-filter'),filter=text('select','');toolbar.append(filter);for(const [value,label] of [['all','All activities'],['todo','To do'],['waiting','Waiting for teacher'],['complete','Practice / activity goal reached'],['ended','Ended activities']]){const option=text('option',label);option.value=value;filter.append(option);}
  const endedHistory=document.createElement('details');endedHistory.className='class-ended-history';endedHistory.append(text('summary','Ended activities - '+items.filter(el=>el.dataset.ended==='true').length));for(const item of items.filter(el=>el.dataset.ended==='true'))endedHistory.append(item);
  const history=document.createElement('details');history.className='class-completed-history';history.append(text('summary','Practice and activity goals reached · '+items.filter(el=>el.dataset.state==='complete'&&el.dataset.ended!=='true').length));
  for(const item of items.filter(el=>el.dataset.state==='complete'))history.append(item);
  learning.insertBefore(toolbar,learning.querySelector('.class-assignment')||null);if(history.children.length>1)learning.append(history);if(endedHistory.children.length>1)learning.append(endedHistory);
  const filterNotice=text('p','','class-completion-note');filterNotice.setAttribute('role','status');toolbar.after(filterNotice);
  const filterItems=()=>{for(const item of items)item.hidden=filter.value==='todo'?item.dataset.state==='complete'||item.dataset.ended==='true':filter.value==='waiting'?item.dataset.waiting!=='true':filter.value==='complete'?item.dataset.state!=='complete':filter.value==='ended'?item.dataset.ended!=='true':false;endedHistory.hidden=filter.value==='todo'||filter.value==='complete'||(filter.value==='waiting'&&!items.some(el=>el.dataset.ended==='true'&&el.dataset.waiting==='true'));if(filter.value==='ended'||filter.value==='waiting')endedHistory.open=true;history.hidden=filter.value==='ended'||filter.value==='todo'||(filter.value==='waiting'&&!items.some(el=>el.dataset.state==='complete'&&el.dataset.waiting==='true'));if(filter.value==='complete'||filter.value==='waiting')history.open=true;const visible=items.filter(item=>!item.hidden).length;filterNotice.textContent=filter.value==='all'?'':visible+' matching '+(visible===1?'activity':'activities')+'.'+(filter.value==='waiting'?' Waiting status comes from your latest loaded help requests.':'');};
  filter.addEventListener('change',filterItems);card.addEventListener('class-help-state',filterItems);filterItems();
 }
 const unseenKey='lakbay:class-updates:'+auth.currentUser?.uid+':'+card.dataset.classId;
 const announcementText=[...sections[2].panel.querySelectorAll('.class-announcement')].map(el=>el.textContent).join('|');let announcementHash=2166136261;for(const char of announcementText)announcementHash=Math.imul(announcementHash^char.charCodeAt(0),16777619);const announcementVersion=announcementText?String(announcementHash>>>0):'';
 let announcementsSeen=false;
 try{announcementsSeen=localStorage.getItem(unseenKey)===announcementVersion;}catch{}
 const updateBadge=()=>{const unread=Number(sections[0].panel.querySelector('.class-feedback')?.dataset.unread||0),news=!announcementsSeen&&!!announcementVersion;sections[2].button.textContent='Announcements'+(news?' - New':'');sections[0].button.textContent='Overview'+(unread?' - '+unread+' new feedback':'');const summary=sections[0].panel.querySelector('.class-guidance-drawer>summary');if(summary)summary.textContent="Your teacher's guidance"+(unread?' ('+unread+' new)':'');};
 card.addEventListener('class-feedback-loaded',updateBadge);
 sections[2].button.addEventListener('click',()=>{announcementsSeen=true;try{localStorage.setItem(unseenKey,announcementVersion);}catch{}updateBadge();});updateBadge();
 card.append(navigation,...sections.map(entry=>entry.panel));const selected=sections.find(entry=>entry.label===classSectionViews.get(card.dataset.classId))||sections[0];activate(selected);return card;
}
function renderClass(record,path,progress,progressAvailable,request,uid,attempts,attemptsAvailable){
 const card=document.createElement('section');card.className='student-class-card';card.dataset.classId=record.id;
 const heading=document.createElement('header'),details=document.createElement('div');details.append(text('span',record.status==='active'?'YOUR CLASS':'ARCHIVED CLASS','eyebrow'),text('h2',record.name||'Your class'));
 if(record.teacherName)details.append(text('p','Teacher: '+record.teacherName));heading.append(details);
 const leave=text('button','Leave Class','text-button');leave.type='button';const options=document.createElement('details');options.className='student-class-options';options.append(text('summary','Class options'),leave);heading.append(options);card.append(heading);
 const notice=text('p','','class-action-status');notice.setAttribute('role','status');card.append(notice);
 leave.addEventListener('click',async()=>{if(generation!==request||auth.currentUser?.uid!==uid)return;if(!window.confirm('Leave this class? Your saved mission progress and rewards will remain.'))return;leave.disabled=true;const session=sessionGeneration;try{await leaveStudentClass(record.id);if(sessionGeneration===session&&auth.currentUser?.uid===uid)loadClasses();}catch{if(generation===request){notice.textContent='Could not leave this class. Please try again.';leave.disabled=false;}}});
 if(record.description)card.append(text('p',record.description,'class-description'));
 const nextStep=text('section','','class-next-step');nextStep.setAttribute('aria-label','Your next class activity');
 nextStep.append(text('span','FROM YOUR TEACHER','eyebrow'));
 const completed=a=>a.status==='withdrawn'?false:a.assignmentType==='targeted-review'?(attemptsAvailable&&reviewEvidence(a,attempts,uid).completed&&!reviewEvidence(a,attempts,uid).unavailable):progress.some(p=>p.userId===uid&&p.completed===true&&p.missionId===a.missionId&&p.chapterId===a.chapterId&&assignmentProgressState(p,a).status==='completed');
 const activeAssignments=record.assignments.filter(a=>a.status==='published');
 const pending=progressAvailable?activeAssignments.filter(a=>!completed(a)):[];
 const next=pending.find(a=>path.some(m=>m.id===a.missionId&&m.chapterId===a.chapterId&&m.accessible));
 if(record.status!=='active'){nextStep.append(text('h3','This class has ended'),text('p','You can revisit your class messages and continue learning in My Journey.'),link('Continue My Journey','my-journey.html'));}
 else if(record.assignmentError||!progressAvailable){nextStep.append(text('h3','Let’s check your next activity'),text('p','Refresh Classes to load your teacher’s assignments and verify your saved progress.'));}
 else if(next){
  const mission=path.find(m=>m.id===next.missionId&&m.chapterId===next.chapterId);
  nextStep.append(text('h3',next.title||mission?.title||'Your next mission'),text('p',next.instructions||'Explore the lesson, try the activities, and complete the mission check.'));
  const deadline=dueDate(next.dueAt);if(deadline)nextStep.append(text('p','Due '+deadline.toLocaleDateString('en-PH',{dateStyle:'medium',timeZone:'Asia/Manila'})+' · Philippine time','assignment-due'));
  nextStep.append(link(next.assignmentType==='targeted-review'?'Review this concept':'Start this mission','story.html?'+new URLSearchParams({chapter:next.chapterId,mission:next.missionId,...(next.assignmentType==='targeted-review'&&next.reviewTopic?{reviewTopic:next.reviewTopic}:{})}),record.id,next.id));
 }else if(pending.length){const preparation=assignmentReadiness(path,pending[0]);nextStep.append(text('h3',preparation.state==='unavailable'?'Your assigned lesson is unavailable':'A few steps before your assignment'),text('p',preparation.state==='unavailable'?'Ask your teacher to check this assignment. You can continue your learning journey.':'Your teacher assigned a later lesson. Your place is saved: complete the earlier lessons and chapter checks to unlock it.'));if(preparation.next)nextStep.append(text('p','Continue with: '+preparation.next.title),link('Continue the earlier lesson','story.html?'+new URLSearchParams({chapter:preparation.next.chapterId,mission:preparation.next.id})));else nextStep.append(link('See my next learning step','my-journey.html'));}
 else if(activeAssignments.length){
  nextStep.append(text('h3','Practice goals reached'),text('p','Nice work finishing your practice goals. Your explanation helps your teacher see how you used the clues.'));
  const review=activeAssignments.find(a=>a.assignmentType==='targeted-review'&&a.reflectionQuestion);
  if(review){const check=text('button','Check explanation and guidance','primary-button');check.type='button';check.addEventListener('click',()=>card.dispatchEvent(new CustomEvent('class-open-activities',{detail:{assignmentId:review.id,reviewSteps:true}})));nextStep.append(check,text('p','Open one review at a time to check your saved steps. Checking is optional and does not change your score.','class-completion-note'));}
  nextStep.append(link('Keep exploring','my-journey.html'));
 }
 else{nextStep.append(text('h3','You’re connected to your teacher'),text('p','There are no active assigned missions. You can explore lessons and read your class activity history.'),link('Explore lessons','my-journey.html'));}
 nextStep.append(text('p','Your teacher can review your saved mission and quiz progress in this class. Completing a mission updates your progress automatically.','class-sharing-note'));
 card.append(nextStep);
 renderClassmates(card,record,()=>generation===request&&auth.currentUser?.uid===uid);
 renderClassAnnouncements(card,record);
 renderStudentFeedback(card,record,path,()=>generation===request&&auth.currentUser?.uid===uid);
 card.append(text('h3','Class goals and your reviews'));
 if(progressAvailable&&!record.assignmentError&&activeAssignments.length){const done=activeAssignments.filter(completed).length;const summary=text('div','','class-quest-progress');summary.append(text('strong',done+' / '+activeAssignments.length+' practice / activity goals reached'));const meter=document.createElement('progress');meter.max=activeAssignments.length;meter.value=done;meter.setAttribute('aria-label','Practice and activity goals reached');summary.append(meter);card.append(summary);}
 if(record.assignmentError){card.append(text('p','Assignments could not load. Use Refresh Classes to try again.','class-warning'));return organizeClass(card);}
 if(!record.assignments.length){card.append(text('p','No missions have been assigned yet. You can continue independent learning.','class-empty'));return organizeClass(card);}
 card.append(text('p','Class goals count earlier completion. A personal review needs a new passing quiz result saved after your teacher assigns it.','class-completion-note'));
 for(const assignment of record.assignments){
  const item=document.createElement('article');item.className='class-assignment';item.dataset.assignmentId=assignment.id;const ended=['closed','withdrawn'].includes(assignment.status);item.dataset.ended=String(ended);
  const mission=path.find(m=>m.id===assignment.missionId&&m.chapterId===assignment.chapterId);
  const review=assignment.assignmentType==='targeted-review',evidence=review&&attemptsAvailable?reviewEvidence(assignment,attempts,uid):null;
  const complete=progressAvailable&&completed(assignment);
  item.append(text('span',review?'PERSONAL REVIEW':'CLASS LEARNING GOAL','assignment-purpose'));
  if(review){item.append(text('p','Your teacher chose this topic for you to revisit. Read the guidance, review the lesson, then save a new passing quiz result.'));if(!attemptsAvailable||evidence?.unavailable)item.append(text('p','Review results could not be verified. Refresh Classes to check again.','class-warning'));else if(evidence?.attempted)item.append(text('p','Latest review score: '+(evidence.latest??'unavailable')+'%'+(evidence.baseline!=null?' | Before assignment: '+evidence.baseline+'%':'')+(evidence.change!=null?' | Change: '+(evidence.change>0?'+':'')+evidence.change+' percentage points':'')+'. '+(evidence.completed?'Practice goal reached. Your explanation and teacher guidance are separate steps.':'Keep practicing and try again.')));}
  const deadline=dueDate(assignment.dueAt),late=!complete&&deadline&&deadline.getTime()<Date.now();item.dataset.state=ended?assignment.status:!progressAvailable?'unknown':complete?'complete':!mission||!mission.accessible?'locked':late?'late':'available';
  item.append(text('span',ended?(assignment.status==='closed'?'Closed activity':'Withdrawn - no longer required'):!progressAvailable?'Progress unavailable':complete?(review?'Practice passed':'Activity goal reached'):!mission?'Content unavailable':!mission.accessible?'Earlier lessons needed':late?'Past due':'Assigned','assignment-state'+(complete?' is-complete':'')));
  item.append(text('h4',assignment.title||mission?.title||'Assigned mission'));
  if(!ended&&progressAvailable&&mission&&!mission.accessible&&record.status==='active'){
   const readiness=assignmentReadiness(path,assignment),preparation=text('div','','assignment-preparation');
   preparation.append(text('strong','This lesson is further along your journey'),text('p','Being assigned a mission does not skip earlier lessons. Complete your next learning step first; this assignment will stay here.'));
   if(readiness.next)preparation.append(text('p','Your next lesson: '+readiness.next.title),link('Continue earlier lesson','story.html?'+new URLSearchParams({chapter:readiness.next.chapterId,mission:readiness.next.id})));
   else preparation.append(text('p','You may need to finish a chapter check or meet another chapter requirement. My Journey shows the next step.'));
   item.append(preparation);
  }
  if(review&&assignment.reviewTopic)item.append(text('p','Focus on: '+assignment.reviewTopic.replace(/[-_]+/g,' '),'review-focus-label'));
  if(assignment.instructions)item.append(text('p',assignment.instructions));
  if(ended)item.append(text('p',assignment.status==='closed'?'Your teacher finished this activity. Earlier results and messages stay here; new independent learning does not change this activity.':'Your teacher cancelled this activity. You do not need to finish it. Your own learning progress and rewards are unchanged.','class-ended-note'));
  if(ended&&assignment.status==='closed')item.append(text('p',!progressAvailable?'Earlier results could not be verified.':complete?'Completed before this activity closed.':'No verified completion recorded before this activity closed.','class-ended-outcome'));
  if(ended&&dueDate(assignment.endedAt))item.append(text('p','Ended '+dueDate(assignment.endedAt).toLocaleString('en-PH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Manila'})+' (Philippine time)','assignment-ended-date'));
  if(!ended&&deadline){item.append(text('p','Due '+deadline.toLocaleString('en-PH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Manila'})+' (Philippine time)','assignment-due'));if(progressAvailable&&mission&&!mission.accessible)item.append(text('p','If you cannot reach this lesson before the due date, use Ask your teacher for help below.','class-completion-note'));}
  if(ended){item.append(link('Continue my own learning','my-journey.html'));}
  else if(progressAvailable&&mission?.accessible&&record.status==='active'){item.append(link(review?(assignment.reviewTopic?'Review this concept':'Revisit lesson'):complete?'Review Lesson':'Open Lesson','story.html?'+new URLSearchParams({chapter:assignment.chapterId,mission:assignment.missionId,...(review&&assignment.reviewTopic?{reviewTopic:assignment.reviewTopic}:{})}),record.id,assignment.id));if(review)item.append(link(complete?'Try another review quiz':'Take review quiz','quiz.html?'+new URLSearchParams({chapter:assignment.chapterId,mission:assignment.missionId}),record.id,assignment.id));}
  else if(progressAvailable&&mission&&!mission.accessible)item.append(link('View prerequisites in My Journey','my-journey.html'));
  else if(!progressAvailable)item.append(text('p','We could not verify your progress. Refresh before opening this assignment.','class-warning'));
  else if(record.status!=='active')item.append(text('p','This class is archived. Your completed missions remain saved.'));
  if(review)renderStudentReviewStages(item,record,assignment,evidence,()=>generation===request&&auth.currentUser?.uid===uid);
  renderMissionHelp(item,record,assignment,()=>generation===request&&auth.currentUser?.uid===uid);
  if(review&&(complete||ended)&&record.status==='active')renderReviewReflection(item,record,assignment,evidence,()=>generation===request&&auth.currentUser?.uid===uid);
  card.append(item);
 }
 const explanation=card.querySelector('.review-reflection');if(explanation){const action=text('button','Share or revisit your explanation','text-button');action.type='button';nextStep.append(action);action.addEventListener('click',()=>{card.dispatchEvent(new Event('class-open-activities'));const filter=card.querySelector('.class-activity-filter select');if(filter){filter.value='all';filter.dispatchEvent(new Event('change'));}const history=explanation.closest('.class-completed-history');if(history)history.open=true;explanation.open=true;explanation.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});explanation.querySelector('summary')?.focus();});}
 return organizeClass(card);
}
async function loadClasses(){const user=auth.currentUser,request=++generation;const current=()=>generation===request&&auth.currentUser?.uid===user?.uid;container.replaceChildren();refresh.disabled=true;status.textContent=user?'Loading your classes...':'Sign in to view your classes.';if(!user)return;
 try{
  const memberships=rows(await getDocs(query(collection(db,'classMembers'),where('userId','==',user.uid)))).filter(m=>m.userId===user.uid&&m.status==='active');if(!current())return;
  const ids=[...new Set(memberships.map(m=>m.classId))];
  setClassroomMode(ids.length>0);
  if(!ids.length){const empty=text('section','','class-empty-panel');empty.append(text('h2','Your class journey starts here'),text('p','Ask your teacher for a class code, or continue exploring on your own.'),link('Continue My Journey','my-journey.html'));container.append(empty);status.textContent='You have not joined a class yet.';return;}
  const names=['eras','chapters','missions','studentProgress','studentChapterProgress','studentQuizAttempts'];
  const [catalogs,classResults]=await Promise.all([
   Promise.allSettled(names.map(name=>name.startsWith('student')
    ? getDocs(query(collection(db,name),where('userId','==',user.uid)))
    : instructionalSnapshot(name,()=>getDocs(collection(db,name))))),
   Promise.allSettled(ids.map(async id=>{const snapshot=await getDocFromServer(doc(db,'classes',id));if(!snapshot.exists())throw Error('Missing class');const record={...snapshot.data(),id};try{record.announcements=rows(await getDocs(query(collection(db,'classAnnouncements'),where('classId','==',id),where('status','==','published'))));}catch{record.announcements=[];record.announcementError=true;}try{record.assignments=rows(await getDocs(query(collection(db,'classAssignments'),where('classId','==',id),where('status','in',['published','closed','withdrawn'])))).filter(a=>a.classId===id&&['published','closed','withdrawn'].includes(a.status));record.assignments.sort((a,b)=>(dueDate(a.dueAt)?.getTime()||Infinity)-(dueDate(b.dueAt)?.getTime()||Infinity)||a.id.localeCompare(b.id));}catch{record.assignments=[];record.assignmentError=true;}try{const reviews=rows(await getDocs(query(collection(db,'classReviewAssignments'),where('classId','==',id),where('userId','==',user.uid),where('status','in',['published','closed','withdrawn']))));record.assignments.push(...reviews.map(a=>({...a,assignmentType:'targeted-review'})));}catch{record.assignmentError=true;}return record;}))
  ]);if(!current())return;
  const progressAvailable=catalogs.slice(0,5).every(r=>r.status==='fulfilled'),attemptsAvailable=catalogs[5].status==='fulfilled',attempts=attemptsAvailable?rows(catalogs[5].value):[];let path=[],progress=[];
  if(progressAvailable){const [eras,chapters,missions,missionProgress,chapterProgress]=catalogs.slice(0,5).map(r=>rows(r.value));progress=missionProgress;path=buildJourneyPath({userId:user.uid,eras,chapters,missions,challenges:[],missionProgress,chapterProgress}).flatMap(e=>e.chapters.flatMap(c=>c.missions));}
  const available=classResults.filter(result=>result.status==='fulfilled').map(result=>result.value);
  const returningClass=classroomReturnParams.get('classroom');
  if(!classroomReturnHandled&&returningClass&&available.some(record=>record.id===returningClass))selectedClassId=returningClass;
  if(!available.some(record=>record.id===selectedClassId))selectedClassId=available[0]?.id;
  const chooser=text('label','Your classroom','class-switcher'),select=text('select','','student-class-select');select.setAttribute('aria-label','Choose your classroom');chooser.append(select);const panels=[];
  for(const record of available){const option=text('option',record.name||'Your class');option.value=record.id;select.append(option);const panel=renderClass(record,path,progress,progressAvailable,request,user.uid,attempts,attemptsAvailable);panel.id='joined-class-'+record.id;renderClassReplyIndicator(panel,record,()=>generation===request&&auth.currentUser?.uid===user.uid);panels.push({panel,id:record.id});}
  select.value=selectedClassId||'';select.addEventListener('change',()=>{selectedClassId=select.value;for(const entry of panels){entry.panel.hidden=entry.id!==selectedClassId;if(!entry.panel.hidden)animateClassView(entry.panel);}});
  if(available.length)container.append(chooser);for(const entry of panels){entry.panel.hidden=entry.id!==selectedClassId;container.append(entry.panel);}
  let unavailable=classResults.some(result=>result.status==='rejected')||available.some(record=>record.assignmentError||record.announcementError);
  status.textContent=unavailable?'Some class details could not load. Your membership is unchanged; use Refresh Classes to retry.':!progressAvailable?'Classes loaded, but assignment progress could not be verified. Use Refresh Classes to retry.':'Your classes are up to date.';
  const returningActivity=classroomReturnParams.get('activity');
  if(!classroomReturnHandled&&returningClass&&returningActivity){
   const record=available.find(entry=>entry.id===returningClass),entry=panels.find(entry=>entry.id===returningClass);
   if(record?.assignmentError){status.textContent='Your class activity could not be checked. Refresh Classes to try returning again.';}
   else {
    classroomReturnHandled=true;
    if(record?.assignments.some(assignment=>assignment.id===returningActivity)&&entry){entry.panel.dispatchEvent(new CustomEvent('class-open-activities',{detail:{assignmentId:returningActivity}}));status.textContent='Back at your class activity. Your saved results are shown below.';}
    else status.textContent='That class activity is no longer available to this account. You can choose from your current classes.';
   }
  }
 }catch(error){if(current()){if(classroomMode===undefined)setClassroomMode(false);status.textContent=studentLoadMessage(error,'We could not load your classes. Use Refresh Classes to retry.');}}
 finally{if(current())refresh.disabled=false;}
}
joinForm.addEventListener('submit',async event=>{event.preventDefault();if(joining||!auth.currentUser)return;const session=sessionGeneration,uid=auth.currentUser.uid;joining=true;joinButton.disabled=true;joinStatus.textContent='Checking your class code...';try{const result=await joinStudentClass(code.value,invite=>window.confirm(`Join ${invite.className||"the classroom linked to this code"}${invite.teacherName?" taught by "+invite.teacherName:""}?\n\nCode: ${invite.code}\nThis code joins one classroom only.`));if(result.cancelled){joinStatus.textContent="Joining cancelled. You have not joined another class.";return;}if(sessionGeneration!==session||auth.currentUser?.uid!==uid)return;selectedClassId=result.classId;code.value='';joinStatus.textContent=result.alreadyJoined?'You are already a member of this class.':'Class joined. Loading your assigned missions...';loadClasses();}catch(error){if(sessionGeneration===session&&auth.currentUser?.uid===uid)joinStatus.textContent=studentLoadMessage(error,error.code?'We could not join this class. Check the code with your teacher and try again.':error.message);}finally{if(sessionGeneration===session&&auth.currentUser?.uid===uid){joining=false;joinButton.disabled=false;}}});
refresh.addEventListener('click',loadClasses);
onAuthStateChanged(auth,user=>{generation++;sessionGeneration++;classSectionViews.clear();joining=false;classroomMode=undefined;joinDrawer.hidden=true;joinButton.disabled=!user;code.disabled=!user;code.value='';joinStatus.textContent='';container.replaceChildren();loadClasses();});
window.addEventListener('pageshow',event=>{if(event.persisted)loadClasses();});
