import {studentLoadMessage} from './student-status.js';
﻿import {auth,db} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {collection,doc,getDocFromServer,getDocs,query,where} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {joinStudentClass,leaveStudentClass} from './student-class-client.js';
import {buildJourneyPath} from './journey-path.js';
import {instructionalSnapshot} from './instructional-snapshot.js';
const container=document.getElementById('studentClasses'),status=document.getElementById('classPageStatus'),refresh=document.getElementById('refreshClasses'),joinForm=document.getElementById('joinClassForm'),joinButton=document.getElementById('joinClassButton'),joinStatus=document.getElementById('joinClassStatus'),code=document.getElementById('classCode');
let generation=0,sessionGeneration=0,joining=false;
const rows=snapshot=>snapshot.docs.map(d=>({...d.data(),id:d.id}));
function text(tag,value,className){const node=document.createElement(tag);node.textContent=value;if(className)node.className=className;return node;}
function link(label,url){const node=text('a',label,'text-button');node.href=url;return node;}
function dueDate(value){const date=value?.toDate?.();return date&&Number.isFinite(date.getTime())?date:null;}
function renderClass(record,path,progress,progressAvailable,request,uid){
 const card=document.createElement('section');card.className='student-class-card';
 const heading=document.createElement('header'),details=document.createElement('div');details.append(text('span',record.status==='active'?'YOUR CLASS':'ARCHIVED CLASS','eyebrow'),text('h2',record.name||'Your class'));
 if(record.teacherName)details.append(text('p','Teacher: '+record.teacherName));heading.append(details);
 const leave=text('button','Leave Class','text-button');leave.type='button';heading.append(leave);card.append(heading);
 const notice=text('p','','class-action-status');notice.setAttribute('role','status');card.append(notice);
 leave.addEventListener('click',async()=>{if(generation!==request||auth.currentUser?.uid!==uid)return;if(!window.confirm('Leave this class? Your saved mission progress and rewards will remain.'))return;leave.disabled=true;const session=sessionGeneration;try{await leaveStudentClass(record.id);if(sessionGeneration===session&&auth.currentUser?.uid===uid)loadClasses();}catch{if(generation===request){notice.textContent='Could not leave this class. Please try again.';leave.disabled=false;}}});
 if(record.description)card.append(text('p',record.description,'class-description'));
 card.append(text('h3','Assigned Missions'));
 if(progressAvailable&&!record.assignmentError&&record.assignments.length){const done=record.assignments.filter(a=>progress.some(p=>p.userId===uid&&p.completed===true&&p.missionId===a.missionId&&p.chapterId===a.chapterId)).length;const summary=text('div','','class-quest-progress');summary.append(text('strong',done+' / '+record.assignments.length+' missions completed'));const meter=document.createElement('progress');meter.max=record.assignments.length;meter.value=done;meter.setAttribute('aria-label','Assigned missions completed');summary.append(meter);card.append(summary);}
 if(record.assignmentError){card.append(text('p','Assignments could not load. Use Refresh Classes to try again.','class-warning'));return card;}
 if(!record.assignments.length){card.append(text('p','No missions have been assigned yet. You can continue independent learning.','class-empty'));return card;}
 card.append(text('p','A mission you already completed independently also counts as completed here.','class-completion-note'));
 for(const assignment of record.assignments){
  const item=document.createElement('article');item.className='class-assignment';
  const mission=path.find(m=>m.id===assignment.missionId&&m.chapterId===assignment.chapterId);
  const complete=progressAvailable&&progress.some(p=>p.userId===uid&&p.completed===true&&p.missionId===assignment.missionId&&p.chapterId===assignment.chapterId);
  const deadline=dueDate(assignment.dueAt),late=!complete&&deadline&&deadline.getTime()<Date.now();item.dataset.state=!progressAvailable?'unknown':complete?'complete':!mission||!mission.accessible?'locked':late?'late':'available';
  item.append(text('span',!progressAvailable?'Progress unavailable':complete?'Completed':!mission?'Content unavailable':!mission.accessible?'Prerequisites required':late?'Past due':'Assigned','assignment-state'+(complete?' is-complete':'')));
  item.append(text('h4',assignment.title||mission?.title||'Assigned mission'));
  if(assignment.instructions)item.append(text('p',assignment.instructions));
  if(deadline)item.append(text('p','Due '+deadline.toLocaleString('en-PH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Manila'})+' (Philippine time)','assignment-due'));
  if(progressAvailable&&mission?.accessible&&record.status==='active')item.append(link(complete?'Review Lesson':'Open Lesson','story.html?'+new URLSearchParams({chapter:assignment.chapterId,mission:assignment.missionId})));
  else if(progressAvailable&&mission&&!mission.accessible)item.append(link('View prerequisites in My Journey','my-journey.html'));
  else if(!progressAvailable)item.append(text('p','We could not verify your progress. Refresh before opening this assignment.','class-warning'));
  else if(record.status!=='active')item.append(text('p','This class is archived. Your completed missions remain saved.'));
  card.append(item);
 }
 return card;
}
async function loadClasses(){const user=auth.currentUser,request=++generation;const current=()=>generation===request&&auth.currentUser?.uid===user?.uid;container.replaceChildren();refresh.disabled=true;status.textContent=user?'Loading your classes...':'Sign in to view your classes.';if(!user)return;
 try{
  const memberships=rows(await getDocs(query(collection(db,'classMembers'),where('userId','==',user.uid)))).filter(m=>m.userId===user.uid&&m.status==='active');if(!current())return;
  const ids=[...new Set(memberships.map(m=>m.classId))];
  if(!ids.length){const empty=text('section','','class-empty-panel');empty.append(text('h2','Your class journey starts here'),text('p','Ask your teacher for a class code, or continue exploring on your own.'),link('Continue My Journey','my-journey.html'));container.append(empty);status.textContent='You have not joined a class yet.';return;}
  const names=['eras','chapters','missions','studentProgress','studentChapterProgress'];
  const [catalogs,classResults]=await Promise.all([
   Promise.allSettled(names.map(name=>name.startsWith('student')
    ? getDocs(query(collection(db,name),where('userId','==',user.uid)))
    : instructionalSnapshot(name,()=>getDocs(collection(db,name))))),
   Promise.allSettled(ids.map(async id=>{const snapshot=await getDocFromServer(doc(db,'classes',id));if(!snapshot.exists())throw Error('Missing class');const record={...snapshot.data(),id};try{record.assignments=rows(await getDocs(query(collection(db,'classAssignments'),where('classId','==',id),where('status','==','published')))).filter(a=>a.classId===id&&a.status==='published');record.assignments.sort((a,b)=>(dueDate(a.dueAt)?.getTime()||Infinity)-(dueDate(b.dueAt)?.getTime()||Infinity)||a.id.localeCompare(b.id));}catch{record.assignments=[];record.assignmentError=true;}return record;}))
  ]);if(!current())return;
  const progressAvailable=catalogs.every(r=>r.status==='fulfilled');let path=[],progress=[];
  if(progressAvailable){const [eras,chapters,missions,missionProgress,chapterProgress]=catalogs.map(r=>rows(r.value));progress=missionProgress;path=buildJourneyPath({userId:user.uid,eras,chapters,missions,challenges:[],missionProgress,chapterProgress}).flatMap(e=>e.chapters.flatMap(c=>c.missions));}
  let unavailable=false;for(const result of classResults){if(result.status==='fulfilled'){container.append(renderClass(result.value,path,progress,progressAvailable,request,user.uid));if(result.value.assignmentError)unavailable=true;}else unavailable=true;}
  status.textContent=unavailable?'Some class details could not load. Your membership is unchanged; use Refresh Classes to retry.':!progressAvailable?'Classes loaded, but assignment progress could not be verified. Use Refresh Classes to retry.':'Your classes are up to date.';
 }catch(error){if(current())status.textContent=studentLoadMessage(error,'We could not load your classes. Use Refresh Classes to retry.');}
 finally{if(current())refresh.disabled=false;}
}
joinForm.addEventListener('submit',async event=>{event.preventDefault();if(joining||!auth.currentUser)return;const session=sessionGeneration,uid=auth.currentUser.uid;joining=true;joinButton.disabled=true;joinStatus.textContent='Checking your class code...';try{const result=await joinStudentClass(code.value);if(sessionGeneration!==session||auth.currentUser?.uid!==uid)return;code.value='';joinStatus.textContent=result.alreadyJoined?'You are already a member of this class.':'Class joined. Loading your assigned missions...';loadClasses();}catch(error){if(sessionGeneration===session&&auth.currentUser?.uid===uid)joinStatus.textContent=studentLoadMessage(error,error.code?'We could not join this class. Check the code with your teacher and try again.':error.message);}finally{if(sessionGeneration===session&&auth.currentUser?.uid===uid){joining=false;joinButton.disabled=false;}}});
refresh.addEventListener('click',loadClasses);
onAuthStateChanged(auth,user=>{generation++;sessionGeneration++;joining=false;joinButton.disabled=!user;code.disabled=!user;code.value='';joinStatus.textContent='';container.replaceChildren();loadClasses();});
window.addEventListener('pageshow',event=>{if(event.persisted)loadClasses();});
