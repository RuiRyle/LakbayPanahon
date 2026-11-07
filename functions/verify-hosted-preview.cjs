// GET-only HTTPS/asset checks of the approved preview; no account/config writes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),hash=v=>crypto.createHash('sha256').update(v).digest('hex');
async function main(){
 const origin=new URL(process.argv[2]),folder=require('../tools/serve-student-web.cjs').resolvePackage(process.argv[3]);
 if(origin.protocol!=='https:'||!/^lakbaypanahon-1797e--release-review-[a-z0-9-]+\.web\.app$/.test(origin.hostname)||origin.pathname!=='/')throw Error('Use the approved HTTPS preview origin only.');
 const manifest=JSON.parse(fs.readFileSync(path.join(folder,'release-manifest.json'),'utf8')),config=JSON.parse(fs.readFileSync(path.join(folder,'firebase.json'),'utf8'));
 const expectedHeaders=Object.fromEntries(config.hosting.headers[0].headers.map(h=>[h.key.toLowerCase(),h.value]));
 const chosen=manifest.files.filter(item=>item.file.endsWith('.html')||['js/auth-ui.js','js/firebase-config.js','js/admin-workspace.js','js/admin-accounts.js','js/teacher-workspace.js','js/teacher-class-client.js','js/story.js','js/student-shell.js','js/teacher-application.js','js/teacher-application-client.js','js/teacher-application-policy.js','js/teacher-application-review.js','js/teacher-review-panel.js','js/teacher-evidence-viewer.js','css/auth.css','css/teacher-workspace.css','css/admin-workspace.css','css/teacher-application.css'].includes(item.file));
 const images=manifest.files.filter(item=>/\.(svg|png|webp|jpg)$/.test(item.file)).slice(0,3);chosen.push(...images);
 const checks=[];
 async function get(route,options={}){return fetch(new URL(route,origin),{redirect:'error',...options,signal:AbortSignal.timeout(30000)});}
 for(let offset=0;offset<chosen.length;offset+=4){
  const results=await Promise.all(chosen.slice(offset,offset+4).map(async item=>{
   const response=await get('/'+item.file);if(response.status!==200)throw Error(item.file+' HTTP '+response.status);
   const bytes=Buffer.from(await response.arrayBuffer());if(hash(bytes)!==item.sha256)throw Error('Hosted content differs from reviewed package: '+item.file);
   for(const [key,value]of Object.entries(expectedHeaders))if(response.headers.get(key)!==value)throw Error('Unexpected '+key+' on '+item.file);
   if(item.file.endsWith('.html')&&!response.headers.get('cache-control')?.includes('no-store'))throw Error('HTML cache policy differs.');
   return{path:item.file,status:'pass',hashMatches:true};
  }));checks.push(...results);
 }
 for(const route of ['/backups/admin-rules-baseline-2026-10-31.json','/docs/admin-workflow.md','/firestore.rules','/functions/index.js','/release-manifest.json','/.env']){
  const response=await get(route);if(response.status!==404)throw Error('Private path is not excluded: '+route);checks.push({path:route,status:'pass',httpStatus:404});
 }
 const audio=manifest.files.find(item=>item.file.endsWith('.mp3'));
 if(audio){const response=await get('/'+audio.file,{headers:{Range:'bytes=0-1023'}});const bytes=Buffer.from(await response.arrayBuffer());if(response.status!==206||!response.headers.get('content-range')?.startsWith('bytes 0-1023/')||!bytes.equals(fs.readFileSync(path.join(folder,'public',audio.file)).subarray(0,1024)))throw Error('Audio range playback response differs.');checks.push({path:audio.file,status:'pass',rangeVerified:true});}
 const home=await get('/');if(home.status!==200||hash(Buffer.from(await home.arrayBuffer()))!==manifest.files.find(i=>i.file==='index.html').sha256)throw Error('Root landing page differs.');checks.push({path:'/',status:'pass',hashMatches:true});
 const report={mode:'hosted-preview-get-only',verifiedAt:new Date().toISOString(),url:origin.origin,package:path.relative(root,folder),checks};
 fs.writeFileSync(path.join(root,'docs/validation/hosted-preview-assets-2026-10-31.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({url:report.url,checks:checks.length,allPassed:true},null,2));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
