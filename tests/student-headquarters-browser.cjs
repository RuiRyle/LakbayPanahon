// Current renderers and page styles. Synthetic fixtures, no Firebase or AI requests.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {pathToFileURL}=require('node:url');
const {runFixture}=require('./student-missing-features-browser.cjs');
const root=path.resolve(__dirname,'..'),folder=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-hq-'));
const source=file=>fs.readFileSync(path.join(root,'js',file),'utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g,'').replace(/export /g,'');
const catalog=require('../functions/audit-student-handoff.cjs').catalog().snapshot.collections;
const script=`
const auth={currentUser:{uid:'explorer'}},db={},onAuthStateChanged=()=>{},checks=[];
const check=(value,label)=>{if(!value)throw Error(label);checks.push(label);};
const records=${JSON.stringify({eras:catalog.eras,chapters:catalog.chapters,missions:catalog.missions,challenges:catalog.chapterChallenges||[],chapterProgress:[],missionProgress:[],attempts:[]})};
records.userId='explorer';
for(const chapterId of ['era1-prologue','chapter-1']){
 records.chapterProgress.push({userId:'explorer',chapterId,completed:true});
 for(const mission of records.missions.filter(row=>row.chapterId===chapterId))records.missionProgress.push({userId:'explorer',chapterId,missionId:mission.id,completed:true});
}
const partial=records.missions.filter(row=>row.chapterId==='chapter-2').sort((a,b)=>a.order-b.order)[0];
records.missionProgress.push({userId:'explorer',chapterId:'chapter-2',missionId:partial.id,completed:true});
${source('journey-path.js')}
${source('student-journey.js')}
${source('home-learning-trail.js')}
${source('explorer-art.js')}
${source('explorer-desk.js')}
${source('dashboard-expedition.js')}
${source('dashboard-collections.js')}
${source('return-to-learn.js')}
${source('student-profile.js')}
(async()=>{
 document.body.classList.add('authenticated');document.body.classList.remove('auth-checking');
 normalizeStudentTopbar({firstName:'Ana',xp:240,level:3});document.getElementById('studentFirstName').textContent='Ana';
 document.getElementById('studentXp').textContent='240 XP';document.getElementById('studentLevel').textContent='Level 3';document.getElementById('studentLevelStat').textContent='Level 3';
 document.getElementById('missionsCompleted').textContent=String(records.missionProgress.length);document.getElementById('badgesEarned').textContent='1';
 document.getElementById('levelProgressXp').textContent='40 / 100 XP';document.getElementById('nextLevelText').textContent='60 XP until Level 4';document.getElementById('levelProgressBar').style.width='40%';
 const state=resolveStudentJourney(records),host=document.getElementById('newJourneyState');renderStudentJourney(host,state);
 const original=host.querySelector('a.journey-action-button').href;renderDashboardExpedition(state,records.eras);
 check(host.querySelector('a.journey-action-button').href===original,'Presentation preserves the recommended lesson route');
 check(host.querySelector('a.journey-action-button').textContent==='Continue Learning','Normal ongoing lesson has a clear primary action');
 renderExplorerDesk(document.getElementById('explorerDesk'),state);renderHomeLearningTrail(document.getElementById('homeLearningTrail'),records,state);
 const rows=[...document.querySelectorAll('.home-lesson-row')];
 check(rows.length===4,'Journey preview stays bounded');check(rows[0].dataset.state==='complete'&&rows[1].dataset.state==='current'&&rows[2].dataset.state==='locked','Completed, current and locked states remain distinct');
 check(!rows[2].hasAttribute('href')&&new URL(rows[1].href).searchParams.get('chapter')==='chapter-2','Locked chapters remain noninteractive and accessible routes retain context');
 check(rows[1].textContent.includes(records.chapters.find(c=>c.id==='chapter-2').description),'Chapter preview retains its authored description');
 check(rows[1].querySelector('[role=progressbar]').getAttribute('aria-valuenow')==='1','Progress indicator uses owned saved mission data');
 const ownership=[{userId:'explorer',badgeId:'b1'},{userId:'other',badgeId:'b2'}],badges=[{id:'b1',name:'Community Explorer',status:'active',icon:'*'},{id:'b2',name:'Next chapter badge',status:'active',icon:'*'}];
 renderDashboardCollection(document.getElementById('homeBadgePreview'),badges,ownership,'explorer',collectionPreviews[0]);
 renderDashboardCollection(document.getElementById('homeArtifactPreview'),[{id:'a1',name:'Historical keepsake',icon:'◇'}],[{userId:'explorer',artifactId:'a1'}],'explorer',collectionPreviews[1]);
 check(document.querySelectorAll('#homeBadgePreview [data-state=earned]').length===1&&document.querySelectorAll('#homeBadgePreview [data-state=locked]').length===1,'Badge preview distinguishes owned and unearned items');
 check(document.querySelector('#homeArtifactPreview [data-state=earned]'),'Legacy artifact ownership appears without invented progress');
 const topic={missionId:partial.id,chapterId:'chapter-2',topic:'clues',label:'Reading historical clues',missionTitle:partial.title};
 const question={question:'Which information supports your explanation?',optionA:'A clue from the lesson',optionB:'An unrelated guess',optionC:'An empty page',optionD:'An unrelated image',correctAnswer:'A',explanation:'Connect your explanation to a relevant lesson clue.'};
 let nextCount=0;renderReturnToLearn(document.getElementById('studentReturnTopic'),topic,question,()=>nextCount++);
 document.querySelector('.return-recall-options button').click();
 check(document.querySelector('.return-recall-options button').dataset.result==='correct'&&document.querySelector('.return-recall-feedback').textContent.includes(question.explanation),'Recall preserves answer feedback and authored explanation');
 check([...document.querySelectorAll('.return-recall-options button')].every(button=>button.disabled),'Recall cannot accept duplicate answers');
 check(new URL(document.querySelector('.return-topic-actions a').href).searchParams.get('reviewTopic')==='clues','Recall navigation keeps the teaching topic');
 const next=[...document.querySelectorAll('.return-recall-check button')].find(button=>button.textContent==='Another Memory Clue');next.click();check(nextCount===1,'Next recall clue uses the existing callback');
 const reward=document.getElementById('dailyChallengeCardReward');reward.textContent='+15 XP';reward.parentElement.hidden=false;const daily=document.getElementById('dailyChallengeStart');daily.disabled=false;daily.textContent='Start Daily Challenge';
 check(document.querySelectorAll('.hq-bayani-prompts a').length===2,'Bayani provides distinct question suggestions');
 check(document.getElementById('dailyChallengeModal')&&document.getElementById('dailyChallengeSubmit'),'Daily challenge modal and submission controls are retained');
 check(document.querySelectorAll('#explorerDesk a').length===3&&document.querySelectorAll('.home-destinations a').length===2,'Learning tools and class navigation remain available');
 document.getElementById('studentReviewTopics').textContent='Your saved quizzes and practice currently show no topics needing extra review.';
 check(document.documentElement.scrollWidth<=innerWidth+1,'Headquarters fits the viewport');
 const originalTitle=rows[1].querySelector('h3').textContent;rows[1].querySelector('h3').textContent='Pakikipag-ugnayan at Pakikipagkalakalan ng mga Sinaunang Pamayanang Pilipino';
 check(document.documentElement.scrollWidth<=innerWidth+1,'Long chapter titles remain readable without page overflow');rows[1].querySelector('h3').textContent=originalTitle;
 check(getComputedStyle(document.querySelector('.journey-quest-card')).display==='block'&&getComputedStyle(document.querySelector('.home-discover')).display==='grid','Legacy layout rules cannot split the primary card or activity sidebar');
 await new Promise(resolve=>setTimeout(resolve,650));
 if(innerWidth>1000){
  const trail=document.querySelector('.home-learning-trail'),activities=document.querySelector('.home-discover');
  const trailHeading=trail.querySelector('.home-learning-heading').getBoundingClientRect(),activityHeading=activities.querySelector('.home-section-title').getBoundingClientRect();
  check(Math.abs(trailHeading.top-activityHeading.top)<=1&&Math.abs(trailHeading.bottom-activityHeading.bottom)<=1,'Paired section headers align at top and bottom');
  const firstLesson=trail.querySelector('.home-lesson-row').getBoundingClientRect(),firstActivity=activities.querySelector('.dashboard-card').getBoundingClientRect();
  check(Math.abs(firstLesson.top-firstActivity.top)<=1,'Journey and activity cards begin on the same baseline');
  check(Math.abs(trail.getBoundingClientRect().bottom-activities.getBoundingClientRect().bottom)<=1,'Journey and supporting activity sections share a bottom edge');
  const collections=document.getElementById('achievements').getBoundingClientRect(),recall=document.querySelector('.return-to-learn-panel').getBoundingClientRect();
  check(Math.abs(collections.top-recall.top)<=1&&Math.abs(collections.bottom-recall.bottom)<=1,'Collection and recall panel edges align');
 }
 const lessonBox=host.getBoundingClientRect(),artBox=document.getElementById('homeExpeditionArt').getBoundingClientRect();
 check(innerWidth<=650?artBox.bottom<=lessonBox.top+1:lessonBox.right<=artBox.left+1,'Current lesson and illustration occupy their intended responsive columns');
 document.documentElement.dataset.studentTextSize='larger';check(document.documentElement.scrollWidth<=innerWidth+1,'Larger student text fits the viewport');delete document.documentElement.dataset.studentTextSize;
 document.body.classList.add('lakbay-reduce-motion');check(getComputedStyle(rows[1],'::before').animationName==='none','Reduced-motion preference stops trail animation');document.body.classList.remove('lakbay-reduce-motion');
 const recovery={...state,kind:'mission',draft:{kind:'quiz'}};renderStudentJourney(host,recovery);const quiz=host.querySelector('a.journey-action-button').href;renderDashboardExpedition(recovery,records.eras);check(host.querySelector('a.journey-action-button').textContent==='Resume Quiz'&&host.querySelector('a.journey-action-button').href===quiz,'Quiz-resume label and route are never disguised as a lesson');
 renderStudentJourney(host,state);renderDashboardExpedition(state,records.eras);
 document.querySelector('.hq-learning-grid').scrollIntoView({block:'start'});await new Promise(resolve=>setTimeout(resolve,650));document.getElementById('fixtureResult').textContent='PASS: '+checks.length+' headquarters checks at '+innerWidth+'px';
})().catch(error=>document.getElementById('fixtureResult').textContent='FAIL: '+error.stack);
`;
(async()=>{
 for(const width of [1440,1024,768,390,320]){
  let html=fs.readFileSync(path.join(root,'pages/student-dashboard.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
  html=html.replace(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/g,(_,href)=>{const file=path.resolve(root,'pages',href);return '<style>'+fs.readFileSync(file,'utf8').replace(/url\(['"]?([^)'"\s]+)['"]?\)/g,(all,url)=>url.startsWith('data:')?all:'url("'+pathToFileURL(path.resolve(path.dirname(file),url)).href+'")')+'</style>';});
  html=html.replace('<head>','<head><base href="'+pathToFileURL(path.join(root,'pages')).href+'/">').replace('</body>','<output id="fixtureResult">RUNNING</output><script type="module">'+script+'</script></body>');
  const file=path.join(folder,'headquarters-'+width+'.html');fs.writeFileSync(file,html);const result=await runFixture(file,width);console.log(result);if(!result?.startsWith('PASS:'))process.exitCode=1;
 }console.log('Screenshots: '+folder);
})().catch(error=>{console.error(error);process.exitCode=1;});
