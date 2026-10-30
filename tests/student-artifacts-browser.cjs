const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-artifacts-'));
const source=fs.readFileSync(path.join(root,'js/achievements.js'),'utf8').replace(/import[\s\S]*?from\s+"[^"]+";/g,'');
let html=fs.readFileSync(path.join(root,'pages/achievements.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
const script=`
const auth={currentUser:{uid:'student'}},db={};let listener,mode='partial',gate=null,reads=0;
const collection=(_,name)=>({name}),doc=(_,name,id)=>({name,id}),where=(field,op,value)=>({field,value}),query=(ref,...filters)=>({...ref,filters});
const onAuthStateChanged=(_,fn)=>{listener=fn;queueMicrotask(()=>fn(auth.currentUser));};
const getDocs=async ref=>{if(ref.name==='studentBadges')return{forEach:()=>{}};if(ref.filters[0].value!=='student')throw Error('Wrong owner query');const delayed=gate,currentMode=mode;if(delayed)await delayed;if(currentMode==='error')throw Error('Offline');return{forEach:fn=>(currentMode==='empty'?[]:[{userId:'student',artifactId:'b1'},{userId:'student',artifactId:'b1'},{userId:'student',artifactId:'b2'},{userId:'other',artifactId:'foreign'}]).forEach(row=>fn({data:()=>row}))};};
const getDoc=async ref=>{reads++;if(ref.id==='foreign')throw Error('Foreign badge read');if(mode==='detailError'&&ref.id==='b2')throw Error('Offline');return{id:ref.id,exists:()=>mode!=='missing'&&(ref.id==='b1'||mode==='complete'),data:()=>({status:'active',name:'Artifact <img src=x>',description:'Description <script>bad<'+ '/script>',icon:'<svg onload=bad>',order:1})};};
${source}
const tick=()=>new Promise(r=>setTimeout(r,30)),check=(ok,message)=>{if(!ok)throw Error(message);};
(async()=>{
 document.body.classList.add('authenticated');await tick();
 check(artifactView.count.textContent==='2'&&reads===2,'Ownership count or detail dedup failed');
 check(artifactView.grid.children.length===1&&artifactView.empty.hidden,'Partial catalog lost available badges');
 check(artifactView.status.textContent.includes('Some earned')&&!artifactView.retry.hidden,'Partial catalog lacks recovery');
 check(!artifactView.grid.querySelector('img,svg,script')&&artifactView.grid.textContent.includes('<img src=x>'),'Badge text interpreted as markup');
 mode='complete';artifactView.retry.click();await tick();check(artifactView.grid.children.length===2&&artifactView.retry.hidden&&artifactView.loading.hidden,'Retry did not restore details');
 mode='detailError';await loadArtifacts(auth.currentUser);check(artifactView.grid.children.length===1&&artifactView.count.textContent==='2','Detail outage discarded successful cards');
 mode='missing';await loadArtifacts(auth.currentUser);check(!artifactView.empty.hidden===false&&artifactView.status.textContent.includes('earned artifacts are saved'),'Missing catalog claimed no earned badges');
 mode='error';await loadArtifacts(auth.currentUser);check(artifactView.count.textContent==='Unavailable'&&!artifactView.retry.hidden&&artifactView.loading.hidden,'Ownership error lacks retry');
 mode='empty';artifactView.retry.click();await tick();check(artifactView.count.textContent==='0'&&!artifactView.empty.hidden&&artifactView.retry.hidden,'Genuine empty collection not distinguished');
 let release;mode='complete';gate=new Promise(r=>release=r);const old=loadArtifacts(auth.currentUser);await tick();auth.currentUser=null;listener(null);gate=null;release();await old;
 check(!artifactView.grid.children.length&&artifactView.count.textContent==='—'&&artifactView.empty.hidden,'Late response restored signed-out badges');
 auth.currentUser={uid:'student'};mode='complete';listener(auth.currentUser);await tick();check(artifactView.grid.children.length===2,'Fresh session failed');
 gate=new Promise(r=>release=r);const stale=loadArtifacts(auth.currentUser);await tick();gate=null;mode='empty';await loadArtifacts(auth.currentUser);release();await stale;
 check(artifactView.count.textContent==='0'&&!artifactView.empty.hidden&&!artifactView.grid.children.length,'Older request replaced fresh achievements');
 document.getElementById('result').textContent='PASS: artifacts on Achievements, ownership/dedup, safe text, partial/missing details, retry, empty state and session/request races';
})().catch(e=>document.getElementById('result').textContent='FAIL: '+e.message);
`;
html=html.replace('</body>','<output id="result">RUNNING</output><script type="module">'+script+'</script></body>');
const file=path.join(temp,'achievements.html');fs.writeFileSync(file,html);
const result=spawnSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--window-size=1440,1000','--user-data-dir='+path.join(temp,'browser'),'--dump-dom','--virtual-time-budget=4000','file:///'+file.replaceAll('\\','/')],{encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024,windowsHide:true});
if(result.error)throw result.error;const match=result.stdout.match(/<output id="result">([^<]+)<\/output>/);console.log(match?.[1]||'FAIL: no browser result');process.exitCode=match?.[1].startsWith('PASS:')?0:1;
