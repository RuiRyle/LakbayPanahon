const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{pathToFileURL}=require('node:url');
const {runFixture}=require('./student-missing-features-browser.cjs'),out=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-class-refinement-'));
const source=n=>fs.readFileSync('js/'+n,'utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];/g,'').replace(/export /g,'');
const old=fs.readFileSync('tests/student-classroom-hub-design.cjs','utf8');const setup=old.slice(old.indexOf('const auth={'),old.indexOf('const results=[]')).replace(/\$\{source\('([^']+)'\)\}/g,(_,n)=>source(n));
async function main(){for(const width of [1440,768,390]){
 const original=fs.readFileSync('pages/my-class.html','utf8');let html=original.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
 const css=[...original.matchAll(/href=["']\.\.\/css\/([^"'?]+)(?:\?[^"']*)?["']/g)].map(m=>fs.readFileSync('css/'+m[1],'utf8').replace(/@import[^;]+;/g,'').replace(/url\(["']?(\.\.\/[^)'"\s]+)["']?\)/g,(_,p)=>'url("'+pathToFileURL(path.resolve('css',p)).href+'")')).join('\n');
 const script=`const browserErrors=[];window.addEventListener('error',e=>browserErrors.push(e.message));window.addEventListener('unhandledrejection',e=>browserErrors.push(String(e.reason)));\n`+source('student-status.js')+'\n'+setup+`
 (async()=>{
 document.body.classList.add('authenticated');document.body.classList.remove('auth-checking');records.get('classes/class1').teacherName='Dela Cruz';records.get('classAnnouncements/news').title='Bring your curiosity';records.get('classFeedback/class1_student_m2').body='Revisit the trade clue and explain what it tells you.';
 records.get('classFeedback/class1_student_m2').updatedAt={toDate:()=>new Date('2026-11-05T08:00:00Z')};
 seed('classMembers','student_class1',{userId:'student',classId:'class1',status:'active'});seed('classes','class2',{name:'Grade 5 - Rosal',teacherName:'Teacher Two',status:'active'});seed('classMembers','student_class2',{userId:'student',classId:'class2',status:'active'});seed('classes/class1/classmates','peer1',{displayName:'Ana'});
 await loadClasses();await new Promise(r=>setTimeout(r,700));
 const card=container.querySelector('.student-class-card:not([hidden])'),tabs=[...card.querySelectorAll('[role=tab]')],panels=[...card.querySelectorAll('[role=tabpanel]')],selector=container.querySelector('.student-class-select');
 check(tabs.length===4,'Tabs changed');check(selector.options.length===2,'Selector lost classes');
 check(document.documentElement.scrollWidth<=innerWidth+1,'Overview overflow');
 check(document.querySelector('.class-page-heading').getBoundingClientRect().height<285,'Header oversized');
 tabs[1].click();check(!panels[1].hidden&&card.querySelectorAll('.class-assignment').length===3,'Activities failed');
 tabs[2].click();check(!panels[2].hidden&&card.querySelectorAll('.class-announcement').length===1,'Announcements failed');
 tabs[3].click();await tick();check(!panels[3].hidden&&panels[3].textContent.includes('Ana'),'Classmates failed');
 selector.value='class2';selector.dispatchEvent(new Event('change'));check(card.hidden,'Switch failed');selector.value='class1';selector.dispatchEvent(new Event('change'));tabs[0].click();
 const guidance=card.querySelector('.class-guidance-drawer');guidance.open=true;await tick();
 const message=card.querySelector('.class-feedback-message'),read=message.querySelector('button'),before=getComputedStyle(message).backgroundColor;
 check(message.textContent.includes('New feedback')&&message.textContent.includes('Updated'),'Feedback metadata missing');
 check(message.querySelector('a').href.includes('mission=m2'),'Revisit lesson route changed');read.click();await tick();
 check(records.get('classFeedback/class1_student_m2').readAt&&message.textContent.includes('Marked as read'),'Read acknowledgement failed');check(getComputedStyle(message).backgroundColor!==before,'Read feedback not visually distinct');
 joinDrawer.open=true;code.value='BAD';joinForm.requestSubmit();await tick();check(joinStatus.textContent,'Validation missing');
 seed('classes','class3',{name:'History Research Group',status:'active',teacherName:'Teacher Three'});seed('classJoinCodes','JOIN1234ABCD',{classId:'class3',status:'active'});code.value='JOIN1234ABCD';joinForm.requestSubmit();await new Promise(r=>setTimeout(r,300));
 check(records.has('classMembers/student_class3'),'Joining failed');
 const finalSelect=container.querySelector('.student-class-select');finalSelect.value='class1';finalSelect.dispatchEvent(new Event('change'));
 const current=container.querySelector('.student-class-card:not([hidden])');current.querySelectorAll('[role=tab]')[0].click();current.querySelector('.class-guidance-drawer').open=true;joinDrawer.open=true;
 await new Promise(r=>setTimeout(r,300));check(!browserErrors.length,'Runtime errors: '+browserErrors.join('; '));check(document.documentElement.scrollWidth<=innerWidth+1,'Expanded page overflow');scrollTo(0,0);
 document.getElementById('fixtureResult').textContent='PASS: My Class '+innerWidth+'px, four tabs, switching, metadata, read styling, revisit, join validation, joining, overflow, runtime errors';
 })().catch(e=>document.getElementById('fixtureResult').textContent='FAIL: '+e.message);
 `;
 html=html.replace('<head>','<head><base href="'+pathToFileURL(path.resolve('pages')).href+'/">').replace('</head>','<style>'+css+'</style></head>').replace('</body>','<output id="fixtureResult">RUNNING</output><script type="module">'+script+'</script></body>');
 for(const detail of [false,true]){const file=path.join(out,'class-'+width+(detail?'-feedback':'')+'.html');fs.writeFileSync(file,detail?html.replace('scrollTo(0,0);',"scrollTo(0,document.querySelector('.student-class-card:not([hidden]) .class-guidance-drawer').getBoundingClientRect().top+scrollY-90);"):html);const result=await runFixture(file,width);console.log(result);if(!result?.startsWith('PASS:'))process.exitCode=1;}
 }console.log('Captures: '+out);}
main().catch(e=>{console.error(e);process.exitCode=1;});
