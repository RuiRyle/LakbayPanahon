// Local authoring/guards only. No network mode, Firebase import or publication.
const fs=require('node:fs'),path=require('node:path'),{isDeepStrictEqual:equal}=require('node:util');
const {buildCandidateCatalog}=require('./student-content-candidate-local.cjs');
const root=path.resolve(__dirname,'..'),file='chapter2-scene-help-migration.json';
const ids=['chap2-mission1-scene1','chap2-mission1-scene4','chap2-mission2-scene2','chap2-mission2-scene3'];
const guardKeys=['missionId','status','order','title','content','reviewTopics'];
function validatePlan(plan){
 if(plan.projectId!=='lakbaypanahon-1797e'||plan.writes?.length!==4||new Set(plan.writes.map(write=>write.path)).size!==4)throw Error('Expected four scoped help updates');
 for(const write of plan.writes){
  if(!ids.some(id=>write.path==='storyScenes/'+id)||write.create!==false||!equal(Object.keys(write.fields||{}),['learningHelp'])||!equal(write.expectedAbsent,['learningHelp']))throw Error('Unexpected field/path/create scope');
  if(!equal(Object.keys(write.expected||{}).sort(),guardKeys.slice().sort())||write.expected.status!=='active')throw Error('Missing exact scene identity/content guards');
  const help=write.fields.learningHelp;
  if(!help||!equal(Object.keys(help).sort(),['explanation','example','guidingQuestion','vocabulary'].sort())||!['explanation','example','guidingQuestion'].every(key=>typeof help[key]==='string'&&help[key].trim())||!help.example.startsWith('Made-up '))throw Error('Missing qualified worked help');
  if(!Array.isArray(help.vocabulary)||!help.vocabulary.length||help.vocabulary.some(word=>!word.term?.trim()||!word.definition?.trim()))throw Error('Missing vocabulary');
 }
 return plan;
}
function compareDocument(write,current){
 if(!current||guardKeys.some(key=>!equal(current[key],write.expected[key])))throw Error('Scene content/identity changed: '+write.path);
 if(equal(current.learningHelp,write.fields.learningHelp))return 'already-applied';
 if(Object.hasOwn(current,'learningHelp'))throw Error('New help was authored since review: '+write.path);
 return 'pending';
}
function buildPlan(){
 const {catalog}=buildCandidateCatalog({excludeFiles:[file]});const content=JSON.parse(fs.readFileSync(path.join(root,'data/chapter2-scene-help.content.json'),'utf8'));
 if(!equal(Object.keys(content).sort(),ids.slice().sort()))throw Error('Unexpected authored help scope');
 const plan=validatePlan({projectId:'lakbaypanahon-1797e',scope:'Four Chapter 2 learningHelp fields only; no grading, choices, body text or reward changes',reviewStatus:'Unpublished editorial draft. Independent teacher/history and Grade 5 review pending.',sources:['docs/validation/learning-content-snapshot.json','data/chapter2-scene-help.content.json'],writes:ids.map(id=>{const current=catalog.get('storyScenes/'+id);if(!current)throw Error('Missing scene '+id);return{path:'storyScenes/'+id,create:false,expected:Object.fromEntries(guardKeys.map(key=>[key,current[key]])),expectedAbsent:['learningHelp'],fields:{learningHelp:content[id]}};})});
 for(const write of plan.writes)compareDocument(write,catalog.get(write.path));return plan;
}
function parseFlags(flags){if(flags.length>1||flags.some(flag=>flag!=='--check'))throw Error('Offline only: use no flag or --check; no publication mode');return flags.includes('--check');}
function main(){const checkOnly=parseFlags(process.argv.slice(2)),plan=buildPlan(),target=path.join(root,'data',file);if(checkOnly){if(!equal(plan,JSON.parse(fs.readFileSync(target,'utf8'))))throw Error('Prepared plan differs from current guarded sources');console.log('PASS: four help-only drafts match exact local guards. Nothing published.');}else{fs.writeFileSync(target,JSON.stringify(plan,null,2)+'\n');console.log('Prepared four guarded learningHelp updates locally. Nothing published.');}}
module.exports={validatePlan,compareDocument,buildPlan,parseFlags};if(require.main===module)try{main();}catch(error){console.error(error.message);process.exitCode=1;}
