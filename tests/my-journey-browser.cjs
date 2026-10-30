const fs=require('fs'),path=require('path'),os=require('os'),{spawnSync}=require('child_process');
const root=path.join(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-my-journey-'));
const source=name=>fs.readFileSync(path.join(root,'js',name),'utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];/g,'').replace(/export /g,'');
let html=fs.readFileSync(path.join(root,'pages/my-journey.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
const css=['student.css','my-journey.css','navy-gold-theme.css'].map(n=>fs.readFileSync(path.join(root,'css',n),'utf8').replace(/^\uFEFF/,'')).join('\n');
const script=`
${fs.readFileSync(path.join(root,'js/student-status.js'),'utf8').replace(/export /g,'')}

const auth={currentUser:{uid:'student'}},db={};let authListener,failCore=false,failOptional=false,failReviewEvents=false,gate=null;const practiceBankReads=[],catalogReads=[];
const records={eras:[{id:'e1',status:'active',title:'Early Philippine Communities',order:1}],chapters:[{id:'c1',eraId:'e1',status:'active',title:'Early Filipino Communities',order:1},{id:'c2',eraId:'e1',status:'active',title:'Culture and Community Life',order:2}],missions:[{id:'m1',chapterId:'c1',status:'active',title:'Life in the Barangay',order:1},{id:'m2',chapterId:'c1',status:'active',title:'Trade and Livelihood',introduction:'Continue exploring how early communities exchanged goods and met their daily needs.',order:2},{id:'m3',chapterId:'c2',status:'active',title:'Community Roles',order:1}],chapterChallenges:[{id:'final',chapterId:'c1',status:'active'}],studentChapterProgress:[],studentProgress:[{id:'p1',userId:'student',missionId:'m1',chapterId:'c1',completed:true}],studentQuizAttempts:[{id:'attempt1',attemptId:'attempt1',userId:'student',chapterId:'c1',missionId:'m2',passed:false,topicsForReview:['exchange'],completedAt:{toMillis:()=>100}}],studentLearningDrafts:[],studentPracticeProgress:[],practiceQuestions:[{id:'practice1',missionId:'m2',status:'active',topic:'exchange',topicLabel:'Trade and exchange',question:'Question'}]};
const collection=(_,name)=>({name}),where=(field,op,value)=>({field,value}),query=(ref,...filters)=>({...ref,filters});
const onAuthStateChanged=(_,fn)=>{authListener=fn;queueMicrotask(()=>fn(auth.currentUser));};
const instructionalSnapshot=(key,load)=>{catalogReads.push(key);return load();};
const getDocs=async ref=>{const rows=[...(records[ref.name]||[])];if(ref.name.startsWith('student')&&ref.filters?.[0]?.value!==auth.currentUser?.uid)throw Error('Missing owner query');if(ref.name==='practiceQuestions'){const scope=ref.filters?.find(f=>f.field==='missionId');if(!scope)throw Error('Unscoped practice bank');practiceBankReads.push(scope.value);}if(gate)await gate;if(failCore&&ref.name==='studentProgress')throw Error('Offline');if(failOptional&&ref.name==='studentPracticeProgress')throw Error('Offline');if(failReviewEvents&&ref.name==='studentReviewEvents')throw Error('Offline');return{docs:rows.filter(row=>(ref.filters||[]).every(f=>row[f.field]===f.value)).map(row=>({id:row.id,data:()=>row}))};};
${source('practice-review.js')}
${source('mission-review.js')}
${source('review-question-catalog.js')}
${source('student-journey.js')}
${source('journey-path.js')}
${source('my-journey.js')}
const tick=()=>new Promise(r=>setTimeout(r,70)),check=(ok,message)=>{if(!ok)throw Error(message);};
(async()=>{
 document.body.classList.add('authenticated');document.body.classList.remove('auth-checking');await tick();
 check(!page.hidden,'Journey did not load: '+status.textContent);
 check(catalogReads.join(',')==='chapters,eras,missions,chapterChallenges','Journey did not use the shared instructional cache for only catalog data');
 check(document.querySelector('#journeyNextAction .journey-action-button').textContent==='Review Missed Topic','Saved quiz diagnosis did not drive next step');
 check(document.querySelector('#journeyNextAction .journey-action-button').href.includes('reviewTopic=exchange'),'Next action skipped the diagnosed lesson topic');
 check(document.getElementById('journeyMissionCount').textContent==='1 / 3','Saved completion count wrong');
 check(document.getElementById('journeyReviewCount').textContent==='1'&&document.querySelector('#journeyReviewTopics a').href.includes('reviewTopic=exchange'),'Personal review missing');
 check(practiceBankReads.length===1&&practiceBankReads[0]==='m2','Review bank read more than the saved mission');
 const reviewPolicy={version:1,minDistinctQuestions:2,minCleanSessions:2,requiredDifficulty:'hard'};
 Object.assign(records.practiceQuestions[0],{difficulty:'easy',reviewEvidencePolicy:reviewPolicy});
 records.practiceQuestions.push({id:'practice2',missionId:'m2',status:'active',topic:'exchange',topicLabel:'Trade and exchange',question:'A harder question',difficulty:'hard',reviewEvidencePolicy:reviewPolicy});
 records.studentPracticeProgress.push({id:'session1',userId:'student',missionId:'m2',completedAt:{toMillis:()=>200},questionResults:[{questionId:'practice1',topic:'exchange',firstTryCorrect:true}]},{id:'session2',userId:'student',missionId:'m2',completedAt:{toMillis:()=>300},questionResults:[{questionId:'practice2',topic:'exchange',firstTryCorrect:true}]});
 await loadJourneyPage();check(document.getElementById('journeyReviewCount').textContent==='0'&&document.querySelector('#journeyReviewTopics [data-state="practice-goal-reached"]')?.textContent.includes('Practice goal reached'),'Reached practice goal was not explained');
 records.studentPracticeProgress=[];records.practiceQuestions.splice(1);delete records.practiceQuestions[0].reviewEvidencePolicy;
 await loadJourneyPage();
 check(document.querySelectorAll('.journey-chapter').length===2&&document.querySelector('.journey-chapter').open,'Path does not expand current chapter');
 check(![...document.querySelectorAll('#journeyPath a')].some(a=>a.href.includes('mission=m3')),'Locked chapter exposed an activity link');
 records.missions[0].title='Title <img src=x onerror=bad>';await loadJourneyPage();check(document.getElementById('journeyPath').textContent.includes('<img src=x')&&!document.querySelector('#journeyPath img'),'Catalog text interpreted as HTML');records.missions[0].title='Life in the Barangay';
 records.studentLearningDrafts=[{id:'draft',userId:'student',kind:'quiz',chapterId:'c1',missionId:'m2',state:{attemptId:'new-attempt'},updatedAt:{toMillis:()=>200}}];await loadJourneyPage();check(document.querySelector('#journeyNextAction .journey-action-button').textContent==='Resume Quiz','Quiz resume did not reuse existing recommendation logic');records.studentLearningDrafts=[];
 failOptional=true;await loadJourneyPage();check(!page.hidden&&document.getElementById('journeyReviewCount').textContent==='Unavailable'&&status.textContent.includes('Some resume'),'Optional read failure blocked path or invented review count');failOptional=false;
 failReviewEvents=true;await loadJourneyPage();check(!page.hidden&&document.getElementById('journeyReviewCount').textContent==='Unavailable'&&!document.querySelector('#journeyReviewTopics a'),'Missing lesson events fabricated review stage');failReviewEvents=false;
 failCore=true;await loadJourneyPage();check(page.hidden&&!refresh.disabled&&status.textContent.includes('could not load'),'Core error lacks recovery');failCore=false;refresh.click();await tick();check(!page.hidden,'Refresh retry failed');
 records.eras.push({id:'e2',status:'active',title:'Later era',order:2,requiredChapterIds:['c1','c2'],unlockMessage:'Complete Early Philippine Communities first.'});
 records.chapters.push({id:'later',eraId:'e2',status:'active',title:'Later chapter',order:1});
 records.missions.push({id:'old-complete',chapterId:'later',status:'active',title:'Completed before chronology',order:1},{id:'new-locked',chapterId:'later',status:'active',title:'New work',order:2});
 records.studentProgress.push({id:'old',userId:'student',missionId:'old-complete',chapterId:'later',completed:true});
 await loadJourneyPage();check(document.querySelector('.journey-era-requirement').textContent.includes('Complete Early'),'Era requirement not explained');
 check([...document.querySelectorAll('#journeyPath a')].some(a=>a.href.includes('mission=old-complete')),'Completed lesson review disappeared');
 check(![...document.querySelectorAll('#journeyPath a')].some(a=>a.href.includes('mission=new-locked')),'New lesson bypassed era prerequisites');
 let release;gate=new Promise(r=>release=r);const old=loadJourneyPage();await tick();auth.currentUser=null;authListener(null);gate=null;release();await old;check(page.hidden&&!document.getElementById('journeyPath').children.length,'Stale load restored signed-out progress');
 auth.currentUser={uid:'student'};authListener(auth.currentUser);await tick();check(!page.hidden,'Fresh login did not restore journey');
 check(document.querySelector('.journey-era h3 a')?.href.includes('era=e1'),'Era overview link missing from learning path');
 records.studentChapterProgress=[{userId:'student',chapterId:'c1',completed:true,completedAt:{toMillis:()=>10}},{userId:'student',chapterId:'c2',completed:true,completedAt:{toMillis:()=>20}},{userId:'student',chapterId:'later',completed:true,completedAt:{toMillis:()=>30}}];
 records.studentProgress.push({userId:'student',missionId:'m2',chapterId:'c1',completed:true},{userId:'student',missionId:'m3',chapterId:'c2',completed:true},{userId:'student',missionId:'new-locked',chapterId:'later',completed:true});
 await loadJourneyPage();
 check(document.querySelector('#journeyNextAction .journey-completion-stats'),'Completed path did not show saved summary');
 check(document.querySelector('.journey-chapter[open] .journey-chapter-name')?.textContent==='Later chapter','Latest finished chapter was not expanded');
 check([...document.querySelectorAll('.journey-era h3 a')].some(a=>new URL(a.href).searchParams.get('era')==='e2'),'Second era overview link missing');
 check(document.documentElement.scrollWidth<=window.innerWidth,'Desktop journey overflows');
 const heroStyle=getComputedStyle(document.querySelector('.journey-page-heading>a'));
 const luminance=color=>color.match(/[0-9.]+/g).slice(0,3).map(Number).map(value=>{value/=255;return value<=.04045?value/12.92:((value+.055)/1.055)**2.4;}).reduce((total,value,index)=>total+value*[.2126,.7152,.0722][index],0);
 const foreground=luminance(heroStyle.color),background=luminance(heroStyle.backgroundColor);
 check((Math.max(foreground,background)+.05)/(Math.min(foreground,background)+.05)>=4.5,'Explore Chapters button text blends into its background');
 if(${process.argv.includes('--visual-review')}){
  records.chapters.forEach(row=>row.title='Mga Pamayanang Pilipino: Kabuhayan, Kalakalan, Paniniwala at Pakikipagkapwa');
  records.missions.forEach(row=>row.title='Pagtuklas sa mga Kaugalian at Ugnayan ng mga Sinaunang Pamayanan sa Kapuluan');
  document.documentElement.dataset.studentTextSize='larger';await loadJourneyPage();
  document.querySelectorAll('.journey-chapter').forEach(node=>node.open=true);
  check(document.documentElement.scrollWidth<=innerWidth+1,'Long journey titles overflow desktop');
 }
 document.getElementById('result').textContent='PASS: personal path, prerequisites, review/resume, safe text, error/retry and session recovery';
})().catch(e=>document.getElementById('result').textContent='FAIL: '+e.message);
`;
html=html.replace('</head>','<style>'+css+'</style></head>').replace('</body>','<output id="result">RUNNING</output><script type="module">'+script+'</script></body>');
const file=path.join(temp,'journey.html'),screenshot=path.join(temp,'journey.png');fs.writeFileSync(file,html);
const r=spawnSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--window-size=1440,1200','--user-data-dir='+path.join(temp,'browser'),'--screenshot='+screenshot,'--dump-dom','--virtual-time-budget=4000','file:///'+file.replaceAll('\\','/')],{encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024,windowsHide:true});
if(r.error)throw r.error;const result=r.stdout.match(/<output id="result">([^<]+)<\/output>/)?.[1];console.log(result||'FAIL: no browser result');console.log('Screenshot: '+screenshot);process.exitCode=result?.startsWith('PASS:')?0:1;
