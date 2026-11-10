const fs=require('fs'),path=require('path'),os=require('os');
const {runFixture}=require('./student-missing-features-browser.cjs');
const out=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-dialog-'));
const source=fs.readFileSync('js/app-dialog.js','utf8').replace(/export /g,'');
const script=`${source}
const assert=(ok,message)=>{if(!ok)throw Error(message)},tick=()=>new Promise(r=>setTimeout(r,30));
(async()=>{
 const trigger=document.getElementById('trigger');trigger.focus();
 let promise=appConfirm('Join class <img src=x>?\\nYour progress stays saved.');let dialog=document.querySelector('dialog');await new Promise(r=>setTimeout(r,300));
 assert(dialog.open&&!dialog.querySelector('img'),'Message interpreted HTML');
 const rect=dialog.getBoundingClientRect();assert(Math.abs(rect.left+rect.width/2-innerWidth/2)<2&&Math.abs(rect.top+rect.height/2-innerHeight/2)<2,'Not centered');
 assert(document.activeElement.textContent==='Cancel','Confirmation did not default to safe action');
 assert(await appConfirm('Duplicate')===false&&document.querySelectorAll('dialog').length===1,'Duplicate dialog opened');
 dialog.querySelector('.lakbay-dialog-cancel').click();assert(await promise===false&&document.activeElement===trigger,'Cancel result/focus failed');
 promise=appConfirm('Continue?');document.querySelector('.lakbay-dialog-ok').click();assert(await promise===true,'OK did not confirm');
 promise=appConfirm('Cancel with Escape');document.querySelector('dialog').dispatchEvent(new Event('cancel',{cancelable:true}));assert(await promise===false,'Escape did not cancel');
 promise=appAlert('Saved');assert(!document.querySelector('.lakbay-dialog-cancel'),'Notice has unnecessary Cancel');document.querySelector('.lakbay-dialog-ok').click();await promise;
 document.body.classList.add('authenticated');promise=appConfirm('Pending action');document.body.classList.remove('authenticated');await tick();assert(await promise===false&&!document.querySelector('dialog'),'Sign-out retained pending action');
 promise=appConfirm('Leaving');window.dispatchEvent(new PageTransitionEvent('pagehide'));assert(await promise===false,'Exit did not cancel');
 document.getElementById('fixtureResult').textContent='PASS: centered themed dialogs, safe text, OK/Cancel, Escape, duplicate prevention, focus restoration, session and page cleanup';
})().catch(e=>document.getElementById('fixtureResult').textContent='FAIL: '+e.message);
`;
const file=path.join(out,'dialog.html');fs.writeFileSync(file,'<!doctype html><html><head><style>'+fs.readFileSync('css/app-dialog.css','utf8')+'</style></head><body><button id="trigger">Open</button><output id="fixtureResult">RUNNING</output><script type="module">'+script+'</script></body></html>');
runFixture(file,1280).then(result=>{console.log(result);if(!result?.startsWith('PASS:'))process.exitCode=1;}).catch(e=>{console.error(e);process.exitCode=1;});
