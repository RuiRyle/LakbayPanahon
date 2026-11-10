const fs=require('fs'),os=require('os'),path=require('path');
const {runFixture}=require('./student-missing-features-browser.cjs');
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-decision-view-'));
const source=fs.readFileSync('js/admin-decision-view.js','utf8').replace(/export /g,'');
async function main(){for(const width of [1440,390]){
 const script=`${source}
 const assert=(ok,message)=>{if(!ok)throw Error(message)};
 try{
  const host=document.getElementById('host');let current=true,opened=null;
  const records=Array.from({length:10},(_,i)=>({id:'r'+i,userId:'account-'+i,actorId:'admin',previousStatus:'pending',status:i%2?'inactive':'active',reason:i===0?'<img src=x onerror=alert(1)> Keep the reason as text.':'Review '+i,createdAt:{toDate:()=>new Date('2026-11-10T04:00:00Z')}}));
  mountDecisionRecords(host,records,{moreAvailable:true,isCurrent:()=>current,onHistory:r=>opened=r.userId});
  assert(host.querySelectorAll('.decision-stat').length===4,'Summary missing');assert(host.querySelectorAll('.decision-row').length===5,'Page size incorrect');assert(host.textContent.includes('loaded snapshot'),'Counts imply global totals');
  host.querySelector('.decision-row').click();assert(host.querySelector('.decision-reason').textContent.includes('<img')&&!host.querySelector('img'),'Reason interpreted HTML');assert(host.querySelector('.decision-row[aria-pressed=true]'),'Selected row unclear');host.querySelector('.decision-history').click();assert(opened==='account-0','History opened wrong account');
  host.querySelector('.decision-pagination button:last-child').click();assert(host.querySelector('.decision-row').textContent.includes('account-5'),'Next page failed');
  const search=host.querySelector('input');search.value='account-1';search.dispatchEvent(new Event('input'));assert(host.querySelectorAll('.decision-row').length===1,'Search incorrect');assert(host.querySelector('.decision-detail-panel').textContent.includes('Choose a record'),'Filtered-away selection retained');
  host.querySelector('select').value='active';host.querySelector('select').dispatchEvent(new Event('change'));assert(!host.querySelector('.decision-row')&&host.textContent.includes('No records match'),'Action filter incorrect');
  mountDecisionRecords(host,[],{});assert(host.textContent.includes('No account-access decisions')&&host.querySelector('.decision-export').disabled,'Empty state incorrect');
  mountDecisionRecords(host,records,{isCurrent:()=>current,onHistory:r=>opened=r.userId});current=false;opened=null;host.querySelector('.decision-row').click();assert(!host.querySelector('.decision-history')&&opened===null,'Stale account action accepted');
  assert(document.documentElement.scrollWidth<=innerWidth+1,'Layout overflows');document.getElementById('fixtureResult').textContent='PASS: decision summaries, pagination, filters, safe detail rendering, history routing, empty state and session guards ${width}px';
 }catch(error){document.getElementById('fixtureResult').textContent='FAIL: '+error.message;}
 `;
 const file=path.join(folder,'records-'+width+'.html');fs.writeFileSync(file,'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:20px;background:#06162a;font-family:Arial}*{box-sizing:border-box}'+fs.readFileSync('css/admin-decision-records.css','utf8')+'</style></head><body><main id="host"></main><output id="fixtureResult">RUNNING</output><script type="module">'+script+'</script></body></html>');
 const result=await runFixture(file,width);console.log(result);if(!result?.startsWith('PASS:'))process.exitCode=1;
 }}main().catch(error=>{console.error(error);process.exitCode=1;});
