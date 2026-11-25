import {auth,db} from './firebase-config.js';
import {collection,doc,documentId,getDocFromServer,getDocsFromServer,limit,orderBy,query,startAfter,where}
 from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {classAnnouncementSeenKey,classAnnouncementVersion,publishedAnnouncements} from './class-announcements.js';
import {classActivityNotifications,classActivityStatuses,dueSoonActivity,readClassNotificationState,saveClassNotificationState} from './class-notification-state.js';

const updateEvent='lakbay:class-updates-changed';
const badgeLifetime=120000;
const maxDisplayed=12;
const rows=snapshot=>snapshot.docs.map(entry=>({...entry.data(),id:entry.id}));
function timestamp(value){
 const time=value?.toMillis?.();
 return Number.isFinite(time)&&time>0&&time<=Date.now()?time:0;
}
const noticeDate=new Intl.DateTimeFormat('en-PH',{month:'short',day:'numeric',timeZone:'Asia/Manila'});
const deadlineDate=new Intl.DateTimeFormat('en-PH',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone:'Asia/Manila'});
const bellPath='M18 8a6 6 0 0 0-12 0c0 7-2 8-2 8h16s-2-1-2-8M10 20a2 2 0 0 0 4 0';
const messagePath='M22 7l-9 6a2 2 0 0 1-2 0L2 7M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z';
const scrollPath='M15 12h-5m5-4h-5m9 9V5a2 2 0 0 0-2-2H4M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3';
const compassPath='M22 12a10 10 0 1 0-20 0 10 10 0 0 0 20 0Zm-6-4-2 6-6 2 2-6Z';
const kindIcons={
 reply:messagePath,feedback:messagePath,announcement:scrollPath,ended:scrollPath,due:compassPath,deadline:compassPath,
 activity:'M12 5v16m8-2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-4a5 5 0 0 0-4 2 5 5 0 0 0-4-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4a5 5 0 0 1 4 2 5 5 0 0 1 4-2Z',
 guidance:'M15 14c.3-1.4 3-3.1 3-6a6 6 0 0 0-12 0c0 2.9 2.7 4.6 3 6m0 4h6m-5 4h4'
};

async function readClassUpdatePages(collectionName,scope,current){
 const records=[];
 let cursor;
 while(current()){
  const result=await getDocsFromServer(query(collection(db,collectionName),...scope,
   orderBy(documentId()),...(cursor?[startAfter(cursor)]:[]),limit(100)));
  records.push(...rows(result));
  if(result.docs.length<100)return records;
  cursor=result.docs.at(-1);
 }
 return [];
}

async function loadUpdates(uid,current){
 const memberships=rows(await getDocsFromServer(query(collection(db,'classMembers'),where('userId','==',uid))));
 if(!current())return {entries:[],incomplete:false};
 const classes=new Map(memberships
  .filter(row=>row.userId===uid&&row.status==='active'&&typeof row.classId==='string'&&row.classId)
  .map(row=>[row.classId,row]));
 const settled=await Promise.allSettled([...classes].map(async ([classId,membership])=>{
  if(!current())return {entries:[],incomplete:false};
  const classroom=await getDocFromServer(doc(db,'classes',classId));
  if(!current())return {entries:[],incomplete:false};
  if(!classroom.exists())throw Error('Class unavailable');
  if(classroom.data().status!=='active')return {entries:[],incomplete:false};
  const scope=where('classId','==',classId),owner=where('userId','==',uid);
  const results=await Promise.allSettled([
   getDocsFromServer(query(collection(db,'classAnnouncements'),scope,where('status','==','published'))).then(rows),
   readClassUpdatePages('classFeedback',[scope,owner],current),
   readClassUpdatePages('classHelpRequests',[scope,owner,where('status','==','answered')],current),
   getDocsFromServer(query(collection(db,'classAssignments'),scope,where('status','in',classActivityStatuses))).then(rows),
   getDocsFromServer(query(collection(db,'classReviewAssignments'),scope,owner,where('status','in',classActivityStatuses))).then(rows),
   readClassUpdatePages('classReviewReflections',[scope,owner],current)
  ]);
  if(!current())return {entries:[],incomplete:false};
  const loaded=index=>results[index].status==='fulfilled'?results[index].value:[];
  const entries=[];
  const add=(kind,id,label,time)=>entries.push({kind,id,label,time,classId});
  if(results[0].status==='fulfilled'){
   const announcements=publishedAnnouncements(loaded(0),classId);
   let seen=null;
   try{seen=localStorage.getItem(classAnnouncementSeenKey(uid,classId));}catch{}
   if(announcements.length&&classAnnouncementVersion(announcements,classroom.data().teacherName)!==seen){
    entries.push({kind:'announcement',id:announcements[0].id,label:'Class announcements updated',
     detail:announcements[0].title,time:timestamp(announcements[0].publishedAt),classId});
   }
  }
  if(results[1].status==='fulfilled'){
   for(const row of loaded(1)){
    if(row.userId===uid&&row.classId===classId&&!row.readAt)add('feedback',row.id,'New teacher feedback',timestamp(row.updatedAt));
   }
  }
  if(results[2].status==='fulfilled'){
   for(const row of loaded(2)){
    if(row.userId===uid&&row.classId===classId&&row.status==='answered'&&!row.understanding&&typeof row.assignmentId==='string'&&row.assignmentId)
     entries.push({kind:'reply',id:row.assignmentId,label:'Your teacher replied',time:timestamp(row.answeredAt),classId,
      activityType:row.assignmentKind==='targeted-review'?'targeted-review':'class-goal'});
   }
  }
  const activities=[
   ...loaded(3).filter(row=>row.classId===classId&&classActivityStatuses.includes(row.status)),
   ...loaded(4).filter(row=>row.userId===uid&&row.classId===classId&&classActivityStatuses.includes(row.status))
    .map(row=>({...row,assignmentType:'targeted-review'}))
  ];
  const reflections=loaded(5).filter(row=>row.userId===uid&&row.classId===classId);
  let attempts=null,attemptsUnavailable=false;
  const dueMissions=[...new Set(activities.filter(row=>dueSoonActivity(row)).map(row=>row.missionId)
   .filter(id=>typeof id==='string'&&id))];
  if(dueMissions.length){
   try{
    const groups=[];
    for(let start=0;start<dueMissions.length;start+=10)groups.push(dueMissions.slice(start,start+10));
    const snapshots=await Promise.all(groups.map(missions=>getDocsFromServer(query(
     collection(db,'studentQuizAttempts'),owner,where('missionId','in',missions)
    ))));
    attempts=snapshots.flatMap(rows).filter(row=>row.userId===uid);
   }catch{attemptsUnavailable=true;}
  }
  if(!current())return {entries:[],incomplete:false};
  const state=readClassNotificationState(uid,membership);
  const activityUpdates=classActivityNotifications({activities,reflections,attempts,membership,uid,state});
  saveClassNotificationState(uid,membership,activityUpdates.state);
  for(const entry of activityUpdates.entries)entries.push({...entry,classId});
  return {entries,incomplete:attemptsUnavailable||results.some(item=>item.status==='rejected')};
 }));
 return {
  entries:settled.flatMap(item=>item.status==='fulfilled'?item.value.entries:[]).sort((a,b)=>b.time-a.time),
  incomplete:settled.some(item=>item.status==='rejected'||item.value.incomplete)
 };
}

function element(tag,className,parent,text){
 const node=document.createElement(tag);
 node.className=className;
 if(text)node.textContent=text;
 parent.append(node);
 return node;
}
function notificationIcon(shape){
 const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');
 icon.setAttribute('viewBox','0 0 24 24');
 icon.setAttribute('aria-hidden','true');
 icon.setAttribute('focusable','false');
 const path=document.createElementNS('http://www.w3.org/2000/svg','path');
 path.setAttribute('d',shape);
 icon.append(path);
 return icon;
}

export function mountStudentNotifications(profileButton,isCurrent){
 if(!profileButton||!auth.currentUser||!isCurrent())return()=>{};
 const uid=auth.currentUser.uid;
 const current=()=>isCurrent()&&auth.currentUser?.uid===uid&&host.isConnected;
 const events=new AbortController();
 const listen=(node,type,handler)=>node.addEventListener(type,handler,{signal:events.signal});
 const host=document.createElement('div');
 host.className='student-notifications';
 profileButton.before(host);
 const toggle=element('button','student-notification-toggle',host);
 toggle.type='button';
 toggle.setAttribute('aria-controls','studentNotificationsPanel');
 toggle.setAttribute('aria-expanded','false');
 toggle.setAttribute('aria-label','Class notifications');
 toggle.append(notificationIcon(bellPath));
 const dot=element('span','student-notification-dot',toggle);
 dot.hidden=true;
 dot.setAttribute('aria-hidden','true');
 const panel=element('section','student-notification-panel',host);
 panel.id='studentNotificationsPanel';
 panel.hidden=true;
 panel.setAttribute('aria-labelledby','studentNotificationsTitle');
 const heading=element('header','student-notification-heading',panel);
 element('h2','student-notification-title',heading,'Class notifications').id='studentNotificationsTitle';
 const count=element('span','student-notification-count',heading);
 count.hidden=true;
 const close=element('button','student-notification-close',heading);
 close.type='button';
 close.setAttribute('aria-label','Close class notifications');
 element('span','student-notification-close-mark',close,'×').setAttribute('aria-hidden','true');
 const notice=element('p','student-notification-status',panel,'Checking for updates…');
 notice.setAttribute('role','status');
 const list=element('ul','student-notification-list',panel);
 const footer=element('div','student-notification-footer',panel);
 const openClass=element('a','student-notification-class',footer,'Open My Class');
 openClass.href='my-class.html';
 const retry=element('button','student-notification-retry',footer,'Refresh');
 retry.type='button';
 const badgeKey='lakbay:class-notification-badge:'+uid;
 let pending=false,refreshQueued=false,lastLoaded=0;

 function setBadge(unread){
  dot.hidden=!unread;
  toggle.setAttribute('aria-label',unread?'Class notifications, new updates':'Class notifications');
 }
 function draw({entries,incomplete}){
  const focusedLink=document.activeElement?.closest('.student-notification-link');
  const focusedHref=list.contains(focusedLink)?focusedLink.getAttribute('href'):null;
  const scrollTop=list.scrollTop;
  list.replaceChildren();
  for(const {kind,id,label,detail,time,due,classId,activityType,version} of entries.slice(0,maxDisplayed)){
   const item=element('li','student-notification-item',list);
   const link=element('a','student-notification-link',item);
   const route=new URLSearchParams({classroom:classId,update:kind,item:id});
   if(activityType)route.set('type',activityType);
   if(version)route.set('version',version);
   link.href='my-class.html?'+route;
   link.dataset.kind=kind;
   const medal=element('span','student-notification-emblem',link);
   medal.setAttribute('aria-hidden','true');
   medal.append(notificationIcon(kindIcons[kind]));
   const copy=element('span','student-notification-copy',link);
   element('strong','student-notification-label',copy,label);
   if(detail)element('span','student-notification-detail',copy,detail);
   if(due)element('span','student-notification-due',copy,'Due '+deadlineDate.format(due)+' PH time');
   else if(time)element('span','student-notification-date',copy,noticeDate.format(time));
   element('span','student-notification-chevron',link).setAttribute('aria-hidden','true');
  }
  setBadge(entries.length>0);
  count.hidden=!entries.length;
  count.textContent=entries.length?entries.length+' new':'';
  notice.textContent=incomplete?'Some updates could not load. Use Refresh to check again.':
   entries.length>maxDisplayed?'Showing the newest updates. Open My Class to see more.':entries.length?'':'You’re caught up.';
  panel.dataset.state=incomplete?'retry':entries.length?'ready':'empty';
  list.scrollTop=scrollTop;
  if(focusedHref&&!panel.hidden){
   const replacement=[...list.querySelectorAll('a')].find(link=>link.getAttribute('href')===focusedHref);
   (replacement||openClass).focus({preventScroll:true});
  }
  if(!incomplete){
   try{sessionStorage.setItem(badgeKey,JSON.stringify({at:lastLoaded,unread:entries.length>0}));}catch{}
  }
 }
 async function refresh(){
  if(!current())return;
  if(pending){refreshQueued=true;return;}
  pending=true;
  retry.disabled=true;
  notice.textContent='Checking for updates…';
  panel.dataset.state='loading';
  try{
   const requestCurrent=()=>current()&&!refreshQueued;
   const result=await loadUpdates(uid,requestCurrent);
   if(requestCurrent()){lastLoaded=Date.now();draw(result);}
  }catch{
   if(current()){
    notice.textContent='Updates could not load. Use Refresh to try again.';
    panel.dataset.state='retry';
   }
  }finally{
   pending=false;
   if(current()){
    retry.disabled=false;
    if(refreshQueued){refreshQueued=false;void refresh();}
   }
  }
 }
 function show(open,restoreFocus=false){
  panel.hidden=!open;
  toggle.setAttribute('aria-expanded',String(open));
  if(open){
   panel.style.setProperty('--notification-top',Math.ceil(toggle.getBoundingClientRect().bottom+8)+'px');
   if(!pending&&Date.now()-lastLoaded>15000)void refresh();
  }else if(restoreFocus)toggle.focus();
 }
 listen(toggle,'click',()=>show(panel.hidden));
 listen(close,'click',()=>show(false,true));
 listen(retry,'click',refresh);
 listen(document,'click',event=>{if(!panel.hidden&&!host.contains(event.target))show(false);});
 listen(host,'keydown',event=>{
  if(event.key==='Escape'&&!panel.hidden){event.preventDefault();show(false,true);}
 });
 listen(window,updateEvent,()=>{
  try{sessionStorage.removeItem(badgeKey);}catch{}
  void refresh();
 });
 listen(window,'pageshow',event=>{if(event.persisted)void refresh();});
 listen(document,'visibilitychange',()=>{
  if(!document.hidden&&Date.now()-lastLoaded>badgeLifetime)void refresh();
 });
 let cached=null;
 try{cached=JSON.parse(sessionStorage.getItem(badgeKey));}catch{}
 if(cached&&Date.now()-cached.at>=0&&Date.now()-cached.at<badgeLifetime)setBadge(cached.unread===true);
 else void refresh();

 return()=>{
  events.abort();
  host.remove();
  if(!isCurrent()&&auth.currentUser?.uid!==uid){
   try{sessionStorage.removeItem(badgeKey);}catch{}
  }
 };
}
