// Offline mapping and bank audit; semantic teaching adequacy still needs review.
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const normalize=s=>String(s||'').trim().toLowerCase().replace(/\s+/g,' ');
function audit(snapshot,bundle){
    const c=snapshot.collections,groups=new Map(),errors=[];
    for(const q of bundle.questions){const f=q.canonicalReviewFields,quiz=c.quizzes.find(x=>x.id===f.quizId);
        if(!quiz){errors.push({path:q.path,reason:'missing-quiz'});continue;}
        const id=quiz.missionId+'#'+f.topic;
        if(!groups.has(id))groups.set(id,{missionId:quiz.missionId,quizId:quiz.id,topic:f.topic,questions:[],quiz});
        groups.get(id).questions.push(q);
    }
    const topics=[...groups.values()].map(g=>{
        const scenes=c.storyScenes.filter(s=>s.status==='active'&&s.missionId===g.missionId&&s.reviewTopics?.includes(g.topic)).sort((a,b)=>a.order-b.order);
        const practice=c.practiceQuestions.filter(p=>p.status==='active'&&p.missionId===g.missionId&&p.topic===g.topic);
        const duplicatePractice=practice.filter(p=>g.questions.some(q=>normalize(q.canonicalReviewFields.question)===normalize(p.question))).map(p=>p.id);
        const reviewDifficulty=g.quiz.practicePolicy?.reviewDifficulty;
        const mapped=!!g.quiz.questionBlueprint?.some(t=>t.topic===g.topic&&t.count===1);
        if(!scenes.length)errors.push({topic:g.topic,reason:'missing-lesson'});
        if(!mapped)errors.push({topic:g.topic,reason:'missing-blueprint-topic'});
        if(g.questions.length<2)errors.push({topic:g.topic,reason:'missing-retry-variant'});
        if(practice.length<2)errors.push({topic:g.topic,reason:'insufficient-distinct-practice-items'});
        if(duplicatePractice.length)errors.push({topic:g.topic,reason:'practice-repeats-main-prompt',ids:duplicatePractice});
        return {missionId:g.missionId,quizId:g.quizId,topic:g.topic,mainQuestions:g.questions.map(q=>q.path),
            mappedScenes:scenes.map(s=>({id:s.id,title:s.title,order:s.order,lessonExcerpt:s.content?.slice(0,250)})),
            practice:practice.map(p=>({id:p.id,difficulty:p.difficulty,question:p.question})),
            requestedReviewDifficulty:reviewDifficulty,hasRequestedReviewDifficulty:practice.some(p=>p.difficulty===reviewDifficulty),
            semanticTeachingReview:'pending',retryCoverage:g.questions.length};
    });
    return {mode:'offline-dated-snapshot',snapshotAt:snapshot.auditedAt,liveStateVerified:false,errors,topics,
        totals:{questions:bundle.questions.length,topics:topics.length,missions:new Set(topics.map(t=>t.missionId)).size,
            topicsWithoutRequestedReviewDifficulty:topics.filter(t=>!t.hasRequestedReviewDifficulty).length},
        limits:['Mappings do not prove the lesson fully teaches the answer','Does not simulate UI navigation or live rewards','Missing easy items are a catalog gap, not proof practice cannot load','Later lesson migrations may change this baseline']};
}
if(require.main===module){const report=audit(require('../docs/validation/learning-content-snapshot.json'),require('../data/question-reconciliation-review.json'));
fs.writeFileSync(path.join(root,'docs/validation/retained-question-alignment-local.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({totals:report.totals,errors:report.errors},null,2));process.exitCode=report.errors.length?1:0;}
module.exports={audit};
