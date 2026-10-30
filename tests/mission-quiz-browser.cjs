const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-mission-flow-'));
const source=name=>fs.readFileSync(path.join(root,'js',name),'utf8').replace(/import[\s\S]*?from\s+"[^"]+";/g,'').replace(/export /g,'');
const fixture=require('./fixtures/mission-quiz-catalog.json'),plan=require('../data/mission-quiz-flow-migration.json');
const catalogs={quizzes:fixture.quizzes,questions:fixture.questions};
for(const write of plan.writes){const[name,id]=write.path.split('/');if(!catalogs[name])continue;const old=catalogs[name].find(q=>q.id===id);if(old)Object.assign(old,write.fields);else catalogs[name].push({id,...write.fields});}
// Exercise the existing authored feedback/option revisions, not an older quiz snapshot alone.
for(const write of require('../data/chapter1-mission1-learning-polish-migration.json').writes){const[name,id]=write.path.split('/');if(name!=='questions')continue;const question=catalogs.questions.find(row=>row.id===id);if(!question)throw Error('Authored quiz fixture missing '+id);Object.assign(question,write.fields);}
const adaptiveDraft=require('../data/mission1-adaptive-quiz-question-drafts.json');
for(const write of adaptiveDraft.writes){catalogs.questions.push({...write.fields,id:write.path.split('/')[1],status:'active'});}
let page=fs.readFileSync(path.join(root,'pages/quiz.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
const styles=["student.css","quiz.css",'navy-gold-theme.css'].map(name=>fs.readFileSync(path.join(root,"css",name),"utf8")).join("\n");
page=page.replace("</head>","<style>"+styles+"</style></head>");
const script=`
function mountLearningNavigation(container, activity, search = window.location.search) {
    if (!container) return;
    const chapter = new URLSearchParams(search).get("chapter");
    const nav = document.createElement("nav");
    nav.className = "learning-navigation";
    nav.setAttribute("aria-label", "Learning path");
    const list = document.createElement("ol");
    const add = (label, href) => {
        const item = document.createElement("li");
        const element = document.createElement(href ? "a" : "span");
        element.textContent = label;
        if (href) element.href = href;
        else element.setAttribute("aria-current", "page");
        item.append(element);list.append(item);
    };
    add("Chapters", "chapters.html");
    if (chapter) add("Mission Journey", "mission.html?" + new URLSearchParams({chapter}));
    add(activity);
    nav.append(list);
    container.prepend(nav);
}


const db={},auth={currentUser:{uid:'test'}};
const fixtureCatalogs=${JSON.stringify(catalogs)};
const fixtureRecords=new Map();
for(const q of fixtureCatalogs.questions){q.answerExplanations={A:'Specific feedback <img src=x>',B:'Specific feedback <img src=x>',C:'Specific feedback <img src=x>',D:'Specific feedback <img src=x>'};q.learningPoint='Database learning point';}
for(const[name,docs]of Object.entries(fixtureCatalogs))for(const row of docs)fixtureRecords.set(name+'/'+row.id,row);
fixtureRecords.set('learningSettings/progression',{xpPerLevel:100,version:1});
fixtureRecords.set('users/test',{role:'student',status:'active',firstName:'Test',xp:0,level:1});
fixtureRecords.set('chapterChallenges/c1-final',{chapterId:'c1',status:'active'});
fixtureRecords.set('missions/mission-1',{id:'mission-1',chapterId:'c1',status:'active',xpReward:25,title:'Barangay'});
fixtureRecords.set('artifacts/a1',{id:'a1',missionId:'mission-1',status:'active',name:'Test artifact'});
const collection=(_,name)=>({name}),doc=(_,name,id)=>name+'/'+id;
const where=(field,op,value)=>({field,value}),query=(ref,...filters)=>({...ref,filters});
const getDoc=async key=>({id:key.split('/')[1],exists:()=>fixtureRecords.has(key),data:()=>fixtureRecords.get(key)});
let fixtureLoadGate=null,fixtureSaveGate=null,fixtureLoadFailure=false;
const getDocs=async ref=>{if(ref.name==='quizzes'&&!(ref.filters||[]).some(filter=>filter.field==='missionId'&&filter.value==='mission-1'))throw Error('Unscoped quiz read');if(fixtureLoadFailure)throw Error("Content unavailable");if(ref.name=== "questions" && fixtureLoadGate) await fixtureLoadGate;const docs=[...fixtureRecords].filter(([key,row])=>key.startsWith(ref.name+'/')&&(!ref.filters||ref.filters.every(f=>row[f.field]===f.value))).map(([key,row])=>({id:key.split('/')[1],data:()=>row}));return{docs,forEach:fn=>docs.forEach(fn)};};
const runTransaction=async(_,fn)=>{const writes=[];const value=await fn({get:getDoc,set:(key,row)=>writes.push(()=>fixtureRecords.set(key,row)),update:(key,row)=>writes.push(()=>fixtureRecords.set(key,{...fixtureRecords.get(key),...row}))});writes.forEach(fn=>fn());if(fixtureSaveGate) await fixtureSaveGate;return value;};
const serverTimestamp=()=>({toMillis:()=>Date.now()});
class LearningAccessError extends Error{}
const requireLearningAccess=async()=>fixtureRecords.get('missions/mission-1');
const renderStudentIdentity=()=>{};
let fixtureAuthListener;
const onAuthStateChanged=(_,fn)=>{fixtureAuthListener=fn;queueMicrotask(()=>fn(auth.currentUser));};
window.alert=message=>{throw new Error(message);};
const loadProgressionPolicy=async()=>fixtureRecords.get('learningSettings/progression');
${source('daily-policy.js')}
${source('progression-policy.js')}
${source('activity-policy.js')}
${source('mission-assessment.js')}
${source('practice-review.js')}
${source('mission-review.js')}
${source('student-rewards-client.js')}
const startMissionQuiz=(()=>{${source('mission-assessment-client.js')};return startMissionQuiz;})();

const restartControl=(container,label,restart)=>{const button=document.createElement('button');button.hidden=true;button.addEventListener('click',async()=>{if(window.confirm('Restart?'))await restart();});container.prepend(button);return button;};
window.confirm=()=>true;
const fixtureDrafts=new Map();
const draftStatus=container=>{const p=document.createElement('p');container.prepend(p);return p;};
const learningDraft=(kind,chapter,mission)=>{const key=kind+mission;let closed=false;return{read:async()=>fixtureDrafts.get(key)||null,save:state=>{if(!closed)fixtureDrafts.set(key,JSON.parse(JSON.stringify(state)));},clear:async()=>{closed=true;fixtureDrafts.delete(key);},close:()=>{closed=true;}};};
${source('quiz-draft-policy.js')}
${source('quiz.js').replace(/window\.location\.href\s*=\s*"login\.html";/g, 'window.fixtureLoginRedirect = true;')}
const tick=()=>new Promise(resolve=>setTimeout(resolve,40));
const check=(condition,message)=>{if(!condition)throw Error(message);};
async function answerSet(correct){
 document.querySelector("#quizMissionBriefing button")?.click();
 for(let index=0;index<5;index++){
   const question=questions[index];
   const answer=index<correct?question.correctAnswer:question.correctAnswer==='A'?'B':'A';
   document.querySelector('.quiz-option[data-option="'+answer+'"]').click();
   check(document.activeElement.dataset.option===answer,'Option rendering lost keyboard focus');
   document.getElementById('nextQuestionButton').click();
   if(index===4)document.querySelector('#flagReviewPanel button:last-child')?.click();
   await tick();
   if(index<4)check(document.activeElement===questionText,'New question did not receive focus');
 }
}
(async()=>{
 document.body.classList.add("authenticated");
 await tick();check(!quizContent.hidden,'Quiz did not load: '+quizError.textContent);
 check(questions.length===5,'Quiz did not select five questions');
 check(document.getElementById('quizMissionBriefing')&&questionCard.hidden,'New attempt skips briefing');
 document.querySelector('#quizMissionBriefing button').click();
 check(!questionCard.hidden&&quizStarted&&!document.getElementById('quizMissionBriefing'),'Begin expedition failed');
 check(questions.every(question=>question.difficulty==='medium'),'First-time learner did not start at blueprint difficulty');
 const openingQuestion=questions[0];
 const wrongOpeningAnswer=['A','B','C','D'].find(letter=>letter!==openingQuestion.correctAnswer);
 document.querySelector('.quiz-option[data-option="'+wrongOpeningAnswer+'"]').click();
 document.getElementById('nextQuestionButton').click();await tick();
 check(questions[1].difficulty==='easy','Incorrect answer did not lower the next question difficulty');
 check(new Set(questions.map(question=>question.topic)).size===5,'Adaptive routing changed required topic coverage');
 restartQuizButton.click();await tick();
 check(currentQuestionIndex===0&&questions.length===5&&Object.keys(studentAnswers).length===0,'Adaptive probe did not reset before browser flow checks');
 document.querySelector('#quizMissionBriefing button')?.click();
 check(!questionCard.hidden,'Adaptive probe restart did not begin a clean attempt');
 studentAnswers[questions[0].id]='A';lockedAnswers[questions[0].id]=true;displayQuestion();document.querySelector('.quiz-option[data-option="B"]').click();check(studentAnswers[questions[0].id]==='B','Previously locked answer cannot be revised');delete studentAnswers[questions[0].id];delete lockedAnswers[questions[0].id];displayQuestion();
 quizStarted=false;await loadQuiz();check(!questionCard.hidden&&!document.getElementById('quizMissionBriefing'),'Started attempt does not resume after a cold start');
 check(getComputedStyle(quizResult).display==='none','Result visible before submission');
 check(getComputedStyle(document.getElementById('reinforcePassedTopicsLink')).display==='none','Hidden practice link displayed by CSS');
 check(document.getElementById('quizPassingRequirement').textContent.includes('3 correct (60%)'),'Quiz intro requirements missing');
 fixtureRecords.get('quizzes/'+currentQuiz.id).passingScore=80;await loadQuiz();
 check(document.getElementById('quizPassingRequirement').textContent.includes('4 correct (80%)'),'Quiz intro uses fixed pass threshold');
 fixtureRecords.get('quizzes/'+currentQuiz.id).passingScore=60;await loadQuiz();
 fixtureLoadFailure=true;await loadQuiz();
 check(!quizError.hidden&&!retryQuizLoadButton.hidden&&!quizLoadPending,'Load failure lacks recovery');
 fixtureLoadFailure=false;retryQuizLoadButton.click();await tick();
 check(!quizContent.hidden&&retryQuizLoadButton.hidden,'Quiz load retry failed');
 let first=questions.map(q=>q.id);
 studentAnswers[questions[0].id]='A';
 let initialAttempt=currentAttemptId;
 document.getElementById('flagQuestionButton').click();
 check(flaggedQuestions.has(questions[0].id)&&document.getElementById('flagQuestionButton').getAttribute('aria-pressed')==='true','Flag not recorded');

 lockedAnswers[questions[0].id]=true;currentQuestionIndex=1;displayQuestion();
 await loadQuiz();
 check(currentQuestionIndex===1&&studentAnswers[questions[0].id]==='A'&&lockedAnswers[questions[0].id],'Quiz draft did not restore');
 check(flaggedQuestions.has(questions[0].id),'Saved draft lost review flag');
 await submitQuiz();check(!quizSubmitted&&!document.getElementById('flagReviewPanel').hidden,'Flags skipped submission review');check(document.querySelectorAll('.quiz-journal-question').length===questions.length,'Journal omits questions');check(document.querySelector('.quiz-journal-question').textContent.includes(questions[0].optionA),'Journal omits selected answer text');check(document.querySelector('.quiz-journal-summary').textContent.includes('1 of 5 answered'),'Journal count incorrect');check(document.querySelector('.quiz-journal-question').dataset.flagged==='true','Review flag not visible');
 document.querySelector('#flagReviewPanel button').click();check(currentQuestionIndex===0,'Flag review did not return to checkpoint');check(document.activeElement===questionText,'Review return did not focus question');
 document.getElementById('flagQuestionButton').click();check(!flaggedQuestions.size,'Flag cannot be removed');currentQuestionIndex=1;displayQuestion();
 const unchangedExplanation=questions[0].explanation;
 fixtureRecords.get('questions/'+questions[0].id).explanation='Updated feedback only';
 await loadQuiz();check(currentQuestionIndex===1&&Object.keys(studentAnswers).length===1,'Feedback edit reset valid draft');
 fixtureRecords.get('questions/'+questions[0].id).question+=' Revised wording';
 await loadQuiz();check(currentQuestionIndex===0&&Object.keys(studentAnswers).length===0,'Changed question reused stale answers');
 check(document.getElementById('quizSetNotice').textContent.includes('content changed'),'Changed content reset not explained');
 const beforeRestart=currentAttemptId;restartQuizButton.click();await tick();
 check(currentAttemptId!==beforeRestart&&currentQuestionIndex===0&&Object.keys(studentAnswers).length===0,'Quiz restart did not reset attempt');
 currentQuestionIndex=0;displayQuestion();
 await fixtureAuthListener(auth.currentUser);
 first=questions.map(q=>q.id);studentAnswers[questions[0].id]='A';initialAttempt=currentAttemptId;await fixtureAuthListener(auth.currentUser);
 check(currentAttemptId===initialAttempt&&studentAnswers[questions[0].id]==='A','Auth refresh reset an unfinished quiz');
 await answerSet(2);
 check(!quizResult.hidden&&quizResultTitle.textContent.includes('Training'),'Failed result not shown');
 check(document.getElementById('reinforcePassedTopicsLink').hidden,'Failure offered duplicate passing-only practice link');
 check(getComputedStyle(document.getElementById('reinforcePassedTopicsLink')).display==='none','Failed result displays hidden reinforcement link');
 check(document.getElementById('quizWeakTopics').children.length===3,'Weak topics missing');
 check(fixtureRecords.get('users/test').xp===0,'Failure awarded XP');
 check(quizResult.dataset.outcome==='retry'&&document.getElementById('expeditionResultSummary').textContent.includes(Math.ceil(questions.length*requirePassingScore(currentQuiz)/100)+' correct'),'Recovery summary omits the required correct-answer count');
 const topicSceneLink=document.querySelector('.result-topic-route a');check(topicSceneLink&&new URL(topicSceneLink.href).searchParams.get('reviewTopic'),'Result does not route to teaching scenes');

 check(topicSceneLink.textContent==='1. Review the lesson'&&topicSceneLink.getAttribute('aria-label').includes('Review the lesson:'),'Recovery lesson step is unclear');
 const practiceStep=document.querySelector('.result-topic-route a:nth-of-type(2)');check(practiceStep.textContent==='2. Try practice'&&new URL(practiceStep.href).searchParams.get('topic')===new URL(topicSceneLink.href).searchParams.get('reviewTopic'),'Recovery practice step lost its topic');
 check(!retryQuizButton.hidden,'Retry unavailable');
 const missedReview=document.querySelector('.quiz-review-item.incorrect');
 check(missedReview.textContent.includes('Specific feedback <img src=x>')&&missedReview.textContent.includes('Database learning point'),'Authored feedback not shown');
 check(!missedReview.querySelector('img'),'Feedback rendered as HTML');
 const recoveryLinks=[...missedReview.querySelectorAll('a')];
 check(new URL(recoveryLinks[0].href).searchParams.get('mission')==='mission-1','Lesson link lost mission');
 check(new URL(recoveryLinks[1].href).searchParams.get('topic'),'Practice link lost topic');
 first=questions.map(q=>q.id);
 retryQuizButton.click();await tick();
 check(questions.every(q=>!first.includes(q.id)),'Retry reused question set');
 await answerSet(3);
 check(quizResultTitle.textContent.includes('Passed'),'Passing result not shown');
 await tick();const fieldNotes=document.getElementById('missionLearningSummary');check(fieldNotes&&fieldNotes.textContent.includes('What your quiz shows')&&fieldNotes.textContent.includes('What you can revisit'),'Mission learning summary missing');check(fieldNotes.querySelector('a[href*="reviewTopic="]'),'Learning summary omits topic-review action');check(!fieldNotes.querySelector('img'),'Summary interprets catalog text as HTML');check(fieldNotes.querySelector('.learning-summary-next')?.href.includes('chapter-challenge.html'),'All completed missions do not offer chapter challenge');

 check(quizResult.dataset.outcome==='passed'&&!missionRewardCard.hidden&&missionRewardCard.classList.contains('new-expedition-reward'),'New reward reveal missing');
 const savedReward=lastMissionReward,savedArtifact=lastArtifactResult;lastMissionReward=0;lastArtifactResult=null;displayMissionRewards();check(missionRewardCard.hidden&&!missionRewardCard.classList.contains('new-expedition-reward'),'Replay shows a new reward reveal');lastMissionReward=savedReward;lastArtifactResult=savedArtifact;displayMissionRewards();

 check(getComputedStyle(document.getElementById('reinforcePassedTopicsLink')).display!=='none','Passed reinforcement link remained hidden');
 check(document.getElementById('quizReinforcementSummary').textContent.includes('Mission complete')&&!document.getElementById('reinforcePassedTopicsLink').hidden,'Passing result hides reinforcement');
 check(new URL(document.getElementById('reinforcePassedTopicsLink').href).searchParams.get('mission')==='mission-1','Optional practice lost mission context');
 check(fixtureRecords.get('users/test').xp===25,'XP not awarded');
 check(lastArtifactResult.newlyEarned===true,'Artifact result lost');
 check(!fixtureDrafts.has('quizmission-1'),'Submitted quiz draft was not removed');
 check(fixtureRecords.has('studentProgress/test_mission-1'),'Mission not completed');
 globalThis.__lakbayExplorationPreview=true;showResult(100,5,true);
 check(quizResultTitle.textContent==='Preview: passing score'&&quizResultMessage.textContent.includes('does not complete')&&missionRewardCard.hidden,'Preview quiz incorrectly claims completion or rewards');
 globalThis.__lakbayExplorationPreview=false;showResult(60,3,true);
 let releaseLoad;
 fixtureLoadGate=new Promise(resolve=>{releaseLoad=resolve;});
 retryQuizButton.click();await tick();
 auth.currentUser=null;await fixtureAuthListener(null);
 releaseLoad();await tick();fixtureLoadGate=null;
 check(quizContent.hidden&&quizResult.hidden&&!questions.length,'Late load revealed signed-out quiz');
 auth.currentUser={uid:'test'};await fixtureAuthListener(auth.currentUser);await tick();
 check(!quizContent.hidden&&questions.length===5,'Fresh sign-in did not load quiz');
 let releaseSave;
 fixtureSaveGate=new Promise(resolve=>{releaseSave=resolve;});
 await answerSet(3);
 check(quizSubmitted&&quizResult.hidden,'Submission was not held pending');
 auth.currentUser=null;await fixtureAuthListener(null);
 releaseSave();await tick();fixtureSaveGate=null;
 check(quizContent.hidden&&quizResult.hidden&&!questions.length,'Late submission revealed signed-out result');
 check(fixtureRecords.get('users/test').xp===25,'Replay duplicated XP');
 const navigation=document.querySelector('nav[aria-label="Learning path"]');
 check(navigation&&navigation.querySelector('[aria-current="page"]'),'Current learning activity not labeled');
 check(new URL(navigation.querySelectorAll('a')[1].href).searchParams.get('chapter')==='c1','Learning navigation lost chapter context');
 document.getElementById('result').textContent='PASS: fail/retry/pass, rewards, load recovery, auth refresh and delayed load/save after sign-out';
})().catch(error=>{document.getElementById('result').textContent='FAIL: '+error.message;});
`;
page=page.replace('</body>','<output id="result">RUNNING</output><script type="module">'+script+'</script></body>');
const file=path.join(temp,'quiz.html');fs.writeFileSync(file,page);
const result=spawnSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--user-data-dir='+path.join(temp,'browser'),'--dump-dom','--virtual-time-budget=5000','file:///'+file.replaceAll('\\','/')+'?chapter=c1&mission=mission-1'],{encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024,windowsHide:true});
if(result.error)throw result.error;
const match=result.stdout.match(/<output id="result">([^<]+)<\/output>/);console.log(match?.[1]||'FAIL: browser returned no result');process.exitCode=match?.[1].startsWith('PASS:')?0:1;
