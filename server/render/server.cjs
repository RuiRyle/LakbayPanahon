'use strict';
const http=require('node:http'),fs=require('node:fs'),{createRequire}=require('node:module');
const serviceRequire=createRequire(require('node:path').resolve(__dirname,'../../functions/package.json'));
const names={startStudentAssessment:'start',advanceStudentAssessment:'advance',resumeStudentAssessment:'resume',submitStudentActivity:'submit'};
function configuration(env){
 const enabled=env.ASSESSMENT_ENABLED==='true';
 if(!enabled)return {enabled:false,origins:[]};
 if(env.FUNCTIONS_EMULATOR||env.FIRESTORE_EMULATOR_HOST||env.FIREBASE_AUTH_EMULATOR_HOST||env.FIREBASE_APPCHECK_DEBUG_TOKEN)throw Error('Emulator/debug configuration is forbidden on Render.');
 if(env.GOOGLE_CLOUD_PROJECT!=='lakbaypanahon-1797e')throw Error('Configure the intended Firebase project.');
 const origins=(env.ASSESSMENT_ALLOWED_ORIGINS||'').split(',').map(v=>v.trim()).filter(Boolean);
 if(!origins.length||!origins.every(value=>{try{const u=new URL(value);return u.origin===value&&(u.protocol==='https:'||u.protocol==='http:'&&['127.0.0.1','localhost'].includes(u.hostname));}catch{return false;}}))throw Error('Explicit website origins are required.');
 if(env.GOOGLE_APPLICATION_CREDENTIALS!=='/etc/secrets/firebase-service-account.json')throw Error('Configure the Render secret file path.');
 return {enabled:true,origins};
}
function createApp({express,config,callables={}}){
 const app=express();app.disable('x-powered-by');
 app.use((req,res,next)=>{res.set({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});next();});
 app.get('/healthz',(_,res)=>res.json({status:'ok',assessmentEnabled:config.enabled}));
 app.use((req,res,next)=>{
  if(!Object.hasOwn(names,req.path.slice(1)))return res.status(404).json({error:{status:'NOT_FOUND'}});
  if(!config.enabled)return res.status(503).json({error:{status:'UNAVAILABLE',message:'Assessment service is not activated.'}});
  const origin=req.headers.origin;if(!config.origins.includes(origin))return res.status(403).json({error:{status:'PERMISSION_DENIED'}});
  for(const key of ['authorization','x-firebase-appcheck','origin','content-type']){let count=0;for(let i=0;i<req.rawHeaders.length;i+=2)if(req.rawHeaders[i].toLowerCase()===key)count++;if(count>1)return res.status(400).json({error:{status:'INVALID_ARGUMENT'}});}
  if(!['POST','OPTIONS'].includes(req.method))return res.status(405).json({error:{status:'INVALID_ARGUMENT'}});
  next();
 });
 app.use(express.raw({type:'application/json',limit:'64kb'}));
 app.use((req,res,next)=>{if(req.method==='POST'){if(!Buffer.isBuffer(req.body))return res.status(400).json({error:{status:'INVALID_ARGUMENT'}});try{req.rawBody=req.body;req.body=JSON.parse(req.body.toString('utf8'));}catch{return res.status(400).json({error:{status:'INVALID_ARGUMENT'}});}}next();});
 for(const name of Object.keys(names))app.all('/'+name,(req,res)=>callables[name](req,res));
 app.use((error,req,res,next)=>{if(!res.headersSent)res.status(error.type==='entity.too.large'?413:500).json({error:{status:error.type==='entity.too.large'?'INVALID_ARGUMENT':'INTERNAL'}});});
 return app;
}
function productionCallables(config){
 const credential=JSON.parse(fs.readFileSync('/etc/secrets/firebase-service-account.json','utf8'));
 if(credential.type!=='service_account'||credential.project_id!=='lakbaypanahon-1797e')throw Error('Secret file belongs to the wrong Firebase project.');
 const {initializeApp,cert}=serviceRequire('firebase-admin/app');initializeApp({projectId:credential.project_id,credential:cert(credential)});
 const {getFirestore,FieldValue}=serviceRequire('firebase-admin/firestore'),{onCall}=serviceRequire('firebase-functions/v2/https');
 const {assessmentHandlers}=require('../../functions/assessment-callables');
 const handlers=assessmentHandlers(getFirestore(),()=>FieldValue.serverTimestamp());
 return Object.fromEntries(Object.entries(names).map(([name,method])=>[name,onCall({enforceAppCheck:true,cors:config.origins},handlers[method])]));
}
function start(env=process.env){const config=configuration(env),express=serviceRequire('express');const app=createApp({express,config,callables:config.enabled?productionCallables(config):{}});const port=Number(env.PORT||10000);if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid PORT.');const server=http.createServer({maxHeaderSize:16384},app);server.headersTimeout=15000;server.requestTimeout=120000;server.listen(port,'0.0.0.0');return server;}
module.exports={configuration,createApp,start};
if(require.main===module)try{start();}catch{console.error('Assessment startup failed. Verify project, allowed origins and secret-file configuration.');process.exitCode=1;}
