// Exactly three existing mission content fields. Default is offline validation.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {isDeepStrictEqual:equal}=require('node:util');
const {encode,decode}=require('./apply-chapter1-mission1-learning-polish.cjs');
const root=path.resolve(__dirname,'..'),project='lakbaypanahon-1797e';
const identities=[['chapter-1','mission-1','community-clues'],['chapter-1','mission-2','trade-clues'],['chapter-3','chapter3-mission1','boat-clues']];
function validateCases(cases){
    const context=vm.createContext({URL});
    vm.runInContext(fs.readFileSync(path.join(root,'js/discovery-cases.js'),'utf8').replace(/export /g,''),context);
    if(!Array.isArray(cases)||cases.length!==identities.length)throw Error('Expected three reviewed cases.');
    for(const [i,[chapterId,missionId,id]] of identities.entries()){
        const activity=cases[i];
        if(activity?.id!==id||activity.chapterId!==chapterId||activity.missionId!==missionId||
            !context.validatedDiscoveryCase({id:missionId,chapterId,discoveryCase:activity}))throw Error('Invalid discovery case: '+id);
        encode(activity);
    }
    return true;
}
function compareMission(activity,current){
    if(!current||current.chapterId!==activity.chapterId||current.status!=='active')throw Error('Active mission identity changed: '+activity.missionId);
    if(Object.hasOwn(current,'discoveryCase')){
        if(equal(current.discoveryCase,activity))return 'already-applied';
        throw Error('Existing discovery content differs; review it before overwriting: '+activity.missionId);
    }
    return 'pending';
}
function makeWrite(activity,before){
    const current=decodeDocument(before);
    if(compareMission(activity,current)==='already-applied')return null;
    if(!before.updateTime||before.name!==`projects/${project}/databases/(default)/documents/missions/${activity.missionId}`)throw Error('Missing exact document/update-time guard.');
    return {update:{name:before.name,fields:{discoveryCase:encode(activity)}},updateMask:{fieldPaths:['discoveryCase']},currentDocument:{updateTime:before.updateTime}};
}
function decodeDocument(doc){return doc?Object.fromEntries(Object.entries(doc.fields||{}).map(([key,value])=>[key,decode(value)])):null;}
async function main(){
    const flags=process.argv.slice(2),mode=flags[0]||'--check-local';
    if(flags.length>1||!['--check-local','--inspect','--apply'].includes(mode))throw Error('Use --check-local, --inspect or --apply.');
    const cases=JSON.parse(fs.readFileSync(path.join(root,'data/discovery-cases.json'),'utf8'));validateCases(cases);
    if(mode==='--check-local'){console.log('PASS: three valid cases; only missions/{id}.discoveryCase is publishable. No network.');return;}
    if(process.env.FIRESTORE_EMULATOR_HOST)throw Error('Original project only.');
    const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js')),account=cli.getProjectDefaultAccount(root);
    if(!account)throw Error('Existing Firebase CLI login required.');
    const token=(await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
    const base=`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;
    async function call(url,body){
        const response=await fetch(url,{headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{method:'POST',body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
        if(response.status===404&&!body)return null;
        const value=await response.json();if(!response.ok)throw Error('Firestore HTTP '+response.status+' '+(value.error?.status||''));return value;
    }
    async function read(){const rows=[];for(const activity of cases)rows.push(await call(base+'/missions/'+activity.missionId));return rows;}
    const before=await read(),writes=cases.map((activity,i)=>makeWrite(activity,before[i])).filter(Boolean);
    console.log(JSON.stringify({mode,project,documents:cases.map(activity=>'missions/'+activity.missionId),pending:writes.length,fields:['discoveryCase']}));
    if(mode!=='--apply')return;
    let backup=null;
    if(writes.length){
        backup='backups/discovery-cases-'+Date.now()+'.json';
        fs.writeFileSync(path.join(root,backup),JSON.stringify({project,documents:before},null,2),{flag:'wx'});
        await call(base+':commit',{writes});
    }
    const after=await read();
    for(const [i,activity] of cases.entries()){
        const current=decodeDocument(after[i]);
        if(compareMission(activity,current)!=='already-applied')throw Error('Discovery readback mismatch.');
        const old=decodeDocument(before[i]);delete old.discoveryCase;delete current.discoveryCase;
        if(!equal(old,current))throw Error('Other mission fields changed during publication; inspect before proceeding.');
    }
    const report={publishedAt:new Date().toISOString(),project,mode:'published-and-read-back',changedDocuments:writes.length,verifiedDocuments:cases.length,field:'discoveryCase',backup,learnerRecordsChanged:false,rulesChanged:false};
    fs.writeFileSync(path.join(root,'docs/validation/discovery-cases-publication-2026-11-05.json'),JSON.stringify(report,null,2));
    console.log('PASS: all three mission cases verified; other mission fields preserved.');
}
module.exports={validateCases,compareMission,makeWrite};
if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});
