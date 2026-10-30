import {studentLoadMessage} from './student-status.js';
﻿import {auth,db} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {collection,getDocs,query,where} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {resolveStudentJourney,renderStudentJourney} from './student-journey.js';
import {buildJourneyPath} from './journey-path.js';
import {missionTopicStates} from './mission-review.js';
import {reviewQuestionSnapshot} from './review-question-catalog.js';
import {instructionalSnapshot} from './instructional-snapshot.js';

const page=document.getElementById('journeyPageContent'),status=document.getElementById('journeyPageStatus'),refresh=document.getElementById('refreshJourney');
let generation=0;
function text(tag,value,className) {const node=document.createElement(tag);node.textContent=value;if(className)node.className=className;return node;}
function pathLink(label,url) {const node=text('a',label,'text-button');node.href=url;return node;}
function renderTopicStatuses(container,topics,chapterByMission){
    container.replaceChildren();
    if(!topics.length){container.append(text('p','No topic needs extra review based on your saved quizzes and practice. Keep learning to build more evidence.'));return;}
    const labels={'review-needed':'Review the lesson','lesson-revisited':'Lesson revisited','practising':'Building understanding','practice-goal-reached':'Practice goal reached'};
    for(const topic of topics){
        const chapter=chapterByMission.get(topic.missionId);if(!chapter)continue;
        const card=document.createElement('article');card.className='journey-topic-card';card.dataset.state=topic.state;
        const stage=text('span',labels[topic.state]||'Review the lesson','journey-topic-stage');
        const heading=text('h3',topic.label||topic.topic);
        const message=topic.state==='practice-goal-reached'
            ? 'You met this topic’s practice goal. Return later to check what you remember.'
            : topic.state==='practising'?'You have started practising this topic. Keep going at your own pace.'
            : topic.state==='lesson-revisited'?'You revisited the story. Try practice to check your understanding.'
            : 'Your saved quiz or practice suggests another look at this topic.';
        const action=topic.state==='review-needed'||topic.state==='practice-goal-reached'
            ? pathLink('Revisit Story','story.html?'+new URLSearchParams({chapter,mission:topic.missionId,reviewTopic:topic.topic}))
            : pathLink('Practise This Topic','practice.html?'+new URLSearchParams({chapter,mission:topic.missionId,topic:topic.topic,review:'1'}));
        card.append(stage,heading,text('p',message),action);
        container.append(card);
    }
}
function renderPath(groups,state) {
    const path=document.getElementById('journeyPath');path.replaceChildren();
    if(!groups.length){path.append(text('p','Your learning path is being prepared. Explore Chapters for available content.'));return;}
    for(const era of groups) {
        const section=document.createElement('section');section.className='journey-era';
        const eraHeading=document.createElement('h3');eraHeading.append(text('span',era.title||era.name||'Historical era'));
        if(era.id)eraHeading.append(pathLink('View Era','era.html?'+new URLSearchParams({era:era.id})));
        section.append(eraHeading);
        if(!era.accessible)section.append(text('p',era.unlockMessage||'Complete the required chapters in the previous era to unlock new lessons. Completed lessons remain available for review.','journey-era-requirement'));
        for(const chapter of era.chapters) {
            const currentChapter=chapter.id===state.chapter?.id;
            const details=document.createElement('details');details.className='journey-chapter';details.dataset.state=chapter.completed?'complete':!chapter.accessible?'locked':currentChapter?'current':'available';details.open=chapter.id===(state.chapter?.id||state.completion?.latestChapter?.id);
            const summary=document.createElement('summary');
            const heading=text('span',chapter.title||'Historical chapter','journey-chapter-name');
            const label=!chapter.ready?'Preparing':chapter.completed?'Completed':!chapter.accessible?'Locked':chapter.id===state.chapter?.id?'Current chapter':'Available';
            const chapterState=chapter.completed?'is-complete':!chapter.accessible?'is-locked':currentChapter?'is-current':'is-available';
            summary.append(heading,text('span',label,'journey-state '+chapterState));
            details.append(summary);
            const body=document.createElement('div');body.className='journey-chapter-body';
            body.append(text('p',chapter.completedMissions+' / '+chapter.missions.length+' missions completed','journey-chapter-progress'));
            if(!chapter.ready)body.append(text('p','This chapter is being prepared.'));
            else if(!chapter.accessible)body.append(text('p',era.accessible?'Complete the previous chapters in this era to unlock this chapter.':era.unlockMessage||'Complete the required chapters in the previous era to unlock this chapter.'));
            const list=document.createElement('ol');list.className='journey-missions';
            for(const mission of chapter.missions) {
                const item=document.createElement('li');const current=mission.id===state.mission?.id;item.dataset.state=mission.completed?'complete':!mission.accessible?'locked':current?'current':'available';
                const copy=document.createElement('div');copy.append(text('h4',mission.title||'Historical mission'));
                copy.append(text('span',mission.completed?'Completed':!mission.accessible?'Locked':current?'Current mission':'Available','journey-mission-status'));
                item.append(copy);
                if(mission.accessible)item.append(pathLink(mission.completed?'Review Lesson':'Open Lesson','story.html?'+new URLSearchParams({chapter:chapter.id,mission:mission.id})));
                else item.append(text('span',chapter.accessible?'Complete the previous missions first.':'Chapter locked','journey-lock-note'));
                list.append(item);
            }
            body.append(list);
            if(!chapter.missions.length&&chapter.ready)body.append(text('p','Missions for this chapter are being prepared.'));
            const challenge=document.createElement('div');challenge.className='journey-challenge';
            challenge.append(text('strong','Chapter Challenge'));
            if(chapter.challengeAccessible)challenge.append(pathLink(chapter.completed?'Replay Challenge':'Open Challenge','chapter-challenge.html?'+new URLSearchParams({chapter:chapter.id})));
            else challenge.append(text('span',!chapter.challenge?'Challenge being prepared.':!chapter.accessible?'Unlock this chapter before taking its challenge.':'Complete all missions in this chapter to unlock.'));
            body.append(challenge);details.append(body);section.append(details);
        }
        path.append(section);
    }
}
async function loadJourneyPage() {
    const user=auth.currentUser,request=++generation;const current=()=>request===generation&&auth.currentUser?.uid===user?.uid;
    page.hidden=true;refresh.disabled=true;status.textContent=user?'Loading your saved journey...':'Sign in to view your journey.';
    if(!user)return;
    try {
        const names=['chapters','eras','missions','chapterChallenges','studentChapterProgress','studentProgress','studentQuizAttempts','studentLearningDrafts','studentPracticeProgress','practiceQuestions','studentReviewEvents'];
        const results=await Promise.allSettled(names.map(name=>name==='practiceQuestions'?Promise.resolve({docs:[]}):name.startsWith('student')
            ? getDocs(query(collection(db,name),where('userId','==',user.uid)))
            : instructionalSnapshot(name,()=>getDocs(collection(db,name)))));
        if(!current())return;
        const failure=results.slice(0,7).find(r=>r.status==='rejected');if(failure)throw failure.reason;
        if(results[8].status==='fulfilled'){
            try{results[9]={status:'fulfilled',value:await reviewQuestionSnapshot(user.uid,
                results[6].value.docs.map(d=>({...d.data(),id:d.id})),results[8].value.docs.map(d=>({...d.data(),id:d.id})),missionId=>
                    getDocs(query(collection(db,'practiceQuestions'),where('missionId','==',missionId))))};}
            catch(reason){results[9]={status:'rejected',reason};}
        }else results[9]={status:'rejected',reason:results[8].reason};
        if(!current())return;
        const rows=index=>results[index].status==='fulfilled'?results[index].value.docs.map(d=>({...d.data(),id:d.id})):[];
        const [chapters,eras,missions,challenges,chapterProgress,missionProgress,attempts,drafts,practiceSessions,questions,reviewEvents]=results.map((_,i)=>rows(i));
        const data={userId:user.uid,chapters,eras,missions,challenges,chapterProgress,missionProgress,attempts,drafts,practiceSessions};
        const reviewAvailable=results[8].status==='fulfilled'&&results[9].status==='fulfilled'&&results[10].status==='fulfilled';
        const groups=buildJourneyPath(data),chapterRows=groups.flatMap(g=>g.chapters),missionRows=chapterRows.flatMap(c=>c.missions);
        const accessible=new Map(missionRows.filter(m=>m.accessible).map(m=>[m.id,m.chapterId]));
        const topicStates=reviewAvailable?missionTopicStates(attempts.filter(a=>a.userId===user.uid),practiceSessions.filter(p=>p.userId===user.uid),questions,reviewEvents).filter(topic=>accessible.has(topic.missionId)):undefined;
        const review=topicStates?.filter(topic=>topic.state!=='practice-goal-reached');
        const state=resolveStudentJourney({...data,reviewTopics:review});state.optionalGuidanceUnavailable=results.slice(7).some(r=>r.status==='rejected');
        renderStudentJourney(document.getElementById('journeyNextAction'),state,loadJourneyPage);
        renderPath(groups,state);
        document.getElementById('journeyMissionCount').textContent=missionRows.filter(m=>m.completed).length+' / '+missionRows.length;
        document.getElementById('journeyChapterCount').textContent=chapterRows.filter(c=>c.completed&&c.ready).length+' / '+chapterRows.filter(c=>c.ready).length;
        document.getElementById('journeyReviewCount').textContent=reviewAvailable?String(review.length):'Unavailable';
        const reviewPanel=document.getElementById('journeyReviewTopics');
        if(reviewAvailable)renderTopicStatuses(reviewPanel,topicStates,accessible);
        else {reviewPanel.replaceChildren(text('p','Your review evidence could not load. Use Refresh Progress to try again. You can still continue learning.'));}
        status.textContent=state.optionalGuidanceUnavailable?'Your learning path is available. Some resume or review details could not load; use Refresh Progress to retry.':'Your progress is up to date.';
        page.hidden=false;
    } catch(error) {
        if(!current())return;
        console.warn('Journey page unavailable:',error);status.textContent=studentLoadMessage(error,'We could not load your journey. Use Refresh Progress to try again.');
    } finally {if(current())refresh.disabled=false;}
}
refresh.addEventListener('click',loadJourneyPage);
onAuthStateChanged(auth,()=>{
    generation++;page.hidden=true;
    for(const id of ['journeyNextAction','journeyPath','journeyReviewTopics'])document.getElementById(id).replaceChildren();
    loadJourneyPage();
});
window.addEventListener('pageshow',event=>{if(event.persisted)loadJourneyPage();});
