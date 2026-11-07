// Reuse unchanged policy/legacy assertions against the new configuration package.
const fs=require('fs'),path=require('path'),Module=require('module'),original=path.join(__dirname,'priority3-pilot-checks.cjs');let source=fs.readFileSync(original,'utf8');
const fixture=path.join(__dirname,'priority3-pilot-load.cjs'), fixtureModule=new Module(fixture,module);fixtureModule.filename=fixture;fixtureModule.paths=Module._nodeModulePaths(__dirname);require.cache[fixture]=fixtureModule;
fixtureModule._compile(fs.readFileSync(fixture,'utf8').replaceAll('build/priority3-release/functions/package.json','build/priority3-stage0-release/functions/package.json'),fixture);
source=source.replaceAll('build/priority3-release/functions/package.json','build/priority3-stage0-release/functions/package.json').replaceAll('priority-3-pilot-policy-legacy-checks-2026-11-07.json','priority-3-stage0-policy-legacy-checks-2026-11-07.json');
const dailyRecovery=`
 const quotaDate=new Date(now+8*3600000).toISOString().slice(0,10);
 await load.db.doc('serverAssessmentUsage/'+u.uid+'_'+quotaDate).update({count:60,minute:Math.floor(now/60000),minuteCount:0});
 assert.equal((await service.start(u.uid,requests[0])).attemptId,states[0].attemptId);
 await assert.rejects(service.start(u.uid,{...load.identity,requestId:randomUUID()}),e=>e.code==='assessment/rate-limit');
 checks.push('Same issuance request recovers at daily cap 60 while a new request is denied');
`;
if(!source.includes(' const later=createAssessmentService'))throw Error('Quota suite shape changed');
source=source.replace(' const later=createAssessmentService',dailyRecovery+' const later=createAssessmentService');
const compiled=new Module(original,module);compiled.filename=original;compiled.paths=Module._nodeModulePaths(__dirname);compiled._compile(source,original);
