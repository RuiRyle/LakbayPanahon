// Editorial evidence index only. No Firebase imports, network calls or writes.
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const review=read('data/grade5-coverage-review.json');
const baseline=read('docs/validation/learning-content-snapshot.json');
const catalog=new Map();
for(const [name,rows]of Object.entries(baseline.collections))
    for(const row of rows)catalog.set(name+'/'+row.id,{...row,provenance:'dated-snapshot'});
// Explicit local revisions: evidence of authored content, not live revision proof.
const early=['roadmap-chapter34-migration','geography-pilot-migration','formation-pilot-migration',
    'archaeology-pilot-migration','population-pilot-migration','barangay-scene-enrichment',
    'barangay-scenario-quiz','livelihood-learning-migration','social-roles-learning-migration',
    'beliefs-learning-migration','islam-exchange-learning-migration','balangay-learning-migration',
    'trade-networks-learning-migration','goods-exchange-learning-migration','maritime-centers-learning-migration',
    'writing-learning-migration','craft-learning-migration','diversity-learning-migration','heritage-learning-migration'];
function overlay(name){
    const plan=read('data/'+name+'.json');
    const writes=plan.writes||(plan.path&&plan.fields?[plan]:[]);
    for(const write of writes){
        if(!write.path||!write.fields)continue;
        catalog.set(write.path,{...catalog.get(write.path),...write.fields,id:write.path.split('/')[1],provenance:name});
    }
}
for(const name of early)overlay(name);
const later=fs.readdirSync(path.join(root,'data')).filter(f=>/^chapter\d+-(mission\d+|challenge)-migration\.json$/.test(f))
    .sort((a,b)=>{const rank=f=>{const m=f.match(/chapter(\d+)-(?:mission(\d+)|(challenge))/);return +m[1]*100+(m[3]?99:+m[2]);};return rank(a)-rank(b);});
for(const file of later)overlay(file.slice(0,-5));
overlay('cavite-accounts-migration');
// Local teaching drafts; provenance must not be mistaken for publication.
overlay('chapter2-family-learning-polish-migration');
overlay('chapter2-women-role-learning-migration');
const entries=name=>[...catalog].filter(([key])=>key.startsWith(name+'/')).map(([key,row])=>({...row,path:key}));
const missions=entries('missions'),scenes=entries('storyScenes'),quizzes=entries('quizzes'),questions=entries('questions'),practice=entries('practiceQuestions');
const errors=[];
const competencies=review.competencies.map(item=>({
    ...item,
    evidence:item.missions.map(id=>{
        const mission=missions.find(m=>m.id===id);
        if(!mission)errors.push('Unknown mission '+id+' in '+item.id);
        const units=scenes.filter(s=>s.missionId===id&&s.status==='active').sort((a,b)=>a.order-b.order);
        const banks=quizzes.filter(q=>q.missionId===id&&q.status==='active');
        const bankIds=new Set(banks.map(q=>q.id));
        const main=questions.filter(q=>bankIds.has(q.quizId)&&q.status==='active');
        return {missionId:id,title:mission?.title,
            scenes:units.map(s=>({path:s.path,title:s.title,topics:s.reviewTopics||[],excerpt:s.content?.slice(0,250),provenance:s.provenance})),
            mainQuestions:main.map(q=>({path:q.path,topic:q.topic,prompt:q.question})),
            practiceQuestions:practice.filter(q=>q.missionId===id&&q.status==='active').map(q=>({path:q.path,topic:q.topic,difficulty:q.difficulty})),
            note:'Candidate evidence for editorial review. A whole mission is not proof that every part of this competency is taught.'};
    })
}));
const namedTargets=[
 ['suez','Suez Canal',/\bsuez\b/i],['middle-class','Middle class',/middle[- ]class|panggitnang uri|ilustrado/i],
 ['secularization','Parish reform',/seculari[sz]ation|pelaez|pilipinisasyon/i],
 ['gomburza','GOMBURZA',/gomburza|gomes.{0,35}burgos/i],
 ['propaganda','Propaganda Movement',/propaganda movement|kilusang propaganda/i],
 ['solidaridad','La Solidaridad',/solidaridad/i],['liga','La Liga Filipina',/liga filipina/i],
 ['de-la-torre','De la Torre',/de ?la torre/i],['ilaya-ilawud','Ilaya and Ilawud',/ilaya|ilawud/i],
 ['core-population','Core Population model',/core population/i]
].map(([id,label,pattern])=>({id,label,
    lessonMentions:scenes.filter(s=>s.status==='active'&&pattern.test([s.title,s.content].join(' '))).map(s=>({path:s.path,title:s.title})),
    assessmentMentions:questions.filter(q=>q.status==='active'&&pattern.test([q.question,q.optionA,q.optionB,q.optionC,q.optionD].join(' '))).map(q=>({path:q.path,prompt:q.question})),
    interpretation:'Text presence is a locator only; it does not establish instructional depth or aligned assessment.'}));
const counts=Object.fromEntries(['mapped','partial','missing'].map(status=>[status,competencies.filter(c=>c.status===status).length]));
const report={date:review.reviewDate,generatedAt:new Date().toISOString(),mode:'offline-editorial-review',liveCurriculumRead:false,
    baselineAt:baseline.auditedAt,source:review.sourceUrl,inspectedCopy:review.inspectedCopy,sourceLimit:review.sourceLimit,
    limitation:'Early chapter evidence combines a dated live snapshot with selected local enrichment. Later chapters use the published authoring plans. No current live curriculum was fetched and no school alignment or learning effectiveness is certified.',
    counts,errors,competencies,namedTargets,
    crossCuttingGaps:['Multiple-choice decisions and report frames do not verify a learner-created presentation or advocacy product.',
        'Source caution is often repeated; assess concrete people, places, chronology and consequences as well.',
        'The four eras are navigation groups, not four school quarters: the first era spans much of quarters 1 and 2.']};
const target=path.join(root,'docs/validation/grade5-coverage-local.json');
fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({competencies:competencies.length,counts,errors,namedTargets:namedTargets.map(t=>({id:t.id,lessonMentions:t.lessonMentions.length,assessmentMentions:t.assessmentMentions.length}))},null,2));
if(errors.length)process.exitCode=1;
