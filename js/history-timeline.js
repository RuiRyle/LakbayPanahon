import {auth,db} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {collection,getDocs,query,where} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {buildJourneyPath} from './journey-path.js';
import {studentLoadMessage} from './student-status.js';
import {renderHistoryTimeline} from './history-timeline-view.js';
const host=document.getElementById('historyTimeline'),status=document.getElementById('timelineStatus'),filter=document.getElementById('timelineEra'),retry=document.getElementById('retryTimeline');
let generation=0,groups=[],revealObserver=null,selectedEra='',currentOwner=null;
function render(){
 selectedEra=filter.value;
 revealObserver?.disconnect();
 renderHistoryTimeline(host,groups,filter.value);
 if(typeof IntersectionObserver!=='function'||matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('lakbay-reduce-motion'))return;
 revealObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('timeline-reveal');revealObserver.unobserve(entry.target);}},{threshold:.08});
 for(const card of host.querySelectorAll('.history-timeline-stop'))revealObserver.observe(card);
}
async function load(){
 const request=++generation,uid=auth.currentUser?.uid;
 const selected=uid===currentOwner?(filter.value||selectedEra):'';currentOwner=uid;selectedEra=selected;
 groups=[];revealObserver?.disconnect();host.replaceChildren();filter.replaceChildren(new Option('All periods',''));retry.disabled=true;filter.disabled=true;
 status.textContent=uid?'Loading your timeline...':'Sign in to explore the timeline.';if(!uid)return;
 try{
  const names=['eras','chapters','missions','studentProgress','studentChapterProgress'];
  const results=await Promise.all(names.map(name=>getDocs(name.startsWith('student')?query(collection(db,name),where('userId','==',uid)):collection(db,name))));
  if(request!==generation||auth.currentUser?.uid!==uid)return;
  const [eras,chapters,missions,missionProgress,chapterProgress]=results.map(result=>result.docs.map(d=>({...d.data(),id:d.id})));
  groups=buildJourneyPath({userId:uid,eras,chapters,missions,missionProgress,chapterProgress,challenges:[]});
  for(const group of groups)filter.add(new Option(group.title||'Learning chapters',group.id||'unassigned'));
  if([...filter.options].some(option=>option.value===selected))filter.value=selected;
  render();filter.disabled=false;status.textContent=groups.length?'Choose a period or follow the chapters in order.':'No timeline topics are published yet. You can return to My Journey.';
 }catch(error){if(request===generation)status.textContent=studentLoadMessage(error,'The timeline could not load. Use Refresh Timeline to try again.');}
 finally{if(request===generation)retry.disabled=false;}
}
filter.addEventListener('change',render);retry.addEventListener('click',load);onAuthStateChanged(auth,load);
window.addEventListener('pagehide',()=>{generation++;groups=[];revealObserver?.disconnect();host.replaceChildren();});
window.addEventListener('pageshow',event=>{if(event.persisted)load();});
