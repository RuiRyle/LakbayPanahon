import {classroomAssignmentEvidence} from './classroom-submission-policy.js';
import {reviewEvidence} from './teacher-class-policy.js';

const day=86400000;
const recentWindow=7*day;
const activityLimit=200;
const seenLimit=300;
export const classActivityStatuses=['published','closed','withdrawn'];
export const classActivityUpdateKinds=['activity','due','deadline','ended'];

function milliseconds(value){
 try{
  const time=value?.toMillis?.()??value?.toDate?.()?.getTime();
  return Number.isSafeInteger(time)&&time>0&&time<=8640000000000000?time:0;
 }catch{return 0;}
}

export function notificationActivityType(row){
 return row.assignmentType==='targeted-review'?'targeted-review':'class-goal';
}
function activityIdentity(row){return notificationActivityType(row)+':'+row.id;}
function notificationStateKey(uid,membership){
 return 'lakbay:class-notification-state:'+uid+':'+membership.classId+':'+milliseconds(membership.joinedAt);
}
export function readClassNotificationState(uid,membership){
 const joined=milliseconds(membership.joinedAt);
 try{
  const saved=JSON.parse(localStorage.getItem(notificationStateKey(uid,membership)));
  if(saved?.joined===joined&&saved.observed&&saved.seen)return saved;
 }catch{}
 return {joined,observed:{},seen:{}};
}
export function saveClassNotificationState(uid,membership,state){
 try{
  localStorage.setItem(notificationStateKey(uid,membership),JSON.stringify({
   joined:state.joined,
   observed:Object.fromEntries(Object.entries(state.observed).sort((a,b)=>b[1].observedAt-a[1].observedAt).slice(0,activityLimit)),
   seen:Object.fromEntries(Object.entries(state.seen).sort((a,b)=>b[1]-a[1]).slice(0,seenLimit))
  }));
 }catch{}
}
function isRecent(time,state,now){return time>0&&time>=state.joined&&time<=now&&now-time<=recentWindow;}
export function dueSoonActivity(row,now=Date.now()){
 const due=milliseconds(row.dueAt);
 return row.status==='published'&&due>now&&due-now<=day;
}
function reflectionToken(row){
 return 'guidance:'+row.reviewId+':'+milliseconds(row.respondedAt);
}
function activityTokens(row,state,now){
 const key=activityIdentity(row);
 const due=milliseconds(row.dueAt);
 const observed=state.observed[key];
 if(row.status==='closed'||row.status==='withdrawn'){
  const ended=milliseconds(row.endedAt);
  return isRecent(ended,state,now)?{ended:'ended:'+key+':'+ended}:{};
 }
 if(row.status!=='published')return {};
 const published=observed?.published||milliseconds(row.assignedAt)||milliseconds(row.publishedAt);
 const tokens={};
 const deadlineVersion=observed?.changeVersion||0;
 if(observed?.changeAt&&isRecent(observed.changeAt,state,now)&&observed.due===due)
  tokens.deadline='deadline:'+key+':'+observed.changeAt+':'+due+':'+deadlineVersion;
 if(dueSoonActivity(row,now))tokens.due='due:'+key+':'+due+(deadlineVersion?':'+deadlineVersion:'');
 if(isRecent(published,state,now))tokens.activity='activity:'+key+':'+published;
 return tokens;
}
function observeActivity(row,state,now){
 const key=activityIdentity(row),previous=state.observed[key],due=milliseconds(row.dueAt);
 const changed=row.status==='published'&&previous&&previous.due!==due;
 const observed={
  due,published:previous?.published||milliseconds(row.assignedAt)||milliseconds(row.publishedAt),
  observedAt:now,changeAt:changed?now:previous?.changeAt||0,
  changeVersion:(previous?.changeVersion||0)+Number(Boolean(changed))
 };
 state.observed[key]=observed;
 return observed;
}
export function classActivityNotifications({activities,reflections,attempts,membership,uid,state,now=Date.now()}){
 const nextState={...state,observed:{...state.observed}};
 const entries=[];
 for(const row of activities){
  const {due,published,changeAt}=observeActivity(row,nextState,now);
  const tokens=activityTokens(row,nextState,now);
  if(tokens.due){
   const evidence=attempts&&(notificationActivityType(row)==='targeted-review'
    ?reviewEvidence(row,attempts,uid,now)
    :classroomAssignmentEvidence(row,attempts,membership,uid,now));
   if(!evidence||evidence.unavailable||evidence.completed)delete tokens.due;
  }
  const candidate=Object.entries(tokens).find(([,key])=>!state.seen[key]);
  if(candidate){
   const [kind,version]=candidate;
   const label={
    activity:'New activity assigned',due:'Activity due within 24 hours',
    deadline:due?'Activity deadline changed':'Activity deadline removed',
    ended:row.status==='withdrawn'?'Activity cancelled':'Activity closed'
   }[kind];
   entries.push({kind,id:row.id,activityType:notificationActivityType(row),label,version,
    detail:row.title,due:['due','deadline'].includes(kind)?due:0,
    time:kind==='ended'?milliseconds(row.endedAt):kind==='deadline'?changeAt:kind==='due'?now:published});
  }
 }
 const reviews=new Map(activities.filter(row=>notificationActivityType(row)==='targeted-review').map(row=>[row.id,row]));
 for(const row of reflections){
  const time=milliseconds(row.respondedAt),review=reviews.get(row.reviewId);
  if(review&&row.response?.trim()&&time>=state.joined&&time>0&&time<=now&&!state.seen[reflectionToken(row)]){
   entries.push({kind:'guidance',id:row.reviewId,activityType:'targeted-review',
    label:'Feedback on your explanation',detail:review.title,time});
  }
 }
 return {entries,state:nextState};
}
export function acknowledgeClassActivity(uid,membership,row,kind,version){
 const state=readClassNotificationState(uid,membership);
 const now=Date.now();
 observeActivity(row,state,now);
 const tokens=activityTokens(row,state,now);
 const matches=Boolean(version&&Object.hasOwn(tokens,kind)&&tokens[kind]===version);
 if(matches){
  state.seen[version]=now;
  if(kind==='due'||kind==='deadline'){
   for(const related of [tokens.due,tokens.deadline,tokens.activity]){
    if(related)state.seen[related]=now;
   }
  }
 }
 saveClassNotificationState(uid,membership,state);
 return matches;
}
export function acknowledgeReflectionGuidance(uid,membership,row){
 if(!row?.response?.trim()||!milliseconds(row.respondedAt))return false;
 const state=readClassNotificationState(uid,membership);
 const token=reflectionToken(row);
 if(state.seen[token])return false;
 state.seen[token]=Date.now();
 saveClassNotificationState(uid,membership,state);
 return true;
}
