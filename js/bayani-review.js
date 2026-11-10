import {auth,db} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {doc,getDocFromServer,collection,getDocs,query,where} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {connectBayani} from './bayani-client.js';
import {withBayaniDeadline,BAYANI_REPLY_TIMEOUT_MS,BAYANI_CONNECT_TIMEOUT_MS} from './bayani-request.js';
import {parseReviewQuestion,reviewPrompt} from './bayani-review-question.js';
const panel=document.getElementById('bayaniReviewPanel'),status=document.getElementById('reviewQuestionStatus'),generate=document.getElementById('generateReviewQuestion'),card=document.getElementById('generatedReviewQuestion'),check=document.getElementById('checkReviewAnswer'),feedback=document.getElementById('reviewAnswerFeedback'),topic=document.getElementById('reviewTopicLabel');
const params=new URLSearchParams(location.search),missionId=params.get('mission'),chapterId=params.get('chapter');
const retryLesson=document.getElementById('retryReviewLesson');
let generation=0,question=null,selected='',answered=false,loading=false,ready=false,lesson='',connection=null;
function clear(){question=null;selected='';answered=false;card.hidden=true;feedback.textContent='';check.disabled=true;document.getElementById('reviewQuestionOptions').replaceChildren();}
async function prepare(restoreFocus=false){
 const request=++generation,uid=auth.currentUser?.uid;clear();ready=false;loading=false;connection=null;generate.disabled=true;lesson='';document.getElementById('reviewSourceLesson').hidden=true;topic.textContent='Review a history topic';
 retryLesson.hidden=true;retryLesson.disabled=true;
 panel.hidden=!uid||!missionId||!chapterId;
 document.querySelector('.bayani-layout').hidden=!panel.hidden;
 if(!uid){status.textContent='Sign in to use review questions.';return;}
 if(!missionId||!chapterId){status.textContent='Open a topic from My Journey to practise with a lesson-based AI question.';return;}
 status.textContent='Finding the lesson for your review topic...';
 try{
  const [mission,scenes]=await withBayaniDeadline(()=>Promise.all([getDocFromServer(doc(db,'missions',missionId)),getDocs(query(collection(db,'storyScenes'),where('missionId','==',missionId),where('status','==','active')))]),15000);
  if(request!==generation||auth.currentUser?.uid!==uid)return;
  if(!mission.exists()||mission.data().status!=='active'||mission.data().chapterId!==chapterId)throw Error('Lesson unavailable');
  const rows=scenes.docs.map(d=>d.data()).sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
  const requested=params.get('topic')||'',mapped=rows.filter(row=>Array.isArray(row.reviewTopics)&&row.reviewTopics.includes(requested));
  lesson=(mapped.length?mapped:rows).map(row=>[row.title,row.content||row.text].filter(Boolean).join('\n')).join('\n\n');
  if(lesson.trim().length<80)throw Error('Lesson source unavailable');
  topic.textContent=(mapped.length?(params.get('label')||requested):(mission.data().title||'Your lesson')).slice(0,100);
  const link=document.getElementById('reviewSourceLesson');link.href='story.html?'+new URLSearchParams({chapter:chapterId,mission:missionId,...(requested?{reviewTopic:requested}:{})});link.hidden=false;
  ready=true;generate.disabled=false;status.textContent='Ready. Generate one question when you want to practise. AI questions do not change your mission score or XP.';
  if(restoreFocus===true)generate.focus({preventScroll:true});
 }catch{if(request===generation&&auth.currentUser?.uid===uid){status.textContent='The lesson could not load. Retry the lesson or choose another topic in My Journey.';retryLesson.hidden=false;retryLesson.disabled=false;}}
}
retryLesson.addEventListener('click',()=>{if(!retryLesson.disabled)prepare(true);});
generate.addEventListener('click',async()=>{
 if(loading||!ready||!auth.currentUser)return;const request=generation,uid=auth.currentUser.uid;loading=true;generate.disabled=true;clear();status.textContent='Preparing one AI review question...';
 try{
  const nextConnection=connection||await withBayaniDeadline(connectBayani,BAYANI_CONNECT_TIMEOUT_MS);
  if(request!==generation||auth.currentUser?.uid!==uid)return;
  connection=nextConnection;
  const prompt=reviewPrompt(topic.textContent,lesson,connection.settings.maxMessageCharacters);
  const response=await withBayaniDeadline(()=>connection.send(prompt,[]),BAYANI_REPLY_TIMEOUT_MS);
  if(request!==generation||auth.currentUser?.uid!==uid)return;
  question=parseReviewQuestion(response);document.getElementById('reviewQuestionText').textContent=question.question;
  const options=document.getElementById('reviewQuestionOptions');options.replaceChildren();
  const issuedQuestion=question;
  for(const key of ['A','B','C','D']){const button=document.createElement('button');button.type='button';button.textContent=key+'. '+question.options[key];button.setAttribute('aria-pressed','false');button.addEventListener('click',()=>{if(answered||question!==issuedQuestion||button.disabled)return;selected=key;for(const b of options.children)b.setAttribute('aria-pressed',String(b===button));check.disabled=false;});options.append(button);}
  card.hidden=false;status.textContent='AI-generated practice: choose an answer, then check it. Verify the explanation against your lesson.';document.getElementById('reviewQuestionText').focus();
 }catch{if(request===generation){connection=null;status.textContent='Bayani could not create a usable review question. You can try again or use the saved practice questions in My Journey.';}}
 finally{if(request===generation){loading=false;generate.disabled=!ready;}}
});
check.addEventListener('click',()=>{if(!question||!selected||answered)return;answered=true;feedback.textContent=(selected===question.answer?'You chose the suggested answer. ':'The AI suggests '+question.answer+': '+question.options[question.answer]+'. ')+question.explanation+' Check this against the lesson; AI can make mistakes.';check.disabled=true;for(const button of document.getElementById('reviewQuestionOptions').children)button.disabled=true;feedback.setAttribute('tabindex','-1');feedback.focus({preventScroll:true});});
onAuthStateChanged(auth,prepare);
window.addEventListener('pagehide',()=>{generation++;lesson='';connection=null;ready=false;retryLesson.hidden=true;retryLesson.disabled=true;clear();panel.hidden=true;});
window.addEventListener('pageshow',event=>{if(event.persisted){panel.hidden=false;prepare();}});
