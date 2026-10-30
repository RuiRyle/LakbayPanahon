const fs=require('fs'),path=require('path'),os=require('os'),{spawnSync}=require('child_process');
const root=path.join(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-my-journey-'));
const source=name=>fs.readFileSync(path.join(root,'js',name),'utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];/g,'').replace(/export /g,'');
let html=fs.readFileSync(path.join(root,'pages/my-journey.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
const css=['student.css','my-journey.css'].map(n=>fs.readFileSync(path.join(root,'css',n),'utf8').replace(/^\uFEFF/,'')).join('\n');
const script=`
const auth={currentUser:{uid:'student'}},db={};let authListener,failCore=false,failOptional=false,gate=null;
const records={eras:[{id:'e1',status:'active',title:'Early Philippine Communities',order:1}],chapters:[{id:'c1',eraId:'e1',status:'active',title:'Early Filipino Communities',order:1},{id:'c2',eraId:'e1',status:'active',title:'Culture and Community Life',order:2}],missions:[{id:'m1',chapterId:'c1',status:'active',title:'Life in the Barangay',order:1},{id:'m2',chapterId:'c1',status:'active',title:'Trade and Livelihood',introduction:'Continue exploring how early communities exchanged goods and met their daily needs.',order:2},{id:'m3',chapterId:'c2',status:'active',title:'Community Roles',order:1}],chapterChallenges:[{id:'final',chapterId:'c1',status:'active'}],studentChapterProgress:[],studentProgress:[{id:'p1',userId:'student',missionId:'m1',chapterId:'c1',completed:true}],studentQuizAttempts:[{id:'attempt1',attemptId:'attempt1',userId:'student',chapterId:'c1',missionId:'m2',passed:false,topicsForReview:['exchange'],completedAt:{toMillis:()=>100}}],studentLearningDrafts:[],studentPracticeProgress:[],practiceQuestions:[{id:'practice1',missionId:'m2',status:'active',topic:'exchange',topicLabel:'Trade and exchange',question:'Question'}]};
const collection=(_,name)=>({name}),where=(field,op,value)=>({field,value}),query=(ref,...filters)=>({...ref,filters});
const journalAuthListeners=[];const onAuthStateChanged=(_,fn)=>{journalAuthListeners.push(fn);authListener=user=>journalAuthListeners.forEach(listener=>listener(user));queueMicrotask(()=>fn(auth.currentUser));};
const getDocs=async ref=>{const rows=[...(records[ref.name]||[])];if(ref.name.startsWith('student')&&ref.filters?.[0]?.value!==auth.currentUser?.uid)throw Error('Missing owner query');if(gate)await gate;if(failCore&&ref.name==='studentProgress')throw Error('Offline');if(failOptional&&ref.name==='studentPracticeProgress')throw Error('Offline');return{docs:rows.map(row=>({id:row.id,data:()=>row}))};};
${source('practice-review.js')}
${source('mission-review.js')}
${source('student-journey.js')}
${source('journey-path.js')}
${source('my-journey.js')}
${source('evidence-journal.js')}
${source('evidence-journal-page.js')}
const doc=(_,name,id)=>({name,id});
const getDoc=async ref=>{const row=(records[ref.name]||[]).find(r=>r.id===ref.id);return{id:ref.id,exists:()=>!!row,data:()=>row};};
const deleteDoc=async ref=>{records[ref.name]=records[ref.name].filter(r=>r.id!==ref.id);};
const tick=()=>new Promise(r=>setTimeout(r,70)),check=(ok,message)=>{if(!ok)throw Error(message);};
(async()=>{
 document.body.classList.add('authenticated');document.body.classList.remove('auth-checking');await tick();
 check(!page.hidden,'Journey did not load: '+status.textContent);
 check(document.querySelector('#journeyNextAction .journey-action-button').textContent==='Practise Weak Topics','Saved quiz diagnosis did not drive next step');
 check(document.getElementById('journeyMissionCount').textContent==='1 / 3','Saved completion count wrong');
 check(document.getElementById('journeyReviewCount').textContent==='1'&&document.querySelector('#journeyReviewTopics a').href.includes('reviewTopic=exchange'),'Personal review missing');
 check(document.querySelectorAll('.journey-chapter').length===2&&document.querySelector('.journey-chapter').open,'Path does not expand current chapter');
 check(![...document.querySelectorAll('#journeyPath a')].some(a=>a.href.includes('mission=m3')),'Locked chapter exposed an activity link');
 records.missions[0].title='Title <img src=x onerror=bad>';await loadJourneyPage();check(document.getElementById('journeyPath').textContent.includes('<img src=x')&&!document.querySelector('#journeyPath img'),'Catalog text interpreted as HTML');records.missions[0].title='Life in the Barangay';
 records.studentLearningDrafts=[{id:'draft',userId:'student',kind:'quiz',chapterId:'c1',missionId:'m2',state:{attemptId:'new-attempt'},updatedAt:{toMillis:()=>200}}];await loadJourneyPage();check(document.querySelector('#journeyNextAction .journey-action-button').textContent==='Resume Quiz','Quiz resume did not reuse existing recommendation logic');records.studentLearningDrafts=[];
 failOptional=true;await loadJourneyPage();check(!page.hidden&&document.getElementById('journeyReviewCount').textContent==='Unavailable'&&status.textContent.includes('Some resume'),'Optional read failure blocked path or invented review count');failOptional=false;
 failCore=true;await loadJourneyPage();check(page.hidden&&!refresh.disabled&&status.textContent.includes('could not load'),'Core error lacks recovery');failCore=false;refresh.click();await tick();check(!page.hidden,'Refresh retry failed');
 let release;gate=new Promise(r=>release=r);const old=loadJourneyPage();await tick();auth.currentUser=null;authListener(null);gate=null;release();await old;check(page.hidden&&!document.getElementById('journeyPath').children.length,'Stale load restored signed-out progress');
 auth.currentUser={uid:'student'};authListener(auth.currentUser);await tick();check(!page.hidden,'Fresh login did not restore journey');
 records.storyScenes=[{id:'s1',missionId:'m1',status:'active',reviewTopics:['t'],exploreItems:[{title:'Clue <img src=x>',discovery:'An authored observation'}]}];records.studentEvidenceJournal=[{id:'student_s1_0',userId:'student',chapterId:'c1',missionId:'m1',sceneId:'s1',clueIndex:0}];await loadEvidenceJournal();check(document.querySelectorAll('.evidence-journal-card').length===1,'Saved clue not rendered');check(journalHost.textContent.includes('An authored observation')&&!journalHost.querySelector('img'),'Journal text unsafe or missing');check(journalHost.querySelector('a').href.includes('reviewTopic=t'),'Journal return link lost teaching topic');journalHost.querySelector('button').click();await tick();check(!records.studentEvidenceJournal.length&&!journalHost.querySelector('article'),'Journal deletion failed');
 check(document.documentElement.scrollWidth<=window.innerWidth,'Desktop journey overflows');
 document.getElementById('result').textContent='PASS: journal read, safe authored content, lesson link and removal; journey recovery';
})().catch(e=>document.getElementById('result').textContent='FAIL: '+e.message);
`;
html=html.replace('</head>','<style>'+css+'</style></head>').replace('</body>','<output id="result">RUNNING</output><script type="module">'+script+'</script></body>');
const file=path.join(temp,'journey.html'),screenshot=path.join(temp,'journey.png');fs.writeFileSync(file,html);
const r=spawnSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--window-size=1440,1200','--user-data-dir='+path.join(temp,'browser'),'--screenshot='+screenshot,'--dump-dom','--virtual-time-budget=4000','file:///'+file.replaceAll('\\','/')],{encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024,windowsHide:true});
if(r.error)throw r.error;const result=r.stdout.match(/<output id="result">([^<]+)<\/output>/)?.[1];console.log(result||'FAIL: no browser result');console.log('Screenshot: '+screenshot);process.exitCode=result?.startsWith('PASS:')?0:1;
