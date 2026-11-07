// Dedicated loopback-only development launcher. Never uses production Firebase credentials.
const fs=require('node:fs'),path=require('node:path'),{spawn,spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),project='demo-lakbay-local';
const {resolvePackage,createStudentWebServer}=require('./serve-student-web.cjs');
async function main(){
 if(process.argv.includes('--help')){console.log('node tools/start-local-emulator.cjs\nStarts isolated Auth/Firestore emulators, seeds test users/catalog and serves the staged website. Ctrl+C stops.');return;}
 const build=spawnSync(process.execPath,[path.join(root,'functions/build-web-release-local.cjs'),'--build'],{cwd:root,encoding:'utf8',windowsHide:true});
 if(build.status!==0)throw Error(build.stdout+build.stderr);
 const folder=resolvePackage();
 const config=path.join(folder,'emulator-config.json');
 fs.writeFileSync(config,JSON.stringify({firestore:{rules:path.join(root,'firestore.rules')},emulators:{auth:{host:'127.0.0.1',port:9099},firestore:{host:'127.0.0.1',port:8180},ui:{enabled:true,host:'127.0.0.1',port:4000},hub:{host:'127.0.0.1',port:4400},logging:{host:'127.0.0.1',port:4500},singleProjectMode:true}},null,2));
 const cli=path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/bin/firebase.js');
 if(!fs.existsSync(cli))throw Error('Firebase CLI is required.');
 const child=spawn(process.execPath,[cli,'emulators:start','--only','auth,firestore','--project',project,'--config',config],{cwd:root,stdio:['ignore','pipe','pipe'],windowsHide:true});
 child.stdout.on('data',chunk=>process.stdout.write(chunk));child.stderr.on('data',chunk=>process.stderr.write(chunk));
 let exited=false;child.on('exit',()=>{exited=true;});
 const stop=()=>{server?.closeAllConnections();server?.close();if(!exited){if(process.platform==='win32')spawnSync('taskkill',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});else child.kill('SIGINT');}};let server;
 process.on('SIGINT',()=>{stop();});process.on('SIGTERM',stop);
 try{
  let ready=false;
  for(let i=0;i<90;i++){
   if(exited)throw Error('Emulators exited before startup. Check ports and Java.');
   try{const hub=await fetch('http://127.0.0.1:4400/emulators',{signal:AbortSignal.timeout(800)});const running=await hub.json();if(running.auth&&running.firestore){ready=true;break;}}catch{}
   await new Promise(resolve=>setTimeout(resolve,1000));
  }
  if(!ready)throw Error('Emulator startup timed out.');
  const {seedLocalEmulator}=require('./seed-local-emulator.cjs');await seedLocalEmulator();
  server=createStudentWebServer(folder);const fallback=server.listeners('request')[0];server.removeAllListeners('request');
  server.on('request',(request,response)=>{
   const url=new URL(request.url,'http://127.0.0.1');
   if(url.pathname==='/js/firebase-environment.js'){response.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});response.end('export const firebaseEnvironment = {mode:"emulator",projectId:"demo-lakbay-local"};');return;}
   const original=response.writeHead.bind(response);response.writeHead=(code,headers)=>{if(headers?.['Content-Security-Policy'])headers['Content-Security-Policy']=headers['Content-Security-Policy'].replace("connect-src 'self'", "connect-src 'self' http://127.0.0.1:9099 http://127.0.0.1:8180 http://127.0.0.1:5001 ws://127.0.0.1:8180");return original(code,headers);};
   fallback(request,response);
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(4173,'127.0.0.1',resolve);});
  console.log('\nLOCAL EMULATOR WEBSITE: http://127.0.0.1:4173/pages/login.html\nEmulator UI: http://127.0.0.1:4000\nTeacher: teacher@lakbay.local\nStudent: student@lakbay.local\nPassword for both: LakbayLocal123!\nSeparate local data only. Ctrl+C stops. Data resets on restart.');
  child.on('exit',()=>server.close());
 }catch(error){stop();throw error;}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
