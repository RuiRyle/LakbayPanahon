const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..'),feedback=require('../data/student-feedback-completion.cjs');
function publishedBaseline(){return require('./audit-student-handoff.cjs').catalog(false,true,true,false).snapshot;}
function build(snapshot=publishedBaseline()){
 const d=snapshot.collections,writes=[],letters=['A','B','C','D'];
 const put=(collection,row,fields)=>{const {id,...expected}=row;writes.push({path:collection+'/'+id,create:false,expected,expectedAbsent:Object.keys(fields).filter(k=>!Object.hasOwn(expected,k)),fields});};
 const groups=new Map();for(const [id,values] of Object.entries(feedback)){const row=d.practiceQuestions.find(q=>q.id===id);if(!row||values.length!==4)throw Error('Missing authored feedback row');const key=JSON.stringify(letters.map(k=>row['option'+k]));if(groups.has(key))throw Error('Duplicate option group');groups.set(key,{row,values});}
 for(const row of d.practiceQuestions.filter(q=>q.status==='active'&&!letters.every(k=>q.answerExplanations?.[k]))){const group=groups.get(JSON.stringify(letters.map(k=>row['option'+k])));if(!group||group.row.correctAnswer!==row.correctAnswer)throw Error('Unreviewed practice options '+row.id);const explanation=Object.fromEntries(letters.map((k,i)=>[k,k===row.correctAnswer?row.explanation:group.values[i]]));if(!Object.values(explanation).every(v=>typeof v==='string'&&v.trim())||new Set(Object.values(explanation)).size!==4)throw Error('Feedback incomplete');put('practiceQuestions',row,{answerExplanations:explanation});}
 const tagalog='https://www.gutenberg.org/files/13701/13701-h/13701-h.htm',ritual='https://www.nationalmuseum.gov.ph/our-collections/ethnology/ritual-objects/',islam='https://bcpch.bangsamoro.gov.ph/sulu/';
 const references={
 'chap2-mission1-scene1':[tagalog], 'chap2-mission1-scene4':[tagalog],
 'chap2-mission2-scene2':[ritual], 'chap2-mission2-scene3':[ritual],
 'chap2-mission3-scene1':['https://www.nationalmuseum.gov.ph/our-collections/ethnology/ritual-objects/'],
 'chap2-mission3-scene3':[islam],
 'mission1-scene1':[tagalog], 'mission1-scene2':[tagalog], 'mission1-scene3':[tagalog], 'mission1-scene4':[tagalog], 'mission1-scene5':[tagalog], 'mission1-scene6':[tagalog],
 'mission2-scene4':['https://www.nationalmuseum.gov.ph/our-collections/ethnology/ritual-objects/']
 };
 for(const [id,urls] of Object.entries(references)){const row=d.storyScenes.find(s=>s.id===id);if(!row||row.sourceUrls?.length)throw Error('Expected missing scene reference '+id);put('storyScenes',row,{sourceUrls:urls});}
 return {projectId:'lakbaypanahon-1797e',baselineAt:snapshot.auditedAt,scope:'49 practice feedback maps and 13 contextual scene reference lists only. No wording, assessment keys, policies or learner changes.',writes};
}
function validatePlan(plan){if(plan.projectId!=='lakbaypanahon-1797e'||plan.writes?.length!==62||new Set(plan.writes.map(w=>w.path)).size!==62)throw Error('Expected 62 reviewed documents');for(const w of plan.writes){const allowed=w.path.startsWith('practiceQuestions/')?['answerExplanations']:w.path.startsWith('storyScenes/')?['sourceUrls']:[];if(w.create!==false||w.expected?.status!=='active'||Object.keys(w.fields).length!==1||!allowed.includes(Object.keys(w.fields)[0]))throw Error('Out of scope');}return true;}
if(require.main===module){const p=build();validatePlan(p);fs.writeFileSync(path.join(root,'data/student-content-completion-migration.json'),JSON.stringify(p,null,2));console.log('Prepared 62 guarded feedback/reference updates. Nothing published.');}
module.exports={build,publishedBaseline,validatePlan};
