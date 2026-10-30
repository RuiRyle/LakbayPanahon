// Compare local authoring files with a dated curriculum snapshot; no network access.
const fs = require('node:fs'), path = require('node:path');
const {isDeepStrictEqual: equal} = require('node:util');
const root = path.join(__dirname, '..');
const curriculum = /^(eras|chapters|missions|quizzes|questions|practiceQuestions|storyScenes|chapterChallenges|chapterChallengeQuestions|artifacts|badges)\/[^/]+$/;
const matches = (document, fields) => !!document && Object.entries(fields || {}).every(([k,v]) => equal(document[k],v));
function classify(document, write) {
    if (matches(document, write.fields)) return 'matches-snapshot';
    if (!document) return write.create ? 'create-not-in-snapshot' : 'baseline-missing';
    if (write.create) return 'create-differs-from-snapshot';
    const expected = write.expected || write.expectedFirestoreFields;
    if (!expected) return 'no-local-guard';
    if (!matches(document, expected) || write.expectedAbsent?.some(k => Object.hasOwn(document,k))) return 'guard-differs-from-snapshot';
    return 'guard-matches-snapshot';
}
function review(snapshot, inputs) {
    const catalog = new Map(Object.entries(snapshot.collections).flatMap(([c,rows]) => rows.map(d => [c+'/'+d.id,d])));
    const owners = new Map(), plans = [], imageCandidates = new Map();
    for (const {file, data} of inputs) {
        const writes = (data.writes || (data.path && data.fields ? [data] : [])).filter(w => curriculum.test(w.path));
        if (!writes.length) continue;
        const statuses = {}, details = [];
        for (const w of writes) {
            if (w.fields?.imageUrl?.startsWith('../assets/')) {
                const candidates = imageCandidates.get(w.path) || [];
                candidates.push({file, imageUrl:w.fields.imageUrl, exists:fs.existsSync(path.join(root,w.fields.imageUrl.slice(3)))});
                imageCandidates.set(w.path,candidates);
            }
            const status = classify(catalog.get(w.path),w);
            statuses[status] = (statuses[status] || 0)+1;
            details.push({path:w.path,status});
            const list = owners.get(w.path) || [];
            list.push({file,fields:Object.keys(w.fields || {})}); owners.set(w.path,list);
        }
        plans.push({file,writes:writes.length,statuses,details});
    }
    const overlappingFields = [...owners].flatMap(([document, writes]) => {
        const fields = new Map();
        for (const w of writes) for (const f of w.fields) fields.set(f,[...(fields.get(f)||[]),w.file]);
        const repeated = [...fields].filter(([,files]) => files.length>1);
        return repeated.length ? [{path:document,fields:Object.fromEntries(repeated)}] : [];
    });
    const chapters = (snapshot.collections.chapters||[]).map(chapter => {
        const missions = (snapshot.collections.missions||[]).filter(m => m.chapterId===chapter.id);
        return {id:chapter.id,missions:missions.map(m => {
            const quizzes=(snapshot.collections.quizzes||[]).filter(q=>q.missionId===m.id);
            const scenes=(snapshot.collections.storyScenes||[]).filter(s=>s.missionId===m.id);
            const topics=quizzes.flatMap(q=>(q.questionBlueprint||[]).map(t=>t.topic));
            return {id:m.id,scenes:scenes.length,quizzes:quizzes.length,
                missingTopicLessons:topics.filter(t=>!scenes.some(s=>s.reviewTopics?.includes(t))),
                missingLocalImages:scenes.filter(s=>s.imageUrl?.startsWith('../assets/')&&!fs.existsSync(path.join(root,s.imageUrl.slice(3)))).map(s=>({id:s.id,
                    authoredCandidates:imageCandidates.get('storyScenes/'+s.id)||[]}))};
        }),challenges:(snapshot.collections.chapterChallenges||[]).filter(c=>c.chapterId===chapter.id).length};
    });
    return {mode:'offline-snapshot-comparison',snapshotAt:snapshot.auditedAt,liveStateVerified:false,
        limitations:['Not a publication order','Snapshot may predate later edits','Overlaps can be intentional revisions','Artifact and badge collections are absent from this snapshot'],
        chapters,plans,overlappingFields};
}
if (require.main === module) {
    const snapshot=JSON.parse(fs.readFileSync(path.join(root,'docs/validation/learning-content-snapshot.json'),'utf8'));
    const inputs=fs.readdirSync(path.join(root,'data')).filter(f=>f.endsWith('.json')&&!/^chapter\d+-/.test(f))
        .map(file=>({file,data:JSON.parse(fs.readFileSync(path.join(root,'data',file),'utf8'))}));
    const report=review(snapshot,inputs);
    fs.writeFileSync(path.join(root,'docs/validation/early-content-local.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({snapshotAt:report.snapshotAt,chapters:report.chapters,plans:report.plans.map(({file,statuses})=>({file,statuses})),overlappingDocuments:report.overlappingFields.length},null,2));
}
module.exports={classify,review};
