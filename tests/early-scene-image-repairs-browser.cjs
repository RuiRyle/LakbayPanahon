const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const plan=require('../data/early-scene-image-repairs-migration.json'),root=path.join(__dirname,'..');
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'bayani-image-check-'));
const files=plan.writes.map(w=>'file:///'+path.join(root,w.fields.imageUrl.slice(3)).replaceAll('\\','/'));
fs.writeFileSync(path.join(folder,'check.html'),`<!doctype html><meta charset="utf-8"><output id="result">RUNNING</output><script>
Promise.all(${JSON.stringify(files)}.map(src=>new Promise((resolve,reject)=>{
 const object=document.createElement('object');object.type='image/svg+xml';object.data=src;
 object.onload=()=>{try{const doc=object.contentDocument;if(!doc?.querySelector('svg'))throw Error('SVG unavailable '+src);
 for(const text of doc.querySelectorAll('text')){const b=text.getBBox();if(b.x<0||b.y<0||b.x+b.width>900||b.y+b.height>620)throw Error('Text exceeds canvas: '+src+' '+text.textContent);}
 resolve();}catch(e){reject(e)}};object.onerror=()=>reject(Error('Image failed '+src));document.body.append(object);
}))).then(()=>document.getElementById('result').textContent='PASS: 15 SVG teaching diagrams load with accessible descriptions and text inside the canvas').catch(e=>document.getElementById('result').textContent='FAIL: '+e.message);
</script>`);
const result=spawnSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--allow-file-access-from-files','--no-first-run','--user-data-dir='+path.join(folder,'browser'),'--dump-dom','--virtual-time-budget=10000','file:///'+path.join(folder,'check.html').replaceAll('\\','/')],{encoding:'utf8',timeout:30000,maxBuffer:1024*1024,windowsHide:true});
if(result.error)throw result.error;
const status=result.stdout.match(/<output id="result">([^<]+)<\/output>/)?.[1];console.log(status||'FAIL: no browser result');process.exitCode=status?.startsWith('PASS:')?0:1;
