const fs=require('fs'),path=require('path'),os=require('os'),{spawnSync}=require('child_process');
const root=path.join(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-exhibit-'));
const source=fs.readFileSync(path.join(root,'js/story-exhibit.js'),'utf8').replace(/export /g,'');
const activity=require('../data/'+(process.env.EXHIBIT_PLAN||'chapter15-mission2')+'-migration.json').writes.find(w=>w.fields.exhibitActivity).fields.exhibitActivity;
const style=fs.readFileSync(path.join(root,'css/story.css'),'utf8');
const script=`${source}
const activity=${JSON.stringify(activity)},host=document.getElementById('host');let saved,confirmations=0;
const check=(value,message)=>{if(!value)throw Error(message);};
try{
 renderExhibit({host,activity,explored:false,onChange:s=>saved=s,onConfirmed:()=>confirmations++});
 check([...host.querySelectorAll('select')].every(s=>s.disabled),'Clues do not gate exhibit');
 host.replaceChildren();renderExhibit({host,activity,explored:true,onChange:s=>saved=s,onConfirmed:()=>confirmations++});
 const inputs=[...host.querySelectorAll('select')];
 const choose=(index,value)=>{inputs[index].value=value;inputs[index].dispatchEvent(new Event('change'));};
 inputs.forEach((_,i)=>choose(i,activity.effects[0].id));host.querySelector('.begin-mission-button').click();check(confirmations===0&&!saved.confirmed,'Wrong matches counted');
 inputs.forEach((_,i)=>choose(i,activity.pairs[i].effectId));host.querySelector('.begin-mission-button').click();check(confirmations===1&&saved.confirmed,'Correct exhibit not confirmed');
 check(inputs.every(s=>s.disabled),'Confirmed choices can be changed without revision');
 check(host.querySelector('.exhibit-match-feedback').getAttribute('role')==='status','Feedback not announced');
 check(document.documentElement.scrollWidth<=window.innerWidth,'Exhibit horizontally overflows');
 document.getElementById('result').textContent='PASS: exhibit clue gate, matching, revision-ready controls, feedback and responsive layout';
}catch(error){document.getElementById('result').textContent='FAIL: '+error.message;}
`;
const html='<!doctype html><html><head><meta charset="utf-8"><style>'+style+' body{margin:0;padding:24px;background:#faf5e6;font-family:system-ui,sans-serif}main{max-width:1100px;margin:auto}h1{font-size:24px;color:#365440}</style></head><body><main><h1>Chapter 15 - Your contribution exhibit</h1><div id="host"></div><output id="result">RUNNING</output></main><script type="module">'+script+'</script></body></html>';
const file=path.join(temp,'exhibit.html'),screenshot=path.join(temp,'exhibit.png');fs.writeFileSync(file,html);
const r=spawnSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--window-size='+(process.env.EXHIBIT_VIEWPORT||'1200,1050'),'--user-data-dir='+path.join(temp,'browser'),'--screenshot='+screenshot,'--dump-dom','--virtual-time-budget=2000','file:///'+file.replaceAll('\\','/')],{encoding:'utf8',windowsHide:true,timeout:30000,maxBuffer:4*1024*1024});if(r.error)throw r.error;const result=r.stdout.match(/<output id="result">([^<]+)<\/output>/)?.[1];console.log(result||'FAIL: no result');console.log('Screenshot: '+screenshot);process.exitCode=result?.startsWith('PASS:')?0:1;
