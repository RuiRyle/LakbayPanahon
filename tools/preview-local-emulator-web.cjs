// Refresh the local frontend without restarting or reseeding the emulators.
const {resolvePackage,createStudentWebServer}=require('./serve-student-web.cjs');
async function main(){
 const hub=await fetch('http://127.0.0.1:4400/emulators',{signal:AbortSignal.timeout(3000)}).then(r=>r.json());
 if(hub.auth?.port!==9099||hub.firestore?.port!==8180||hub.functions?.port!==5001)throw Error('Start the secured local emulators first.');
 const server=createStudentWebServer(resolvePackage(process.argv[2]));
 const fallback=server.listeners('request')[0];server.removeAllListeners('request');
 server.on('request',(req,res)=>{
  if(new URL(req.url,'http://localhost').pathname==='/js/firebase-environment.js'){res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});res.end('export const firebaseEnvironment={mode:"emulator",projectId:"demo-lakbay-local"};');return;}
  const original=res.writeHead.bind(res);res.writeHead=(code,headers)=>{if(headers?.['Content-Security-Policy'])headers['Content-Security-Policy']=headers['Content-Security-Policy'].replace("connect-src 'self'","connect-src 'self' http://127.0.0.1:9099 http://127.0.0.1:8180 http://127.0.0.1:5001 ws://127.0.0.1:8180");return original(code,headers);};fallback(req,res);
 });
 server.on('error',error=>{console.error(error.message);process.exitCode=1;});
 server.listen(4174,'127.0.0.1',()=>console.log('Updated local preview: http://127.0.0.1:4174/pages/login.html'));
 process.on('SIGINT',()=>{server.closeAllConnections();server.close();});
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
