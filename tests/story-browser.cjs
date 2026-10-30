const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-story-'));
let html=fs.readFileSync(path.join(root,'pages/story.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
const style=['student.css','story.css','navy-gold-theme.css'].map(name=>fs.readFileSync(path.join(root,'css',name),'utf8')).join('\n');
const source=fs.readFileSync(path.join(root,'js/story.js'),'utf8').replace(/import[\s\S]*?from\s+["'][^"']+["'];/g,'').replace('const reviewTopic =','let reviewTopic =');
const tradeSource=fs.readFileSync(path.join(root,'js/story-trade.js'),'utf8').replace(/export /g,'');
const journalSource=fs.readFileSync(path.join(root,'js/evidence-journal.js'),'utf8').replace(/import[\s\S]*?from\s+["'][^"']+["'];/g,'').replace(/export /g,'');
const routeSource=fs.readFileSync(path.join(root,'js/story-route.js'),'utf8').replace(/export /g,'');
const script=`
${journalSource}
${routeSource}
let fixtureReviewSaveFails=false;const recordLessonReview=async()=>{if(fixtureReviewSaveFails)throw Error("Review save unavailable");return true;};
${tradeSource}
${fs.readFileSync(path.join(root,'js/learning-navigation.js'),'utf8').replace(/export /g,'')}


const auth={currentUser:{uid:'student'}},db={},aiAssistanceAvailable=false,requestAiAssistance=async()=>'';
class LearningAccessError extends Error{};const requireLearningAccess=async()=>{};
const fixtureScenes=[{id:'s1',status:'active',order:1,title:'First scene',content:'A long explanation '.repeat(50),exploreItems:[{title:'First clue',discovery:'Learn one idea'},{title:'Second clue',discovery:'Learn another idea'}],decisionSituation:'A community needs help',decisionQuestion:'What should you do?',decisionChoices:['Help','Ignore'],decisionCorrectAnswer:'Help',decisionExplanation:'Support the community',checkQuestion:'What did you learn?',checkChoices:['Correct','Other'],checkCorrectAnswer:'Correct',checkExplanation:'Review the concept'},{id:'s2',status:'active',order:2,title:'Second scene',content:'The story continues.'}];
let authListener, fixtureFailure=false, fixtureEmpty=false, fixtureGate=null;
const onAuthStateChanged=(_,fn)=>{authListener=fn;queueMicrotask(()=>fn(auth.currentUser));};
const collection=(_,name)=>({name}),where=(field,op,value)=>({field,value}),query=(ref,...filters)=>({...ref,filters}),doc=(_,name,id)=>({name,id});
const getDoc=async ref=>({exists:()=>true,data:()=>ref.name==='missions'?{title:'Test mission',chapterId:'c1',learningObjective:'Explain community cooperation',lessonRecap:'Recall the roles you explored.',xpReward:35}:{title:'Test chapter'}});
const requireMissionPolicy=(()=>{function requireMissionPolicy(quiz) {
    if (!Number.isInteger(quiz.questionCount) || quiz.questionCount < 1 || quiz.questionCount > 200 ||
        typeof quiz.passingScore !== 'number' || !Number.isFinite(quiz.passingScore) || quiz.passingScore < 0 || quiz.passingScore > 100 ||
        !Array.isArray(quiz.questionBlueprint) || !quiz.questionBlueprint.length ||
        quiz.questionBlueprint.some(slot => !slot || typeof slot.topic !== 'string' || !slot.topic.trim() ||
            typeof slot.difficulty !== 'string' || !slot.difficulty.trim() || !Number.isInteger(slot.count) || slot.count < 1) ||
        quiz.questionBlueprint.reduce((sum, slot) => sum + slot.count, 0) !== quiz.questionCount ||
        new Set(quiz.questionBlueprint.map(slot => JSON.stringify([slot.topic, slot.difficulty]))).size !== quiz.questionBlueprint.length) {
        throw new Error('This quiz needs a valid questionCount, passingScore and topic/difficulty questionBlueprint in Firestore.');
    }
    return quiz;
}
function shuffled(items, random) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
function selectMissionQuestions(bank, quiz, previousIds = [], random = Math.random, seenIds = previousIds) {
    requireMissionPolicy(quiz);
    const previous = new Set(previousIds), seen = new Set(seenIds), selected = [], ids = new Set();
    for (const slot of quiz.questionBlueprint) {
        const pool = bank.filter(q => q.status === 'active' && q.topic === slot.topic && q.difficulty === slot.difficulty && !ids.has(q.id));
        if (pool.length < slot.count) throw new Error('Not enough active questions for this quiz topic and difficulty coverage.');
        const candidates = [...shuffled(pool.filter(q => !seen.has(q.id)), random),
            ...shuffled(pool.filter(q => seen.has(q.id) && !previous.has(q.id)), random),
            ...shuffled(pool.filter(q => previous.has(q.id)), random)];
        for (const q of candidates.slice(0, slot.count)) { ids.add(q.id); selected.push(q); }
    }
    return { questions: shuffled(selected, random), repeatedQuestions: selected.filter(q => seen.has(q.id)).length };
}
function validateQuestionSet(bank, quiz, questionIds) {
    requireMissionPolicy(quiz);
    if (!Array.isArray(questionIds) || questionIds.length !== quiz.questionCount || new Set(questionIds).size !== questionIds.length) {
        throw new Error('Reload the mission quiz to get a complete question set.');
    }
    const byId = new Map(bank.filter(q => q.status === 'active').map(q => [q.id, q]));
    const selected = questionIds.map(id => byId.get(id));
    if (selected.some(q => !q) || quiz.questionBlueprint.some(slot => selected.filter(q => q.topic === slot.topic && q.difficulty === slot.difficulty).length !== slot.count)) {
        throw new Error('This quiz changed. Reload it before trying again.');
    }
    return selected;
}
function diagnoseMissionTopics(questions, answers) {
    return [...new Set(questions.filter(q => String(answers[q.id] || '').trim().toUpperCase() !== String(q.correctAnswer || '').trim().toUpperCase())
        .map(q => q.topic?.trim()).filter(Boolean))];
}
;return requireMissionPolicy;})();
const getDocs=async ref=>{if(ref.name==='quizzes'){if(fixtureFailure)throw Error('Offline');return{docs:[{data:()=>({status:'active',questionCount:5,passingScore:60,questionBlueprint:[{topic:'community',difficulty:'easy',count:5}]})}]};}const rows=fixtureEmpty?[]:[...fixtureScenes];if(fixtureGate)await fixtureGate;if(fixtureFailure)throw Error("Offline");return{forEach:fn=>rows.forEach(row=>fn({id:row.id,data:()=>row}))};};

const {draftStatus,restartControl}=(()=>{${fs.readFileSync(path.join(root,'js/learning-draft.js'),'utf8').replace(/import[\s\S]*?from\s+["'][^"']+["'];/g,'').replace(/export /g,'')};return {draftStatus,restartControl};})();
window.confirm=()=>true;
const fixtureDrafts=new Map(),fixtureDraftWrites=[];
const learningDraft=(kind,chapter,mission)=>{const key=kind+mission;let closed=false;return{read:async()=>fixtureDrafts.get(key)||null,save:state=>{if(!closed){fixtureDraftWrites.push(JSON.parse(JSON.stringify(state)));fixtureDrafts.set(key,JSON.parse(JSON.stringify(state)));}},clear:async()=>{closed=true;fixtureDrafts.delete(key);},close:()=>{closed=true;}};};
${fs.readFileSync(path.join(root,'js/quiz-draft-policy.js'),'utf8').replace(/export /g,'')}
${source}
(()=>{${fs.readFileSync(path.join(root,'js/page-transition.js'),'utf8')};initializeStudentMenu();})();
const tick=()=>new Promise(resolve=>setTimeout(resolve,50)),check=(value,message)=>{if(!value)throw Error(message);};
(async()=>{
 document.body.classList.add('authenticated');await tick();check(!storyContent.hidden,'Story did not load');
 check(continueStoryButton.disabled&&previousStoryButton.disabled,'Scene requirements bypassed');
 [...storyExploreChoices.querySelectorAll('button')].forEach(button=>button.click());
 const decision=[...storyDecisionChoices.querySelectorAll('button')];decision.find(b=>b.textContent.trim()==='Ignore').click();check(continueStoryButton.disabled,'Wrong decision unlocked scene');decision.find(b=>b.textContent.trim()==='Help').click();
 const checks=[...quickCheckChoices.querySelectorAll('button')];checks.find(b=>b.dataset.answer==='Other').click();check(continueStoryButton.disabled,'Wrong quick check unlocked scene');checks.find(b=>b.dataset.answer==='Correct').click();
 check(!continueStoryButton.disabled,'Completed activities did not unlock scene');continueStoryButton.click();check(currentSceneIndex===1&&!previousStoryButton.disabled,'Next scene failed');check(document.activeElement===sceneTitle,'New scene did not receive focus');
 fixtureScenes.forEach((scene,index)=>{fixtureScenes[index]=Object.fromEntries(Object.entries(scene).reverse());});
 await loadStory();check(currentSceneIndex===1,'Firestore field order reset the saved lesson scene');
 previousStoryButton.click();check(currentSceneIndex===0&&!continueStoryButton.disabled,'Previous scene lost completed activities');
 continueStoryButton.click();continueStoryButton.click();check(!storyCompleteSection.hidden&&storyReadingCard.hidden,'Story did not finish');
 await tick();check(document.getElementById('lessonQuizRequirements').textContent.includes('at least 3')&&!quizButton.disabled,'Configured quiz requirements missing');check(!document.getElementById('lessonQuizBriefing').hidden&&document.getElementById('lessonQuizBriefing').textContent.includes('35 XP')&&document.getElementById('lessonQuizBriefing').textContent.includes('3 of 5'),'Briefing lost configured reward or pass target');
 check(document.getElementById('lessonRecap').textContent.includes('Explain community cooperation'),'Firestore objective missing');
 fixtureFailure=true;await loadLessonQuizInfo();check(quizButton.disabled&&!document.getElementById('retryLessonQuizInfo').hidden,'Unavailable quiz not gated');
 fixtureFailure=false;document.getElementById('retryLessonQuizInfo').click();await tick();check(!quizButton.disabled,'Quiz details retry failed');
 const writesBeforeRecap=fixtureDraftWrites.length;
 await loadStory();await tick();
 check(fixtureDraftWrites.slice(writesBeforeRecap).every(state=>state.completed===true),'Recap refresh transiently saved unfinished state');
 check(!storyCompleteSection.hidden&&storyReadingCard.hidden&&!quizButton.disabled,'Completed lesson did not resume recap');
 document.getElementById('reviewCompletedLesson').click();
 check(currentSceneIndex===0&&!storyReadingCard.hidden&&storyCompleteSection.hidden&&!continueStoryButton.disabled,'Review did not preserve valid checks');
 check(quizButton.disabled,'Review left stale quiz entry enabled');
 check(document.documentElement.scrollWidth<=window.innerWidth+1,'Story overflows narrow viewport');
 document.getElementById('mobileMenuButton').click();check(document.querySelector('.sidebar').classList.contains('open'),'Mobile menu did not open');
 auth.currentUser=null;authListener(null);check(storyContent.hidden&&!scenes.length,'Sign-out retained story');
 check(retryStoryLoadButton.hidden,'Signed-out retry visible');
 auth.currentUser={uid:'student'};authListener(auth.currentUser);await tick();
 fixtureFailure=true;await loadStory();check(!storyError.hidden&&!retryStoryLoadButton.hidden,'Missing load retry');
 fixtureFailure=false;retryStoryLoadButton.click();await tick();check(!storyContent.hidden&&retryStoryLoadButton.hidden,'Retry failed');
 fixtureEmpty=true;await loadStory();check(!storyError.hidden&&!storyLoadPending,'Empty scenes blocked retry');
 fixtureEmpty=false;retryStoryLoadButton.click();await tick();check(!storyContent.hidden,'Empty scenes did not recover');
 let release;fixtureGate=new Promise(resolve=>{release=resolve;});const pending=loadStory();await tick();
 auth.currentUser=null;authListener(null);fixtureGate=null;
 fixtureScenes[0].title='Fresh session scene';
 auth.currentUser={uid:'student'};authListener(auth.currentUser);await tick();
 check(scenes[0].title==='Fresh session scene','Fresh session failed');
 scenes[0].title='Current session marker';release();await pending;
 check(scenes[0].title==='Current session marker','Old same-account response replaced fresh session');
 restartStoryButton.click();await tick();check(currentSceneIndex===0&&completedQuickChecks.size===0&&completedStoryDecisions.size===0,'Lesson restart did not reset checks');
 const navigation=document.querySelector('nav[aria-label="Learning path"]');
 check(navigation&&navigation.querySelector('[aria-current="page"]'),'Current learning activity not labeled');
 check(new URL(navigation.querySelectorAll('a')[1].href).searchParams.get('chapter')==='c1','Learning navigation lost chapter context');
 reviewTopic='trade';fixtureScenes[0].reviewTopics=['trade'];
 await loadStory();check(topicReviewMapped&&scenes.length===1,'Mapped topic did not isolate its teaching scene');
 check(document.getElementById('topicReviewNotice')&&!storyDraftReady,'Topic review missing or overwrites normal draft');
 check(!completedQuickChecks.size,'Reading review cleared understanding checks');
 storyCompleteSection.hidden=false;await loadLessonQuizInfo();check(quizButton.textContent.includes('Targeted Practice')&&!quizButton.disabled,'Review completion routes to quiz rather than practice');
 check(new URL(topicPracticeUrl(),'https://example.com').searchParams.get('topic')==='trade','Practice lost reviewed topic');
 fixtureReviewSaveFails=true;reviewSavePending=null;await loadLessonQuizInfo();
 check(!quizButton.disabled&&document.getElementById('lessonQuizRequirements').textContent.includes('could not save'),'Review save failure blocked practice or claimed a saved review');
 const handoff=new URL(topicPracticeUrl(),'https://example.test/');
 check(handoff.searchParams.get('topic')==='trade'&&handoff.searchParams.get('review')==='1','Lesson handoff lost targeted review context');
 fixtureReviewSaveFails=false;
 reviewTopic='not-configured';await loadStory();check(!topicReviewMapped&&scenes.length===fixtureScenes.length&&document.getElementById('topicReviewNotice').textContent.includes('not been configured'),'Unmapped topic pretended to have a scene');
 getCurrentScene().learningHelp={explanation:'Simple explanation <img src=x>',vocabulary:[{term:'Evidence',definition:'Information supporting an idea.'}],example:'A helpful example.',guidingQuestion:'What do the clues show?'};
 resetStoryAiExplanation();check(!storyAiExplainButton.hidden&&!storyAiExplainButton.disabled,'Authored help not available');storyAiExplainButton.click();check(!storyAiExplainResponse.hidden&&storyAiExplainResponse.textContent.includes('What do the clues show?')&&!storyAiExplainResponse.querySelector('img'),'Help unsafe or incomplete');storyAiExplainButton.click();check(storyAiExplainResponse.hidden,'Help does not toggle');delete getCurrentScene().learningHelp;resetStoryAiExplanation();check(storyAiExplainButton.hidden,'Missing help leaves broken button');
 const hostile='<img data-attack src=x onerror="window.storyAttack=1"><svg data-attack onload="window.storyAttack=1"></svg>',hostileId='chapter"&mission=forged#'+hostile;
 const navHost=document.createElement('section');document.body.append(navHost);mountLearningNavigation(navHost,hostile,'?'+new URLSearchParams({chapter:hostileId}));
 const navTarget=new URL(navHost.querySelectorAll('a')[1].href);
 check(navTarget.pathname.endsWith('/mission.html')&&navTarget.searchParams.get('chapter')===hostileId&&[...navTarget.searchParams].length===1&&!navTarget.hash,'Hostile chapter parameter changed learning navigation');
 displayStoryText({content:hostile});check(storyText.textContent===hostile,'Story text lost literal markup');
 for(const imageUrl of ['javascript:window.storyAttack=1','java\\tscript:window.storyAttack=1','data:image/svg+xml,<svg onload=alert(1)>','blob:https://example.test/unsafe','http://external.example/image.png']){
  check(!isSafeImageUrl(imageUrl),'Unsafe image URL accepted: '+imageUrl);
  displaySceneVisual({imageUrl});check(!storySceneImage.hasAttribute('src')&&!storyVisualFallback.hidden,'Unsafe scene image reached the DOM');
  displayStoryExplore({id:'hostile',exploreItems:[{title:hostile,discovery:hostile,icon:hostile,imageUrl}]});check(!storyExploreChoices.querySelector('img'),'Unsafe explore image reached the DOM');
 }
 for(const draft of ${JSON.stringify(require('../data/chapter2-scene-help-migration.json').writes)}){
  const help=draft.fields.learningHelp;getCurrentScene().learningHelp=help;resetStoryAiExplanation();
  check(!storyAiExplainButton.hidden,'Prepared help button missing: '+draft.path);storyAiExplainButton.click();
  check(!storyAiExplainResponse.hidden&&storyAiExplainResponse.textContent.includes(help.explanation)&&storyAiExplainResponse.textContent.includes(help.example)&&storyAiExplainResponse.textContent.includes(help.guidingQuestion),'Prepared worked help did not render: '+draft.path);
  check(help.vocabulary.every(word=>storyAiExplainResponse.textContent.includes(word.definition)),'Prepared vocabulary missing: '+draft.path);
  storyAiExplainButton.click();check(storyAiExplainResponse.hidden,'Prepared help did not close');
 }
 check(isSafeImageUrl('https://example.test/image.png')&&isSafeImageUrl('../assets/story/safe.svg'),'Valid authored image URL rejected');
 await tick();check(!document.querySelector('[data-attack]')&&window.storyAttack===undefined,'Story or learning navigation interpreted hostile markup');
 document.getElementById('result').textContent='PASS: interactive lesson, previous/next, completion, layout, load/empty-scene retry, session recovery, hostile navigation/text and unsafe image URLs';
})().catch(error=>{document.getElementById('result').textContent='FAIL: '+error.message;});
`;
html=html.replace('</head>','<style>'+style+'</style></head>').replace('</body>','<output id="result">RUNNING</output><script type="module">'+script+'</script></body>');
const file=path.join(temp,'story.html');fs.writeFileSync(file,html);
const result=spawnSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--window-size=390,844','--user-data-dir='+path.join(temp,'browser'),'--dump-dom','--virtual-time-budget=3000','file:///'+file.replaceAll('\\','/')+'?chapter=c1&mission=m1'],{encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024,windowsHide:true});
if(result.error)throw result.error;const match=result.stdout.match(/<output id="result">([^<]+)<\/output>/);console.log(match?.[1]||'FAIL: no browser result');process.exitCode=match?.[1].startsWith('PASS:')?0:1;
