// Offline objective-only forward migration. Does not connect to Firebase or publish.
const fs=require('node:fs'),path=require('node:path'),{isDeepStrictEqual:equal}=require('node:util');
const root=path.resolve(__dirname,'..');
function build(snapshot=require('./audit-student-handoff.cjs').catalog().snapshot){
 const revisions=JSON.parse(fs.readFileSync(path.join(root,'data/mission-objective-wording.json'),'utf8'));
 const writes=Object.entries(revisions).map(([id,items])=>{
  const mission=snapshot.collections.missions.find(m=>m.id===id);
  if(!mission||items.length!==5||!equal(mission.learningObjectives,items.map(i=>i.original)))throw Error('Objective baseline changed: '+id);
  for(const item of items){const scene=snapshot.collections.storyScenes.find(s=>s.id===item.sceneId);if(!scene||scene.missionId!==id||!scene.reviewTopics?.includes(item.topic)||!equal(scene.decisionExplanation,item.alignment))throw Error('Alignment baseline changed: '+id);}
  return {path:'missions/'+id,expected:{learningObjectives:items.map(i=>i.original)},fields:{learningObjectives:items.map(i=>i.revised)}};
 });
 if(writes.length!==13)throw Error('Expected exactly 13 missions');
 return {projectId:'lakbaypanahon-1797e',scope:'Priority 1 only: 65 objective sentences in 13 mission documents; no other fields or learner records.',baselineAt:snapshot.auditedAt,writes};
}
function applyToSnapshot(snapshot,plan=build()){
 const candidate=structuredClone(snapshot);
 for(const write of plan.writes){if(!/^missions\/[^/]+$/.test(write.path)||!equal(Object.keys(write.fields),['learningObjectives']))throw Error('Unexpected write scope');const row=candidate.collections.missions.find(m=>m.id===write.path.split('/')[1]);if(!row||!equal(row.learningObjectives,write.expected.learningObjectives))throw Error('Objective conflict: '+write.path);row.learningObjectives=[...write.fields.learningObjectives];}
 return candidate;
}
if(require.main===module){const plan=build();fs.writeFileSync(path.join(root,'data/mission-objective-wording-migration.json'),JSON.stringify(plan,null,2)+'\n');console.log('Built offline objective-only plan: 13 mission documents, 65 sentences. No live data changed.');}
module.exports={build,applyToSnapshot};
