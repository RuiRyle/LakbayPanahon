// Narrow live rules patch: one public assessment configuration document, no data writes.
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const api='https://firebaserules.googleapis.com/v1/projects/lakbaypanahon-1797e',cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js')),account=cli.getProjectDefaultAccount(process.cwd());
 const token=(await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
 async function call(url,body,method=body?'POST':'GET'){const r=await fetch(url,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const d=await r.json();if(!r.ok)throw Error('Rules API '+r.status);return d;}
 const release=await call(api+'/releases/cloud.firestore'),ruleset=await call('https://firebaserules.googleapis.com/v1/'+release.rulesetName),before=ruleset.source.files[0].content;
 if(ruleset.source.files.length!==1||before.includes('match /learningSettings/securedAssessment'))throw Error('Unexpected/already patched source');
 const marker='    match /learningSettings/journeyFinale {';
 if(before.split(marker).length!==2)throw Error('Missing unique scope marker');
 const source=before.replace(marker,'    match /learningSettings/securedAssessment {\n      allow get: if activeStudent();\n      allow list, write: if false;\n    }\n'+marker);
 const base='/databases/(default)/documents/',scenarios=[['student read','ALLOW','get','student','active'],['anonymous read','DENY','get',null,null],['inactive read','DENY','get','student','inactive'],['teacher read','DENY','get','teacher','active'],['student write','DENY','update','student','active'],['student collection list','DENY','list','student','active']];
 const cases=scenarios.map(([name,expectation,method,role,status])=>({expectation,request:{auth:role?{uid:'fixture',token:{}}:null,path:base+(method==='list'?'learningSettings':'learningSettings/securedAssessment'),method,time:'2026-11-11T00:00:00Z',resource:{data:{enabled:true}}},resource:{data:{enabled:true}},functionMocks:[{function:'get',args:[{exactValue:base+'users/fixture'}],result:{value:{data:{role,status}}}}]}));
 const tested=await call(api+':test',{source:{files:[{name:'firestore.rules',content:source}]},testSuite:{testCases:cases}});
 if((tested.issues||[]).some(x=>x.severity==='ERROR')||tested.testResults?.length!==cases.length||tested.testResults.some(t=>t.state!=='SUCCESS')){console.log(JSON.stringify(tested));throw Error('Synthetic rules checks failed');}
 if(!process.argv.includes('--apply')){console.log('PASS: six synthetic permission checks; add --apply to publish.');return;}
 const backup='build/render-rules-review/backup-'+Date.now()+'.json';fs.writeFileSync(backup,JSON.stringify({release,ruleset},null,2));
 const created=await call(api+'/rulesets',{source:{files:[{name:'firestore.rules',content:source}]}});
 if((await call(api+'/releases/cloud.firestore')).rulesetName!==release.rulesetName)throw Error('Live rules changed during review');
 await call(api+'/releases/cloud.firestore?updateMask=rulesetName',{release:{name:release.name,rulesetName:created.name},updateMask:'rulesetName'},'PATCH');
 const current=await call(api+'/releases/cloud.firestore'),readback=await call('https://firebaserules.googleapis.com/v1/'+current.rulesetName);if(readback.source.files[0].content!==source)throw Error('Readback mismatch');
 fs.writeFileSync('docs/validation/assessment-settings-read-publication-2026-11-11.json',JSON.stringify({publishedAt:new Date().toISOString(),pass:true,tests:scenarios.map(([name,expectation])=>({name,expectation})),scope:'active-student get of learningSettings/securedAssessment only',ruleset:current.rulesetName,backup,dataWritten:false},null,2));console.log('PASS: narrow settings-read fix published and verified. No Firestore data changed.');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
