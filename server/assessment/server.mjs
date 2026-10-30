import http from 'node:http';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createAssessmentService} from './core.mjs';
import {createAssessmentStore} from './store.mjs';
import {createAssessmentProcessor,originsAllowed} from './http.mjs';

const workspace=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export function deploymentConfig(env) {
    if(env.ASSESSMENT_ACTIVATION_APPROVED!=='true')throw Error('Trusted assessment activation is not approved.');
    if(env.FIRESTORE_EMULATOR_HOST||env.FIREBASE_AUTH_EMULATOR_HOST||env.FIREBASE_APPCHECK_DEBUG_TOKEN)throw Error('Assessment debug/emulator bypasses are unsupported.');
    if(env.GOOGLE_CLOUD_PROJECT!=='lakbaypanahon-1797e')throw Error('Configure the reviewed Firebase project.');
    const origins=typeof env.ASSESSMENT_ALLOWED_ORIGINS==='string'?env.ASSESSMENT_ALLOWED_ORIGINS.split(',').map(s=>s.trim()):[];
    if(!origins.length||!origins.every(originsAllowed))throw Error('Explicit allowed origins are required.');
    if(env.GOOGLE_APPLICATION_CREDENTIALS){const relative=path.relative(workspace,path.resolve(env.GOOGLE_APPLICATION_CREDENTIALS));if(relative===''||!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative))throw Error('Keep credentials outside the website workspace.');}
    const port=env.PORT===undefined?8081:Number(env.PORT);
    if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid server port.');
    return {projectId:env.GOOGLE_CLOUD_PROJECT,origins,port};
}

export function createNodeHandler(processor,{timeoutMs=15000,maxBytes=65536}={}) {
    return (req,res)=>{
        let settled=false,size=0;const chunks=[];
        const send=result=>{if(settled||res.destroyed)return;settled=true;clearTimeout(timer);res.writeHead(result.status,result.headers||{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(result.body===undefined?undefined:JSON.stringify(result.body));};
        const error=(status,code)=>send({status,body:{error:{code}}});
        const timer=setTimeout(()=>error(504,'assessment/unavailable'),timeoutMs);
        req.on('error',()=>error(400,'assessment/invalid-request'));
        req.once('aborted',()=>{settled=true;clearTimeout(timer);});
        res.once('close',()=>{settled=true;clearTimeout(timer);});
        const counts=new Map();
        for(let i=0;i<(req.rawHeaders||[]).length;i+=2){const key=req.rawHeaders[i].toLowerCase();if(['origin','authorization','x-firebase-appcheck','content-length','content-type'].includes(key))counts.set(key,(counts.get(key)||0)+1);}
        if([...counts.values()].some(n=>n>1)){error(400,'assessment/invalid-request');req.resume();return;}
        const declared=req.headers['content-length'];
        if(declared!==undefined&&(!/^\d+$/.test(declared)||!Number.isSafeInteger(Number(declared))||Number(declared)>maxBytes)){error(413,'assessment/invalid-request');req.resume();return;}
        req.on('data',chunk=>{size+=chunk.length;if(size>maxBytes){error(413,'assessment/invalid-request');req.resume();return;}if(!settled)chunks.push(chunk);});
        req.once('end',async()=>{
            if(settled)return;
            try{
                const url=new URL(req.url,'http://assessment.invalid');
                const body=req.method==='POST'?JSON.parse(Buffer.concat(chunks).toString('utf8')):undefined;
                send(await processor({method:req.method,path:url.pathname,headers:req.headers,body}));
            }catch{error(400,'assessment/invalid-request');}
        });
    };
}

export async function startServer(env=process.env) {
    // No credential loading, database access or listening port before this gate.
    const config=deploymentConfig(env);
    const [{initializeApp,applicationDefault},{getAuth},{getAppCheck},{getFirestore,FieldValue}]=await Promise.all([
        import('firebase-admin/app'),import('firebase-admin/auth'),import('firebase-admin/app-check'),import('firebase-admin/firestore')]);
    const app=initializeApp({projectId:config.projectId,credential:applicationDefault()});
    const service=createAssessmentService(createAssessmentStore(getFirestore(app),()=>FieldValue.serverTimestamp()));
    const processor=createAssessmentProcessor({service,verifyIdToken:(token,revoked)=>getAuth(app).verifyIdToken(token,revoked),verifyAppCheck:token=>getAppCheck(app).verifyToken(token)},{allowedOrigins:config.origins});
    const server=http.createServer({maxHeaderSize:16384},createNodeHandler(processor));
    server.headersTimeout=10000;server.requestTimeout=15000;server.timeout=15000;server.keepAliveTimeout=5000;server.maxRequestsPerSocket=20;server.maxConnections=64;
    server.listen(config.port,'0.0.0.0');return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)startServer().catch(error=>{console.error(error.message);process.exitCode=1;});
