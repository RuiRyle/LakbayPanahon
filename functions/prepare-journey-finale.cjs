// Freeze selected journey requirements; never edits lessons or learner progress.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),project='lakbaypanahon-1797e',base='https://firestore.googleapis.com/v1/projects/'+project+'/databases/(default)/documents',draftFile=path.join(root,'data/journey-finale-definition.json');
const encode=v=>v===null?{nullValue:null}:typeof v==='string'?{stringValue:v}:typeof v==='boolean'?{booleanValue:v}:typeof v==='number'?{integerValue:String(v)}:Array.isArray(v)?{arrayValue:{values:v.map(encode)}}:{mapValue:{fields:fields(v)}};
const fields=v=>Object.fromEntries(Object.entries(v).map(([key,value])=>[key,encode(value)]));
const decode=v=>'stringValue'in v?v.stringValue:'booleanValue'in v?v.booleanValue:'integerValue'in v?Number(v.integerValue):'arrayValue'in v?(v.arrayValue.values||[]).map(decode):'mapValue'in v?Object.fromEntries(Object.entries(v.mapValue.fields||{}).map(([k,value])=>[k,decode(value)])):null;
const row=d=>({...Object.fromEntries(Object.entries(d.fields||{}).map(([k,v])=>[k,decode(v)])),id:d.name.split('/').pop()});
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
async function main(){
 const flag=process.argv[2];if(!['--prepare','--publish','--check'].includes(flag)||process.argv.length!==3)throw Error('Choose --prepare (catalog reads), --publish (create only), or --check (readback).');
 const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js')),account=cli.getProjectDefaultAccount(root);if(!account)throw Error('Existing Firebase CLI login required');const token=(await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
 const api=async(url,body)=>{const response=await fetch(url,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});if(response.status===404)return null;if(!response.ok)throw Error('Finale setup HTTP '+response.status);return response.json();};
 const current=await api(base+'/learningSettings/journeyFinale');
 const validate=await import(require('node:url').pathToFileURL(path.join(root,'js/journey-finale-policy.js')).href);
 if(flag==='--check'){
  if(!current)throw Error('Finale definition is not published');const definition=Object.fromEntries(Object.entries(current.fields||{}).map(([k,v])=>[k,decode(v)]));validate.validateFinaleDefinition(definition);
  if(fs.existsSync(draftFile)){const expected=JSON.parse(fs.readFileSync(draftFile,'utf8')).definition;if(!same(fields(expected),current.fields))throw Error('Readback differs from the prepared definition');}
  console.log(JSON.stringify({mode:'finale-definition-readback',chapters:definition.chapters.length,missions:definition.missions.length,finalChapterId:definition.finalChapterId},null,2));return;
 }
 if(current)throw Error('A finale definition already exists. It is not overwritten; use --check and preserve this journey version.');
 const read=async name=>(await api(base+':runQuery',{structuredQuery:{from:[{collectionId:name}],where:{fieldFilter:{field:{fieldPath:'status'},op:'EQUAL',value:{stringValue:'active'}}}}})).filter(item=>item.document).map(item=>row(item.document));
 const [eras,chapters,missions,challenges]=await Promise.all(['eras','chapters','missions','chapterChallenges'].map(read));
 const activeEras=new Set(eras.map(era=>era.id)),prerequisites=new Set(eras.flatMap(era=>Array.isArray(era.requiredChapterIds)?era.requiredChapterIds:[]));
 const selected=chapters.filter(chapter=>activeEras.has(chapter.eraId)&&(chapter.requiredForProgression!==false||prerequisites.has(chapter.id)));
 if(!selected.length||selected.some(chapter=>chapter.contentReady===false))throw Error('Required journey chapters are not ready; no early finale is configured');
 const eraOrder=new Map(eras.map(era=>[era.id,Number(era.order)||0]));selected.sort((a,b)=>eraOrder.get(a.eraId)-eraOrder.get(b.eraId)||(Number(a.order)||0)-(Number(b.order)||0)||a.id.localeCompare(b.id));
 const ids=new Set(selected.map(chapter=>chapter.id));if([...prerequisites].some(id=>!ids.has(id)))throw Error('A required era prerequisite is missing from the journey');
 const requiredMissions=missions.filter(mission=>ids.has(mission.chapterId)).sort((a,b)=>a.chapterId.localeCompare(b.chapterId)||(Number(a.order)||0)-(Number(b.order)||0)||a.id.localeCompare(b.id));
 if(selected.some(chapter=>!requiredMissions.some(m=>m.chapterId===chapter.id)||challenges.filter(c=>c.chapterId===chapter.id).length!==1))throw Error('Every required chapter must have missions and one active final challenge');
 const definition={enabled:true,id:'philippine-history-journey-v1',title:'Your Philippine History Journey',chapters:selected.map(chapter=>({id:chapter.id,title:chapter.title,eraId:chapter.eraId})),missions:requiredMissions.map(mission=>({id:mission.id,chapterId:mission.chapterId})),finalChapterId:selected.at(-1).id};validate.validateFinaleDefinition(definition);
 const signature=crypto.createHash('sha256').update(JSON.stringify(definition)).digest('hex');
 if(flag==='--prepare'){fs.writeFileSync(draftFile,JSON.stringify({definition,signature},null,2));console.log(JSON.stringify({mode:'prepared-only',chapters:selected.length,missions:requiredMissions.length,finalChapterId:definition.finalChapterId,signature},null,2));return;}
 const reviewed=JSON.parse(fs.readFileSync(draftFile,'utf8'));if(reviewed.signature!==signature||JSON.stringify(reviewed.definition)!==JSON.stringify(definition))throw Error('Journey requirements changed since preparation; prepare and review again');
 const backup=path.join(root,'backups','journey-finale-definition-'+Date.now()+'.json');fs.writeFileSync(backup,JSON.stringify({previouslyAbsent:true,definition,signature},null,2),{flag:'wx'});
 await api(base+':commit',{writes:[{update:{name:base.replace('https://firestore.googleapis.com/v1/','')+'/learningSettings/journeyFinale',fields:fields(definition)},currentDocument:{exists:false}}]});
 const after=await api(base+'/learningSettings/journeyFinale');if(!after||!same(after.fields,fields(definition)))throw Error('Finale definition readback differs');
 fs.writeFileSync(path.join(root,'docs/validation/journey-finale-definition-2026-10-31.json'),JSON.stringify({mode:'created-and-read-back',signature,chapters:selected.length,missions:requiredMissions.length,finalChapterId:definition.finalChapterId,backup:path.relative(root,backup)},null,2));console.log('Created and verified the frozen finale definition. No learner data changed.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
