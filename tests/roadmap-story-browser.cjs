const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-story-'));
const desktopArgument=process.argv.find(arg=>arg.startsWith('--desktop-review=')),reviewChapter=desktopArgument?Number(desktopArgument.split('=')[1]):null;
if(desktopArgument&&![2,3,4].includes(reviewChapter))throw Error('Choose --desktop-review=2, 3 or 4');
let desktopScenes=[],desktopMission=null;
if(desktopArgument){
 const {catalog}=require('../functions/student-content-candidate-local.cjs').buildCandidateCatalog();
 const missions=[...catalog].filter(([key,row])=>key.startsWith('missions/')&&row.status==='active'&&['chapter-2','chapter-3','chapter-4'].includes(row.chapterId)).map(([,row])=>row);
 const byId=new Map(missions.map(row=>[row.id,row]));
 desktopScenes=[...catalog].filter(([key,row])=>key.startsWith('storyScenes/')&&row.status==='active'&&byId.has(row.missionId)).map(([,row])=>({...row,fixtureChapterId:byId.get(row.missionId).chapterId}));
 desktopMission=missions.filter(row=>row.chapterId==='chapter-'+reviewChapter).sort((a,b)=>a.order-b.order)[0];
 for(const scene of desktopScenes){
  if(!scene.imageUrl?.startsWith('../assets/'))continue;
  const relative=scene.imageUrl.slice(3),sourceImage=path.resolve(root,relative),relativeAsset=path.relative(path.join(root,'assets'),sourceImage);
  if(relativeAsset.startsWith('..')||path.isAbsolute(relativeAsset))throw Error('Asset escaped assets directory');
  const target=path.join(temp,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(sourceImage,target);
 }
}
let html=fs.readFileSync(path.join(root,'pages/story.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
const style=['student.css','story.css','navy-gold-theme.css','page-transition.css'].map(name=>fs.readFileSync(path.join(root,'css',name),'utf8')).join('\n');
const source=fs.readFileSync(path.join(root,'js/story.js'),'utf8').replace(/import[\s\S]*?from\s+["'][^"']+["'];/g,'').replace('const reviewTopic =','let reviewTopic =');
const roadmapScenes=require('../data/roadmap-chapter34-migration.json').writes.filter(w=>w.path.startsWith('storyScenes/')&&w.fields.missionId).map(w=>({id:w.path.split('/')[1],...w.fields}));
for(const write of require('../data/chapter3-decision-quality-migration.json').writes){const scene=roadmapScenes.find(row=>'storyScenes/'+row.id===write.path);if(!scene)throw Error('Decision draft scene missing');Object.assign(scene,write.fields);}
for(const write of require('../data/chapter4-learning-polish-migration.json').writes){const scene=roadmapScenes.find(row=>'storyScenes/'+row.id===write.path);if(!scene)throw Error('Chapter 4 draft scene missing');Object.assign(scene,write.fields);}
const tradeSource=fs.readFileSync(path.join(root,'js/story-trade.js'),'utf8').replace(/export /g,'');
const journalSource=fs.readFileSync(path.join(root,'js/evidence-journal.js'),'utf8').replace(/import[\s\S]*?from\s+["'][^"']+["'];/g,'').replace(/export /g,'');
const routeSource=fs.readFileSync(path.join(root,'js/story-route.js'),'utf8').replace(/export /g,'');
const transitionSource=fs.readFileSync(path.join(root,'js/page-transition.js'),'utf8');
const menuStart=transitionSource.indexOf('function initializeStudentMenu()'),menuEnd=transitionSource.indexOf("if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initializeStudentMenu");
if(menuStart<0||menuEnd<=menuStart)throw Error('Shared menu fixture boundary changed');
const script=`
${journalSource}
${routeSource}
const recordLessonReview=async()=>true;
${tradeSource}
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


const auth={currentUser:{uid:'student'}},db={},aiAssistanceAvailable=false,requestAiAssistance=async()=>'';
class LearningAccessError extends Error{};const requireLearningAccess=async()=>{};
const fixtureScenes=[{id:'s1',status:'active',order:1,title:'First scene',content:'A long explanation '.repeat(50),exploreItems:[{title:'First clue',discovery:'Learn one idea'},{title:'Second clue',discovery:'Learn another idea'}],decisionSituation:'A community needs help',decisionQuestion:'What should you do?',decisionChoices:['Help','Ignore'],decisionCorrectAnswer:'Help',decisionExplanation:'Support the community',checkQuestion:'What did you learn?',checkChoices:['Correct','Other'],checkCorrectAnswer:'Correct',checkExplanation:'Review the concept'},{id:'s2',status:'active',order:2,title:'Second scene',content:'The story continues.'}];
let authListener, fixtureFailure=false, fixtureEmpty=false, fixtureGate=null;
const onAuthStateChanged=(_,fn)=>{authListener=fn;queueMicrotask(()=>fn(auth.currentUser));};
const collection=(_,name)=>({name}),where=(field,op,value)=>({field,value}),query=(ref,...filters)=>({...ref,filters}),doc=(_,name,id)=>({name,id});
const getDoc=async ref=>({exists:()=>true,data:()=>ref.name==='missions'?(${Boolean(desktopArgument)}?${JSON.stringify(desktopMission)}:{title:'Test mission',chapterId:'c1',learningObjective:'Explain community cooperation',lessonRecap:'Recall the roles you explored.'}):{title:'Test chapter'}});
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

const restartControl=(container,label,restart)=>{const button=document.createElement('button');button.hidden=true;button.addEventListener('click',async()=>{if(window.confirm('Restart?'))await restart();});container.prepend(button);return button;};
window.confirm=()=>true;
const fixtureDrafts=new Map(),fixtureDraftWrites=[];
const draftStatus=container=>{const p=document.createElement('p');p.retryButton=document.createElement('button');p.retryButton.hidden=true;container.prepend(p,p.retryButton);return p;};
const learningDraft=(kind,chapter,mission)=>{const key=kind+mission;let closed=false;return{read:async()=>fixtureDrafts.get(key)||null,save:state=>{if(!closed){fixtureDraftWrites.push(JSON.parse(JSON.stringify(state)));fixtureDrafts.set(key,JSON.parse(JSON.stringify(state)));}},clear:async()=>{closed=true;fixtureDrafts.delete(key);},close:()=>{closed=true;}};};
${fs.readFileSync(path.join(root,'js/quiz-draft-policy.js'),'utf8').replace(/export /g,'')}
${source}
(()=>{${transitionSource.slice(menuStart,menuEnd)};initializeStudentMenu();})();
const tick=()=>new Promise(resolve=>setTimeout(resolve,50)),check=(value,message)=>{if(!value)throw Error(message);};
(async()=>{
 if(${Boolean(desktopArgument)}){
  document.body.classList.add('authenticated');await tick();
  check(!storyContent.hidden&&!storyReadingCard.hidden,'Desktop lesson remains behind an error/loading state: '+storyError.textContent);
  scenes=${JSON.stringify(desktopScenes)};document.documentElement.dataset.studentTextSize='larger';document.body.classList.add('lakbay-reduce-motion');
  let scrollBehavior;scrollToSection({scrollIntoView:options=>{scrollBehavior=options.behavior;}});check(scrollBehavior==='auto','Website reduced-motion preference still triggers smooth story scrolling');
  for(let i=0;i<scenes.length;i++){
   currentSceneIndex=i;displayScene();
   check(sceneTitle.textContent===getCurrentScene().title&&storyText.textContent.trim(),'Candidate scene title/body missing: '+getCurrentScene().id);
   check(document.documentElement.scrollWidth<=innerWidth+1,'Candidate scene overflows desktop: '+getCurrentScene().id);
   const columns=['.story-header','.story-progress','.story-reading-card'].map(selector=>document.querySelector(selector).getBoundingClientRect());
   check(columns.every(rect=>Math.abs(rect.left-columns[0].left)<=1&&Math.abs(rect.right-columns[0].right)<=1),'Heading, trail and lesson column are misaligned: '+getCurrentScene().id);
   if(getCurrentScene().learningHelp){storyAiExplainButton.click();check(!storyAiExplainResponse.hidden&&storyAiExplainResponse.textContent.includes(getCurrentScene().learningHelp.example),'Candidate help missing: '+getCurrentScene().id);storyAiExplainButton.click();}
  }
  const selectedMission=${JSON.stringify(desktopMission)};
  scenes=scenes.filter(scene=>scene.missionId===selectedMission.id).sort((a,b)=>a.order-b.order);currentSceneIndex=0;loadedStoryMission=selectedMission;displayScene();
  if(getCurrentScene().learningHelp)storyAiExplainButton.click();
  if(getCurrentScene().imageUrl){storySceneImage.loading='eager';await new Promise(resolve=>{const start=performance.now();function ready(){if(storySceneImage.naturalWidth>0&&!storySceneImage.hidden||performance.now()-start>2000)resolve();else setTimeout(ready,30);}ready();});check(storySceneImage.naturalWidth>0&&!storySceneImage.hidden,'Selected local scene image did not load');}
  check(!storyContent.hidden&&!storyReadingCard.hidden,'Desktop lesson was hidden after rendering');
  document.activeElement?.blur();window.scrollTo({top:0,behavior:'instant'});await new Promise(resolve=>setTimeout(resolve,300));
  document.getElementById('result').textContent='PASS: 58 local candidate scenes render with extra-large text and authored help; chapter '+${JSON.stringify(reviewChapter)}+' desktop image loaded';
  return;
 }
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
 await tick();check(document.getElementById('lessonQuizRequirements').textContent.includes('at least 3')&&!quizButton.disabled,'Configured quiz requirements missing');
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
 reviewTopic='not-configured';await loadStory();check(!topicReviewMapped&&scenes.length===fixtureScenes.length&&document.getElementById('topicReviewNotice').textContent.includes('not been configured'),'Unmapped topic pretended to have a scene');
 getCurrentScene().learningHelp={explanation:'Simple explanation <img src=x>',vocabulary:[{term:'Evidence',definition:'Information supporting an idea.'}],example:'A helpful example.',guidingQuestion:'What do the clues show?'};
 resetStoryAiExplanation();check(!storyAiExplainButton.hidden&&!storyAiExplainButton.disabled,'Authored help not available');storyAiExplainButton.click();check(!storyAiExplainResponse.hidden&&storyAiExplainResponse.textContent.includes('What do the clues show?')&&!storyAiExplainResponse.querySelector('img'),'Help unsafe or incomplete');storyAiExplainButton.click();check(storyAiExplainResponse.hidden,'Help does not toggle');delete getCurrentScene().learningHelp;resetStoryAiExplanation();check(storyAiExplainButton.hidden,'Missing help leaves broken button');
 reviewTopic='';scenes=${JSON.stringify(roadmapScenes)};
 for(let i=0;i<scenes.length;i++){currentSceneIndex=i;displayScene();check(sceneTitle.textContent===getCurrentScene().title,'Roadmap scene title missing');check(!storyExplore.hidden&&!storyDecision.hidden,'Roadmap interactions missing');check(storyExploreChoices.querySelectorAll('button').length===3,'Roadmap clues missing');check(storyDecisionChoices.querySelectorAll('button').length===4,'Roadmap decision choices missing');for(const clue of storyExploreChoices.querySelectorAll('button'))clue.click();const correct=[...storyDecisionChoices.querySelectorAll('button')].find(b=>b.textContent.includes(getCurrentScene().decisionCorrectAnswer));check(correct,'Roadmap correct choice not rendered');correct.click();check(completedStoryDecisions.has(getCurrentScene().id)&&!continueStoryButton.disabled,'Roadmap decision cannot complete');storyAiExplainButton.click();check(!storyAiExplainResponse.hidden,'Roadmap help missing');}
 document.getElementById('result').textContent='PASS: 40 roadmap scenes render, accept clue exploration and correct decisions, and show authored help; story recovery passes';
})().catch(error=>{document.getElementById('result').textContent='FAIL: '+error.message;});
`;
const errors="window.addEventListener('error',event=>{const result=document.getElementById('result');if(result)result.textContent='FAIL: '+event.message+' at line '+event.lineno; });window.addEventListener('unhandledrejection',event=>{const result=document.getElementById('result');if(result)result.textContent='FAIL: '+String(event.reason);});";
html=html.replace('</head>','<style>'+style+'</style><script>'+errors+'</script></head>').replace('</body>','<output id="result">RUNNING</output><script type="module">'+script+'</script></body>');
const folder=desktopArgument?path.join(temp,'pages'):temp;fs.mkdirSync(folder,{recursive:true});const file=path.join(folder,'story.html');fs.writeFileSync(file,html);
const screenshot=path.join(temp,'desktop-chapter-'+reviewChapter+'.png'),params=desktopArgument?new URLSearchParams({chapter:desktopMission.chapterId,mission:desktopMission.id}).toString():'chapter=c1&mission=m1';
const result=spawnSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',desktopArgument?'--window-size=1440,1800':'--window-size=390,844',...(desktopArgument?['--screenshot='+screenshot]:[]),'--user-data-dir='+path.join(temp,'browser'),'--dump-dom','--virtual-time-budget=10000','file:///'+file.replaceAll('\\','/')+'?'+params],{encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024,windowsHide:true});
if(result.error)throw result.error;const match=result.stdout.match(/<output id="result">([^<]+)<\/output>/);console.log(match?.[1]||'FAIL: no browser result');process.exitCode=match?.[1].startsWith('PASS:')?0:1;
if(desktopArgument){console.log('Screenshot: '+screenshot);fs.writeFileSync(path.join(root,'docs/validation/chapters234-desktop-'+reviewChapter+'-local.json'),JSON.stringify({checkedAt:new Date().toISOString(),status:process.exitCode===0?'pass':'fail',mode:'local-candidate-with-mocked-auth-and-data',scenes:desktopScenes.length,chapter:reviewChapter,selectedMission:desktopMission.id,screenshot,result:match?.[1],limits:['Candidate includes unpublished help/content drafts.','58 scenes checked for title/body/help and horizontal overflow; no claim that all activity completions were replayed.','One mission opening/image captured per chapter; other lesson states still require review.']},null,2)+'\n');}
