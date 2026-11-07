'use strict';
// Experimental Lambda-compatible transport. Does not change assessment handlers.
const express=require('express');
const serverless=require('./adapter-deps/node_modules/serverless-http');
const names=['startStudentAssessment','advanceStudentAssessment','resumeStudentAssessment','submitStudentActivity'];
function createHandler(callables){
 if(JSON.stringify(Object.keys(callables).sort())!==JSON.stringify([...names].sort()))throw Error('Exactly four secured SDK callables required');
 if(names.some(name=>typeof callables[name]!=='function'||!callables[name].__endpoint?.callableTrigger))throw Error('Firebase onCall exports required');
 const app=express();app.disable('x-powered-by');app.use((req,res,next)=>{res.set('Cache-Control','no-store');if(req.method!=='OPTIONS'){if(!Buffer.isBuffer(req.body)||req.body.length>65536)return res.status(413).json({error:{status:'INVALID_ARGUMENT'}});try{req.rawBody=req.body;req.body=JSON.parse(req.body.toString('utf8'));}catch{return res.status(400).json({error:{status:'INVALID_ARGUMENT'}});}}next();});
 for(const name of names)app.all('/.netlify/functions/assessment/'+name,callables[name]);
 app.use((req,res)=>res.status(404).json({error:{status:'NOT_FOUND'}}));
 app.use((error,req,res,next)=>res.status(error.status===413?413:400).json({error:{status:'INVALID_ARGUMENT'}}));
 const invoke=serverless(app);
 return async(event,context={})=>{
  for(const key of ['authorization','x-firebase-appcheck'])for(const [name,values]of Object.entries(event.multiValueHeaders||{}))if(name.toLowerCase()===key&&values.length!==1)return{statusCode:400,body:JSON.stringify({error:{status:'INVALID_ARGUMENT'}})};
  if(event.body!=null&&typeof event.body!=='string')return{statusCode:400,body:JSON.stringify({error:{status:'INVALID_ARGUMENT'}})};
  context.callbackWaitsForEmptyEventLoop=false;
  return invoke(event,context);
 };
}
module.exports={createHandler,names};
