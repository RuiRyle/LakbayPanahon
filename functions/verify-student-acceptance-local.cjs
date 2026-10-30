// Fixed local/mocked acceptance checks. Never invokes live tests, Firebase CLI or an emulator.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),planFile=path.join(root,'docs/student-acceptance-plan.json');
const plan=JSON.parse(fs.readFileSync(planFile,'utf8'));
if(process.argv.slice(2).some(arg=>arg!=='--browser'))throw Error('Only optional --browser is supported. No live mode.');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
const suites=[...new Set(plan.suiteGroups.flatMap(group=>group.tests))];
if(suites.some(file=>!/^[-a-z0-9]+\.test\.cjs$/.test(file)||file==='student-security.test.cjs'))throw Error('Unsupported suite; the emulator security suite is excluded.');
if(plan.browserFixtures.some(file=>!/^[-a-z0-9]+-browser\.cjs$/.test(file)||file.includes('live')))throw Error('Unsupported browser fixture.');
const run=(args,timeout)=>{const result=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',timeout,maxBuffer:8*1024*1024,windowsHide:true});return{exitCode:result.status,error:result.error?.message||null,output:(result.stdout||'')+'\n'+(result.stderr||'')};};
const startedAt=new Date().toISOString(),unit=run(['--test','--test-isolation=none',...suites.map(file=>'tests/'+file)],120000);
const count=name=>{const match=unit.output.match(new RegExp('(?:ℹ|#) '+name+' (\\d+)'));return match?Number(match[1]):null;};
const unitsPassed=unit.exitCode===0&&count('fail')===0&&count('tests')>0;
const browser=[];
if(process.argv.includes('--browser'))for(const file of plan.browserFixtures){const result=run(['tests/'+file],40000);const summary=result.output.split(/\r?\n/).find(line=>line.startsWith('PASS:')||line.startsWith('FAIL:'))||result.error||'No browser result';browser.push({file,status:result.exitCode===0&&summary.startsWith('PASS:')?'pass':'fail',summary});console.log(file+': '+summary);}
const report={startedAt,finishedAt:new Date().toISOString(),planVersion:plan.version,mode:'local-mocked-only',planSha256:hash('docs/student-acceptance-plan.json'),units:{status:unitsPassed?'pass':'fail',suites:suites.length,tests:count('tests'),passed:count('pass'),failed:count('fail'),skipped:count('skipped'),error:unit.error},browser:{status:!process.argv.includes('--browser')?'not-run':browser.every(row=>row.status==='pass')?'pass':'fail',fixtures:browser},criteria:plan.suiteGroups.map(group=>({id:group.criterion,status:unitsPassed?'local-suite-pass':'inspect-suite-failure',tests:group.tests})),sources:plan.sourceFiles.map(file=>({file,sha256:hash(file)})),completion:'NOT COMPLETE: local checks cannot close live saves, normal-mode confirmation, privacy, human learning review, classroom integration or deployment.'};
const output=path.join(root,'docs/validation/student-acceptance-local.json');fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({units:report.units,browser:report.browser.status,report:path.relative(root,output)},null,2));
if(!unitsPassed){console.error(unit.output.slice(-10000));process.exitCode=1;}if(browser.some(row=>row.status==='fail'))process.exitCode=1;
