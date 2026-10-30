import {AssessmentError} from './core.mjs';

const originsAllowed=value=>{
    try {const url=new URL(value);return url.origin===value&&!url.username&&!url.password&&
        (url.protocol==='https:'||url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname));}catch{return false;}
};
export function createAssessmentProcessor({verifyIdToken,verifyAppCheck,service},{allowedOrigins}) {
    if(!Array.isArray(allowedOrigins)||!allowedOrigins.length||!allowedOrigins.every(originsAllowed))throw Error('Explicit allowed origins are required.');
    return async ({method,path,headers={},body})=>{
        const origin=headers.origin;
        const responseHeaders={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};
        const reply=(status,code,result)=>({status,headers:responseHeaders,body:result??{error:{code}}});
        if(typeof origin!=='string'||!allowedOrigins.includes(origin))return reply(403,'assessment/forbidden');
        responseHeaders['Access-Control-Allow-Origin']=origin;
        if(!['/api/assessment/start','/api/assessment/submit'].includes(path))return reply(404,'assessment/not-found');
        if(method==='OPTIONS')return {...reply(204),headers:{...responseHeaders,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, X-Firebase-AppCheck, Content-Type'},body:undefined};
        if(method!=='POST')return reply(405,'assessment/invalid-request');
        if(typeof headers['content-type']!=='string'||!/^application\/json(?:\s*;|$)/i.test(headers['content-type']))return reply(415,'assessment/invalid-request');
        const bearer=typeof headers.authorization==='string'?headers.authorization.match(/^Bearer ([A-Za-z0-9_.-]{1,16384})$/):null;
        if(!bearer||typeof headers['x-firebase-appcheck']!=='string'||!headers['x-firebase-appcheck']||headers['x-firebase-appcheck'].length>16384)return reply(401,'assessment/unauthenticated');
        try {
            let identity;
            try{identity=await verifyIdToken(bearer[1],true);await verifyAppCheck(headers['x-firebase-appcheck']);}
            catch{return reply(401,'assessment/unauthenticated');}
            const result=await service[path.endsWith('/start')?'start':'submit'](identity?.uid,body);
            return reply(200,null,result);
        }catch(error){
            const code=error instanceof AssessmentError?error.code:'assessment/unavailable';
            const status=code==='assessment/rate-limit'?429:code==='assessment/unauthenticated'?401:
                ['assessment/forbidden','assessment/locked'].includes(code)?403:code==='assessment/invalid-request'?400:
                ['assessment/attempt-conflict','assessment/attempt-expired','assessment/content-changed'].includes(code)?409:503;
            return reply(status,code);
        }
    };
}
export {originsAllowed};
