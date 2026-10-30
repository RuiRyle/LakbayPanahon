// Shared offline candidate only; no Firebase, credentials or publication.
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
function buildCandidateCatalog({excludeFiles=[]}={}){
const baseline=read('docs/validation/learning-content-snapshot.json');
const catalog=new Map(Object.entries(baseline.collections).flatMap(([name,rows])=>rows.map(row=>[name+'/'+row.id,row])));
const inputs=[];
function overlay(file){if(excludeFiles.includes(file))return;const plan=read('data/'+file);inputs.push(file);for(const w of plan.writes||(plan.path&&plan.fields?[plan]:[]))if(w.path&&w.fields)catalog.set(w.path,{...catalog.get(w.path),...w.fields,id:w.path.split('/')[1]});}
for(const stem of ['roadmap-chapter34-migration','geography-pilot-migration','formation-pilot-migration','archaeology-pilot-migration','population-pilot-migration','barangay-scene-enrichment','barangay-scenario-quiz','livelihood-learning-migration','social-roles-learning-migration','beliefs-learning-migration','islam-exchange-learning-migration','balangay-learning-migration','trade-networks-learning-migration','goods-exchange-learning-migration','maritime-centers-learning-migration','writing-learning-migration','craft-learning-migration','diversity-learning-migration','heritage-learning-migration'])overlay(stem+'.json');
for(const {file} of require('./audit-publication-local.cjs').loadPlans())overlay(file);
overlay('early-scene-image-repairs-migration.json');overlay('easy-review-gaps-migration.json');overlay('chapter2-beginner-practice-migration.json');overlay('chapter2-reading-polish-migration.json');overlay('chapter2-scene-quality-migration.json');overlay('chapter2-feedback-polish-migration.json');overlay('chapter3-decision-quality-migration.json');overlay('chapter4-learning-polish-migration.json');overlay('chapter5-continuation-wording-migration.json');overlay('chapter6-help-polish-migration.json');
overlay('chapter1-mission1-learning-polish-migration.json');
overlay('chapter1-mission1-practice-polish-migration.json');
overlay('mission2-easy-review-migration.json');
overlay('chapter2-family-learning-polish-migration.json');
overlay('chapter2-women-role-learning-migration.json');
overlay('chapter2-scene-help-migration.json');
return {baseline,catalog,inputs};
}
module.exports={buildCandidateCatalog};
