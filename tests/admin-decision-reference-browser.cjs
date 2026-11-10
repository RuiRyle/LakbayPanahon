const fs=require('fs'),path=require('path');
const {runFixture}=require('./student-missing-features-browser.cjs');
const output='docs/validation/admin-decision-reference';fs.mkdirSync(output,{recursive:true});const folder=fs.mkdtempSync(path.resolve('build/decision-reference-'));
const source=fs.readFileSync('js/admin-decision-view.js','utf8').replace(/export /g,'');
(async()=>{for(const width of [1440,900,390]){
 let html=fs.readFileSync('pages/admin-decisions.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
 html=html.replace('../assets/brand/lakbay-sun.svg','data:image/svg+xml;base64,'+fs.readFileSync('assets/brand/lakbay-sun.svg').toString('base64'));
 const styles=['navy-gold-theme','expedition','teacher-workspace','admin-workspace','admin-decision-records'].map(name=>fs.readFileSync('css/'+name+'.css','utf8').replace(/@import[^;]+;/g,'')).join('\n');
 const script=`${source}
 (async()=>{const assert=(ok,label)=>{if(!ok)throw Error(label)};const tick=()=>new Promise(r=>setTimeout(r,30));
 document.body.classList.add('authenticated');document.body.dataset.adminView='records';document.getElementById('adminPageTitle').textContent='Decision Records';document.querySelectorAll('[data-teacher-tab]').forEach(link=>{link.setAttribute('aria-pressed',String(link.dataset.teacherTab==='records'));link.removeAttribute('aria-current');});document.querySelector('[data-teacher-tab=records]').setAttribute('aria-current','page');
 const main=document.getElementById('admin-main');main.replaceChildren();const host=document.createElement('div');main.append(host);
 const names=['Maria Santos','Juan Dela Cruz','Ana Reyes','Rafael Castillo','Leizhel Pineda','Marco Ramos','Julia Cruz','Lina Reyes','Pedro Santos','Luz Garcia'];
 const profiles=names.map((name,i)=>({firstName:name.split(' ')[0],lastName:name.split(' ').slice(1).join(' '),email:name.toLowerCase().replaceAll(' ','.')+'@example.com',role:i%3===0?'student':'teacher'}));
 const fixtureNow=Date.now();const records=names.map((name,i)=>({id:'record-'+i,userId:'account-'+i,actorId:'synthetic-admin',previousStatus:'pending',status:i%3===0?'active':i%3===1?'inactive':'pending',reason:i===0?'The account access requirements were reviewed and confirmed.':'Synthetic administrator review '+i+'.',createdAt:{toDate:()=>new Date(fixtureNow-(i+1)*86400000)}}));let opened=null;
 mountDecisionRecords(host,records,{moreAvailable:true,resolveAccount:async uid=>({profile:profiles[Number(uid.split('-')[1])]}),onHistory:r=>opened=r.userId});await tick();
 assert(host.querySelector('.decision-row').textContent.includes('Maria Santos'),'Resolved name missing');assert(host.textContent.includes('current account profiles'),'Profile identity scope missing');assert(host.querySelectorAll('.decision-stat').length===4,'Summary missing');
 const search=host.querySelector('input');search.value='maria.santos@example.com';search.dispatchEvent(new Event('input'));assert(host.querySelectorAll('.decision-row').length===1,'Email search failed');host.querySelector('.decision-reset').click();
 const selects=host.querySelectorAll('select');selects[1].value='Teacher';selects[1].dispatchEvent(new Event('change'));assert([...host.querySelectorAll('.decision-row-role')].every(row=>row.textContent==='Teacher'),'Role filter failed');host.querySelector('.decision-reset').click();
 selects[2].value='7';selects[2].dispatchEvent(new Event('change'));assert(host.querySelector('.decision-pagination').textContent.includes('of 6 loaded'),'Date filter failed');host.querySelector('.decision-reset').click();
 host.querySelector('.decision-row').click();assert(host.querySelector('.decision-detail-panel').textContent.includes('Maria Santos')&&host.querySelector('.decision-fields').textContent.includes('synthetic-admin'),'Saved audit detail missing');host.querySelector('.decision-history').click();assert(opened==='account-0','History routing failed');
 let exported;const native=URL.createObjectURL;URL.createObjectURL=blob=>{exported=blob;return native(blob);};host.querySelector('.decision-export').click();assert((await exported.text()).includes('Record ID'),'CSV missing');URL.createObjectURL=native;
 assert(document.documentElement.scrollWidth<=innerWidth+1,'Page overflows');
 document.getElementById('fixtureResult').textContent='PASS: reference layout, resolved identity, role/date/email filters, details, history, CSV and scope ${width}px';
 })().catch(error=>document.getElementById('fixtureResult').textContent='FAIL: '+error.message);
 `;
 html=html.replace('</head>','<style>'+styles+'</style></head>').replace('</body>','<output id="fixtureResult" style="position:fixed;left:-9999px">RUNNING</output><script type="module">'+script+'</script></body>');
 const file=path.join(folder,'records-'+width+'.html');fs.writeFileSync(file,html);const result=await runFixture(file,width);console.log(result);if(!result?.startsWith('PASS:'))process.exitCode=1;fs.copyFileSync(file+'.png',path.join(output,'records-'+width+'.png'));
 }} )().catch(error=>{console.error(error);process.exitCode=1;});
