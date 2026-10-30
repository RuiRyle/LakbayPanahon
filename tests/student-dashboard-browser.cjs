const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-dashboard-'));
let html=fs.readFileSync(path.join(root,'pages/student-dashboard.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
const source=fs.readFileSync(path.join(root,'js/student-journey.js'),'utf8').replace(/export /g,'');
const css=['student.css','navy-gold-theme.css'].map(file=>fs.readFileSync(path.join(root,'css',file),'utf8')).join('\n');
const script=`
${source}
${fs.readFileSync(path.join(root,'js/journey-path.js'),'utf8').replace(/export /g,'')}
${fs.readFileSync(path.join(root,'js/home-learning-trail.js'),'utf8').replace(/import[^;]+;/g,'').replace(/export /g,'')}
const check=(value,message)=>{if(!value)throw new Error(message);};
const container=document.getElementById('newJourneyState');
const input={userId:'student',eras:[],chapters:[{id:'c 1&x',status:'active',title:'<img src=x onerror=alert(1)>',order:1}],missions:[{id:'m?1',chapterId:'c 1&x',status:'active',title:'First lesson',introduction:'A Firestore lesson'}],challenges:[{id:'ch1',chapterId:'c 1&x',status:'active'}],chapterProgress:[],missionProgress:[],attempts:[]};
(async()=>{
 renderStudentJourney(container,resolveStudentJourney(input));
 let action=container.querySelector('a');check(action.textContent==='Start Learning','Start action missing');
 let target=new URL(action.href);check(target.pathname.endsWith('story.html'),'Start did not open lesson');check(target.searchParams.get('chapter')==='c 1&x'&&target.searchParams.get('mission')==='m?1','Lesson parameters lost');
 check(!container.querySelector('img')&&container.textContent.includes('<img'),'Firestore title was injected as markup');
 const draft={id:'draft',userId:'student',chapterId:'c 1&x',missionId:'m?1',kind:'quiz',state:{attemptId:'draft-attempt'},updatedAt:{toMillis:()=>20}};
 renderStudentJourney(container,resolveStudentJourney({...input,drafts:[draft]}));
 check(container.querySelector('a').textContent==='Resume Quiz'&&container.querySelector('a').href.includes('quiz.html'),'Saved quiz resume route missing');
 renderStudentJourney(container,resolveStudentJourney({...input,drafts:[{...draft,kind:'story'}]}));
 check(container.querySelector('a').textContent==='Resume Lesson','Saved lesson resume action missing');
 renderStudentJourney(container,resolveStudentJourney({...input,drafts:[{...draft,kind:'practice',state:{sessionId:'pending-practice',topic:'Trade & travel'}}]}));
 check(container.querySelector('a').textContent==='Resume Practice'&&new URL(container.querySelector('a').href).searchParams.get('topic')==='Trade & travel','Practice resume lost saved topic');
 const attempt={id:'a1',userId:'student',chapterId:'c 1&x',missionId:'m?1',passed:false,topicsForReview:['trade'],completedAt:{toMillis:()=>10}};
 renderStudentJourney(container,resolveStudentJourney({...input,attempts:[attempt]}));
 check(container.querySelector('a').textContent==='Review Missed Topic'&&new URL(container.querySelector('a').href).searchParams.get('reviewTopic')==='trade','Failed quiz did not prioritize its teaching topic');
 check([...container.querySelectorAll('a')].some(a=>a.textContent==='Targeted Practice'&&new URL(a.href).searchParams.get('topic')==='trade'),'Targeted practice link missing');
 renderStudentJourney(container,resolveStudentJourney({...input,attempts:[attempt],drafts:[draft]}));
 check(container.querySelector('a').textContent==='Resume Quiz','Practice recommendation displaced active quiz');
 renderStudentJourney(container,resolveStudentJourney({...input,attempts:[attempt],drafts:[{...draft,kind:'story'}]}));
 check(container.querySelector('a').textContent==='Review Missed Topic'&&new URL(container.querySelector('a').href).searchParams.get('reviewTopic')==='trade','Lesson draft hid targeted lesson review');
 renderStudentJourney(container,resolveStudentJourney({...input,attempts:[attempt],reviewTopics:[]}));
 check(container.querySelector('a').textContent==='Retry Mission Quiz','Resolved practice did not prioritize quiz retry');
 check(container.textContent.includes('does not complete the mission'),'Practice falsely implied completion');
 renderStudentJourney(container,resolveStudentJourney({...input,attempts:[attempt],reviewTopics:[{missionId:'m?1',topic:'trade'}]}));
 check(container.querySelector('a').textContent==='Review Missed Topic','Unreviewed topic skipped teaching');
 renderStudentJourney(container,resolveStudentJourney({...input,attempts:[attempt],reviewTopics:[{missionId:'m?1',topic:'trade',lessonRevisited:true}]}));
 target=new URL(container.querySelector('a').href);
 check(container.querySelector('a').textContent==='Practise This Topic'&&target.pathname.endsWith('practice.html')&&target.searchParams.get('topic')==='trade'&&target.searchParams.get('review')==='1','Revisited lesson did not hand off to targeted review practice');
 check(target.searchParams.get('mission')==='m?1'&&target.searchParams.get('chapter')==='c 1&x','Practice handoff lost original mission');
 const nextMission={id:'m2',chapterId:'c 1&x',status:'active',title:'Next lesson',order:2};
 const expanded={...input,missions:[{...input.missions[0],order:1},nextMission],attempts:[attempt]};
 renderStudentJourney(container,resolveStudentJourney(expanded));
 check(new URL(container.querySelector('a').href).searchParams.get('mission')==='m?1','Failed quiz unlocked next mission');
 renderStudentJourney(container,resolveStudentJourney({...expanded,missionProgress:[{userId:'student',missionId:'m?1',completed:true}]}));
 check(new URL(container.querySelector('a').href).searchParams.get('mission')==='m2','Completed mission did not advance Home to next lesson');
 renderStudentJourney(container,resolveStudentJourney({...input,missionProgress:[{userId:'student',missionId:'m?1',completed:true}]}));
 check(container.querySelector('a').href.includes('chapter-challenge.html'),'Chapter challenge action missing');
 renderStudentJourney(container,resolveStudentJourney({...input,missionProgress:[{userId:'student',missionId:'m?1',completed:true}],drafts:[{userId:'student',kind:'chapter',chapterId:'c 1&x',state:{version:'current'},updatedAt:{toMillis:()=>30}}]}));
 check(container.querySelector('a').textContent==='Resume Chapter Challenge','Chapter resume action missing');
 renderStudentJourney(container,resolveStudentJourney({...input,chapterProgress:[{userId:'student',chapterId:'c 1&x',completed:true}]}));
 check(container.querySelector('a').textContent==='Review Chapters','Finished state missing');
 const finished={...input,eras:[{id:'era &1',status:'active',order:1}],chapters:[{...input.chapters[0],eraId:'era &1'}],chapterProgress:[{userId:'student',chapterId:'c 1&x',completed:true,completedAt:{toMillis:()=>100}}],missionProgress:[{userId:'student',missionId:'m?1',completed:true}]};
 renderStudentJourney(container,resolveStudentJourney(finished));
 check(container.querySelector('a').textContent==='Revisit Your Latest Era'&&new URL(container.querySelector('a').href).searchParams.get('era')==='era &1','Finished student has no latest era action');
 check(container.querySelectorAll('.journey-completion-stats dd')[0].textContent==='1'&&container.querySelectorAll('.journey-completion-stats dd')[1].textContent==='1','Saved completion counts missing');
 check([...container.querySelectorAll('a')].some(a=>a.textContent==='Explore Your Collection'&&a.href.endsWith('achievements.html')),'Collection action missing');
 check(!container.querySelector('img')&&container.textContent.includes('<img'),'Finished chapter title was injected as markup');
 renderStudentJourney(container,resolveStudentJourney({...finished,reviewTopics:[{missionId:'m?1',topic:'Trade & travel',label:'Trade',missed:1}]}));
 action=container.querySelector('a');target=new URL(action.href);
 check(action.textContent==='Revisit This Topic'&&target.pathname.endsWith('story.html')&&target.searchParams.get('reviewTopic')==='Trade & travel'&&target.searchParams.get('chapter')==='c 1&x','Finished review did not open its lesson safely');
 let guidanceRefresh=0;
 renderStudentJourney(container,{...resolveStudentJourney(input),optionalGuidanceUnavailable:true},()=>guidanceRefresh++);
 check(!!container.querySelector('a')&&container.textContent.includes('temporarily unavailable'),'Optional failure blocked learning or lacked notice');
 container.querySelector('button').click();check(guidanceRefresh===1,'Guidance refresh unavailable');
 let retries=0;renderStudentJourney(container,{kind:'error'},()=>retries++);container.querySelector('button').click();check(retries===1,'Retry did not work');
 check(!container.querySelector('a'),'Error offered a stale lesson link');
 renderStudentJourney(container,{kind:'locked'});check(container.textContent.includes('earlier chapters')&&container.querySelector('a').href.includes('my-journey.html'),'Locked-only journey crashes or claims completion');
 renderStudentJourney(container,{kind:'unavailable'});check(!container.querySelector('a'),'Unavailable content offered lesson link');
 if(${process.argv.includes('--visual-review')}){
  document.body.classList.add('authenticated');document.body.classList.remove('auth-checking');document.documentElement.dataset.studentTextSize='larger';
  const populated={userId:'student',eras:[{id:'era1',status:'active',order:1}],chapters:[{id:'c1',eraId:'era1',status:'active',order:1,title:'Mga Sinaunang Pamayanang Pilipino at ang Kanilang Pamumuhay'},{id:'c2',eraId:'era1',status:'active',order:2,title:'Kabuhayan, Kalakalan at Pakikipag-ugnayan ng mga Pamayanan'},{id:'c3',eraId:'era1',status:'active',order:3,title:'Kaugalian at Paniniwala sa Iba’t Ibang Pamayanan'}],missions:[{id:'m1',chapterId:'c1',status:'active',order:1,title:'Life in a Barangay'},{id:'m2',chapterId:'c2',status:'active',order:1,title:'Pagtuklas sa Kabuhayan at Pakikipagkalakalan ng mga Sinaunang Pamayanang Pilipino'},{id:'m3',chapterId:'c3',status:'active',order:1,title:'Community Traditions'}],challenges:[],attempts:[],chapterProgress:[{userId:'student',chapterId:'c1',completed:true}],missionProgress:[{userId:'student',chapterId:'c1',missionId:'m1',completed:true}]};
  const state=resolveStudentJourney(populated);renderStudentJourney(container,state);renderHomeLearningTrail(document.getElementById('homeLearningTrail'),populated,state);
  const lessonRows=[...document.querySelectorAll('.home-lesson-row')];
  check(lessonRows.length===3&&lessonRows[0].dataset.state==='complete'&&lessonRows[1].dataset.state==='current'&&lessonRows[2].dataset.state==='locked','Populated Home does not distinguish completed/current/locked lessons');
  check(!lessonRows[2].hasAttribute('href')&&new URL(lessonRows[1].href).searchParams.get('chapter')==='c2','Populated lesson actions bypass locks or lose chapter ID');
  for(const row of lessonRows){const boundary=row.getBoundingClientRect();for(const child of row.children){const rect=child.getBoundingClientRect();check(rect.left>=boundary.left&&rect.right<=boundary.right+1,'Long lesson title or badge escapes its row');}}
  check(document.documentElement.scrollWidth<=innerWidth+1,'Long Home guidance overflows desktop');
 }
 document.getElementById('result').textContent='PASS: start/continue lesson links, safe Firestore text, review links, challenge, complete, empty and retry states';
})().catch(error=>{document.getElementById('result').textContent='FAIL: '+error.message;});
`;
html=html.replace('</head>','<style>'+css+'</style></head>').replace('</body>','<output id="result">RUNNING</output><script type="module">'+script+'</script></body>');
const file=path.join(temp,'dashboard.html');fs.writeFileSync(file,html);
const screenshot=path.join(temp,'home.png');
const result=spawnSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--window-size=1440,1400','--screenshot='+screenshot,'--user-data-dir='+path.join(temp,'browser'),'--dump-dom','--virtual-time-budget=3000','file:///'+file.replaceAll('\\','/')],{encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024,windowsHide:true});
console.log('Screenshot: '+screenshot);
if(result.error)throw result.error;const match=result.stdout.match(/<output id="result">([^<]+)<\/output>/);console.log(match?.[1]||'FAIL: browser returned no result');process.exitCode=match?.[1].startsWith('PASS:')?0:1;
