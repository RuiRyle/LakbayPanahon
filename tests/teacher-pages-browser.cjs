// Local HTTP page-navigation test. Actual controllers and transition code; synthetic Firebase records.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const http = require('node:http');
const {spawn} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const strip = file => read(file).replace(/import[\s\S]*?from\s*['"][^'"]+['"];?/g,'').replace(/export /g,'');
const mocks = read('tests/teacher-workspace-browser.cjs').match(/const mocks = `([\s\S]*?)`;/)[1];
const seeds = `
records.set('classes/routeclass',{teacherId:'teacher1',name:'Route Classroom',status:'active',description:''});
records.set('classMembers/student1_routeclass',{classId:'routeclass',userId:'student1',status:'active'});
records.set('classAssignments/routeassignment',{classId:'routeclass',teacherId:'teacher1',status:'published',missionId:'m1',chapterId:'c1',title:'Balangay Adventures',updatedAt:serverTimestamp()});
records.set('studentProgress/student1_m1',{userId:'student1',missionId:'m1',chapterId:'c1',completed:true,bestScore:80});
`;
const routes = ['teacher-classroom.html','teacher-dashboard.html','teacher-classes.html','teacher-students.html','teacher-announcements.html','teacher-assignments.html'];
const keys = ['overview','classes','students','announcements','assignments'];
const css = ['css/workspace-loading.css','css/navy-gold-theme.css','css/page-transition.css','css/expedition.css','css/teacher-workspace.css','css/class-feedback.css'].map(read).join('\n');
const driver = `
const checks=[];
const check=(value,label)=>{if(!value)throw Error(label);checks.push(label);document.querySelector('#result').textContent=JSON.stringify({pass:false,pending:true,checks});};
const delay=()=>new Promise(resolve=>setTimeout(resolve,25));
async function ready(frame,key,previous){for(let i=0;i<400;i++){const d=frame.contentDocument;if(d!==previous&&d?.body?.dataset.teacherPage===key&&d.body.classList.contains('authenticated')&&d.querySelector('#teacher-main')?.getAttribute('aria-busy')==='false'&&!d.body.classList.contains('workspace-loading'))return d;await delay();}throw Error('Page did not finish loading: '+key);}
async function run(width){
 const frame=document.createElement('iframe');frame.style.cssText='width:'+width+'px;height:850px;border:0';document.body.append(frame);
 frame.src='/teacher-dashboard.html?class=routeclass';let d=await ready(frame,'overview');
 check(d.querySelector('#teacherClassPickerLabel').textContent.includes('Route Classroom'),'class context loaded from URL at '+width);
 for(const [key,file] of [['classes','teacher-classes.html'],['students','teacher-students.html'],['announcements','teacher-announcements.html'],['assignments','teacher-assignments.html'],['overview','teacher-dashboard.html']]){
  const previous=d,link=d.querySelector('[data-teacher-tab="'+key+'"]');
  check(new URL(link.href).pathname==='/'+file&&(key==='overview'?!new URL(link.href).searchParams.has('class'):new URL(link.href).searchParams.get('class')==='routeclass'),'real '+key+' link keeps selected class at '+width+' href='+link.href+' current='+frame.contentWindow.location.href+' status='+d.querySelector('#teacherStatus').textContent);
  link.click();await Promise.resolve();check(!!d.querySelector('.route-transition-overlay'),'shared compass transition appears for '+key+' at '+width);
  d=await ready(frame,key);check(d!==previous&&frame.contentWindow.location.pathname==='/'+file,'new HTML document opens for '+key+' at '+width);
  if(key==='assignments')check(d.querySelector('#teacherCatalogResults').textContent.includes('Balangay Adventures'),'assignment destination initializes the lesson catalog after account loading at '+width);
  check((key==='overview'?!d.querySelector('#teacherWelcome').hidden:!d.querySelector('#teacher-'+key).hidden)&&d.querySelector('[aria-current="page"]').dataset.teacherTab===key,'correct page and active navigation for '+key+' at '+width);
  check(d.documentElement.scrollWidth<=width+1,'page fits '+width+' for '+key);
  check(d.querySelector('#teacherStatus').dataset.error!=='true'&&!d.querySelector('#teacherStatus').textContent.includes('Choose a class'),'loaded route has no initialization error or misleading class prompt for '+key+' at '+width);
  if(key==='classes'){const old=d;d.querySelector('a.classroom-card-toggle').click();d=await ready(frame,'classes',old);check(frame.contentWindow.location.pathname==='/teacher-classroom.html'&&d.querySelector('#selectedClassTitle').textContent.includes('Route Classroom'),'directory opens the selected classroom at '+width+'; url='+frame.contentWindow.location.pathname+'; label='+d.querySelector('#teacherClassPickerLabel').textContent+'; status='+d.querySelector('#teacherStatus').textContent);}
 }
 d.querySelector('#teacherAllClassCards a').click();d=await ready(frame,'classes',d);
 d.querySelector('[data-teacher-tab="announcements"]').click();d=await ready(frame,'announcements',d);
 check(d.querySelector('#announcementForm')!==null,'primary action navigates to announcements at '+width);
 frame.src='/teacher-assignments.html?class=routeclass&assignment=routeassignment';d=await ready(frame,'assignments',d);
 for(let i=0;i<100&&!d.querySelector('.teacher-assignment-progress')?.textContent.includes('0 of 1');i++)await delay();
 check(d.querySelector('.teacher-assignment-progress').textContent.includes('1 of 1'),'assignment deep link keeps solo completion separate from class submission at '+width);
 frame.src='/teacher-students.html?class=routeclass&student=student1&search=ana&rosterPage=999';d=await ready(frame,'students');
 for(let i=0;i<100&&!d.querySelector('#studentReport').textContent.includes('Ana Example');i++)await delay();
 check(d.querySelector('#studentReport').textContent.includes('Ana Example'),'student deep link opens authorized report at '+width);
 check(d.querySelector('#rosterSearch').value==='ana'&&!frame.contentWindow.location.search.includes('rosterPage=999'),'report destination restores search and bounds pagination at '+width);
 [...d.querySelectorAll('#studentReport button')].find(b=>b.textContent==='Back to Student List').click();await Promise.resolve();
 check(d.querySelector('#rosterSearch').value==='ana'&&d.querySelector('#teacherRoster').textContent.includes('Ana Example')&&!d.querySelector('#studentReport').children.length,'return from report keeps the filtered student list at '+width);
 frame.remove();
}
(async()=>{await run(390);await run(1280);document.querySelector('#result').textContent=JSON.stringify({pass:true,checks});})().catch(e=>document.querySelector('#result').textContent=JSON.stringify({pass:false,error:e.stack,checks}));
`;
const server = http.createServer((request,response)=>{
    const url = new URL(request.url,'http://localhost');
    response.setHeader('Content-Type','text/html; charset=utf-8');
    if(url.pathname==='/') { response.end('<!doctype html><html><body><output id="result">RUNNING</output><script>'+driver+'</script></body></html>'); return; }
    const file = url.pathname.slice(1);
    if(!routes.includes(file)){response.writeHead(404);response.end();return;}
    let html = read('pages/'+file).replace(/<script[\s\S]*?<\/script>/g,'').replace(/<link[^>]+>/g,'');
    html=html.replace('</head>','<style>'+css+'</style></head>').replace('</body>','<script type="module">'+mocks+'\n'+seeds+'\n'+strip('js/classroom-submission-policy.js')+'\n'+strip('js/teacher-class-policy.js')+'\n'+strip('js/teacher-class-client.js')+'\n'+strip('js/teacher-support-policy.js')+'\n'+strip('js/teacher-quiz-insights.js')+'\n'+strip('js/teacher-report-export.js')+'\n'+strip('js/auth-guard.js')+'\n'+'const {renderTeacherHelp,renderTeacherReflectionQueue}=(()=>{'+strip('js/student-feedback.js')+';return {renderTeacherHelp,renderTeacherReflectionQueue};})();'+'\n'+strip('js/teacher-workspace.js')+'\n'+strip('js/page-transition.js')+'</script></body>');
    response.end(html);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const temporary = fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-teacher-pages-'));
 const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-background-networking','--disable-gpu','--no-first-run','--no-default-browser-check','--user-data-dir='+temporary,'--dump-dom','--virtual-time-budget=30000','http://127.0.0.1:'+server.address().port],{windowsHide:true});
 let output='',errors='';chrome.stdout.on('data',chunk=>output+=chunk);chrome.stderr.on('data',chunk=>errors+=chunk);
 const timeout=setTimeout(()=>chrome.kill(),20000);
 await new Promise((resolve,reject)=>{chrome.on('error',reject);chrome.on('close',resolve);});clearTimeout(timeout);
 const encoded=output.match(/<output id="result">([^<]+)<\/output>/)?.[1];
 let result;try{result=JSON.parse(encoded?.replaceAll('&amp;','&').replaceAll('&gt;','>').replaceAll('&lt;','<'));}catch{result={pass:false,error:'No browser result',stderr:errors.slice(-500)};}
 fs.writeFileSync(path.join(root,'docs/validation/teacher-pages-browser-2026-11-04.json'),JSON.stringify({mode:'local-http-real-navigation-mocked-firebase',verifiedAt:new Date().toISOString(),...result},null,2));
 console.log(JSON.stringify(result,null,2));if(!result.pass)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
