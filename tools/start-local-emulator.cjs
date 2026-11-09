// Dedicated loopback-only development launcher. Never uses production Firebase credentials.
const fs=require('node:fs'),path=require('node:path'),{spawn,spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),project='demo-lakbay-local';
const {resolvePackage,createStudentWebServer}=require('./serve-student-web.cjs');
async function main(){
 if(process.argv.includes('--help')){console.log('node tools/start-local-emulator.cjs --secured\nStarts local Auth/Firestore and the prepared secured assessment Functions. Seeds synthetic student/teacher/admin accounts. No billing or production access. Ctrl+C stops. Use --restore=SNAPSHOT with --secured to resume a backup from build/local-backups. Back up before stopping.');return;}
 if(process.argv.slice(2).some(arg=>arg!=='--secured'&&!/^--restore=[A-Za-z0-9-]+$/.test(arg)))throw Error('Unknown option. Use --help.');
 const secured=process.argv.includes('--secured');
 const restoreOptions=process.argv.slice(2).filter(arg=>arg.startsWith('--restore='));
 if(restoreOptions.length>1)throw Error('Only one local restore snapshot can be selected.');
 const restore=restoreOptions.length?path.join(root,'build/local-backups',restoreOptions[0].slice('--restore='.length)):null;
 if(restore){
  if(!secured)throw Error('Restoring local snapshots requires --secured.');
  const parent=fs.realpathSync(path.join(root,'build/local-backups'));
  if(!fs.realpathSync(restore).startsWith(parent+path.sep))throw Error('Backup resolves outside the local backup directory.');
  const marker=JSON.parse(fs.readFileSync(path.join(restore,'lakbay-local-backup.json'),'utf8'));
  const metadata=JSON.parse(fs.readFileSync(path.join(restore,'firebase-export-metadata.json'),'utf8'));
  if(marker.projectId!==project||marker.secured!==true||!metadata.auth||!metadata.firestore)throw Error('Not a complete secured local backup.');
 }
 const candidate=path.join(root,'build/priority3-stage0-release');
 const runtime=path.join(root,'build/node22/node-v22.23.4-win-x64');
 if(secured){require('../functions/stage0-gcloud-plan.cjs').validateCandidate(candidate);if(!fs.existsSync(path.join(runtime,'node.exe'))||!fs.existsSync(path.join(candidate,'functions/node_modules/firebase-admin')))throw Error('The verified Node 22 runtime and prepared backend dependencies are required for --secured.');}
 // Never reseed an existing demo session or start a second emulator suite.
 let running;
 try{const response=await fetch('http://127.0.0.1:4400/emulators',{signal:AbortSignal.timeout(1200)});if(response.ok)running=await response.json();}catch{}
 if(running?.auth||running?.firestore)throw Error('A local Firebase emulator session is already running. Reuse its website (normally http://127.0.0.1:4173/pages/login.html). Stop the original launcher before starting a fresh session; no accounts or catalog were reseeded.');
 const build=spawnSync(process.execPath,[path.join(root,'functions/build-web-release-local.cjs'),'--build'],{cwd:root,encoding:'utf8',windowsHide:true});
 if(build.error)throw Error('Local website build could not start: '+build.error.message);
 if(build.status!==0)throw Error(String(build.stdout||'')+String(build.stderr||'')||'Local website build exited with status '+build.status);
 const folder=resolvePackage();
 const config=path.join(folder,'emulator-config.json');
 fs.writeFileSync(config,JSON.stringify({firestore:{rules:secured?require('./admin-review-rules.cjs').prepare():path.join(root,'firestore.rules')},...(secured?{functions:[{source:path.relative(folder,path.join(candidate,'functions')).split(path.sep).join('/'),codebase:'local-assessment'}]}:{}),emulators:{auth:{host:'127.0.0.1',port:9099},firestore:{host:'127.0.0.1',port:8180},...(secured?{functions:{host:'127.0.0.1',port:5001}}:{}),ui:{enabled:true,host:'127.0.0.1',port:4000},hub:{host:'127.0.0.1',port:4400},logging:{host:'127.0.0.1',port:4500},singleProjectMode:true}},null,2));
 const cli=path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/bin/firebase.js');
 if(!fs.existsSync(cli))throw Error('Firebase CLI is required.');
 const child=spawn(secured?path.join(runtime,'node.exe'):process.execPath,[cli,'emulators:start','--only',secured?'auth,firestore,functions':'auth,firestore','--project',project,'--config',config,...(restore?['--import',restore]:[])],{cwd:root,env:secured?{...process.env,PATH:runtime+path.delimiter+process.env.PATH}:process.env,stdio:['ignore','pipe','pipe'],windowsHide:true});
 child.stdout.on('data',chunk=>process.stdout.write(chunk));child.stderr.on('data',chunk=>process.stderr.write(chunk));
 let exited=false;child.on('exit',()=>{exited=true;});
 const stop=()=>{server?.closeAllConnections();server?.close();if(!exited){if(process.platform==='win32')spawnSync('taskkill',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});else child.kill('SIGINT');}};let server;
 process.on('SIGINT',()=>{stop();});process.on('SIGTERM',stop);
 try{
  let ready=false;
  for(let i=0;i<90;i++){
   if(exited)throw Error('Emulators exited before startup. Check ports and Java.');
   try{const hub=await fetch('http://127.0.0.1:4400/emulators',{signal:AbortSignal.timeout(800)});const running=await hub.json();if(running.auth&&running.firestore&&(!secured||running.functions)){ready=true;break;}}catch{}
   await new Promise(resolve=>setTimeout(resolve,1000));
  }
  if(!ready)throw Error('Emulator startup timed out.');
  if(secured){
   for(const name of ['startStudentAssessment','advanceStudentAssessment','resumeStudentAssessment','submitStudentActivity']){
    let loaded=false;
    for(let attempt=0;attempt<90&&!exited;attempt++){
     try{
      const response=await fetch('http://127.0.0.1:5001/'+project+'/asia-southeast1/'+name,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:{}}),signal:AbortSignal.timeout(60000)});
      const body=await response.json().catch(()=>null);
      if(response.status===401&&body?.error?.status==='UNAUTHENTICATED'){loaded=true;break;}
      if(response.status!==404&&response.status!==503)throw Error('Endpoint authentication check failed: '+name);
     }catch(error){if(error.message.startsWith('Endpoint authentication'))throw error;}
     await new Promise(resolve=>setTimeout(resolve,1000));
    }
    if(!loaded)throw Error('Secured endpoint startup timed out: '+name);
   }
  }
 if(!restore){const {seedLocalEmulator}=require('./seed-local-emulator.cjs');await seedLocalEmulator({secured});}
  server=createStudentWebServer(folder);const fallback=server.listeners('request')[0];server.removeAllListeners('request');
  server.on('request',(request,response)=>{
   const url=new URL(request.url,'http://127.0.0.1');
   if(url.pathname==='/js/firebase-environment.js'){response.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});response.end('export const firebaseEnvironment = {mode:"emulator",projectId:"demo-lakbay-local"};');return;}
   const original=response.writeHead.bind(response);response.writeHead=(code,headers)=>{if(headers?.['Content-Security-Policy'])headers['Content-Security-Policy']=headers['Content-Security-Policy'].replace("connect-src 'self'", "connect-src 'self' http://127.0.0.1:9099 http://127.0.0.1:8180 http://127.0.0.1:5001 ws://127.0.0.1:8180");return original(code,headers);};
   fallback(request,response);
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(4173,'127.0.0.1',resolve);});
  console.log('\nLOCAL EMULATOR WEBSITE: http://127.0.0.1:4173/pages/login.html\nEmulator UI: http://127.0.0.1:4000\nAdmin: admin@lakbay.local\nTeacher: teacher@lakbay.local\nStudent: student@lakbay.local\nPassword for all three: LakbayLocal123!\nAssessment backend: '+(secured?'secured Functions + protected rules':'not started; use --secured for learning acceptance')+'\nSeparate local data only. Ctrl+C stops. Session data is temporary. Run node tools/backup-local-emulator.cjs before stopping; restore with --secured --restore=SNAPSHOT.');
  child.on('exit',()=>server.close());
 }catch(error){stop();throw error;}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
