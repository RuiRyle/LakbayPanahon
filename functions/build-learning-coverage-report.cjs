// Offline structural checks plus an explicitly separate editorial assessment.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const snapshot = require('../docs/validation/learning-content-snapshot.json');
const review = require('../data/learning-coverage-editorial-review.json');
const d = snapshot.collections;
const active = rows => rows.filter(row => row.status === 'active');
const words = text => String(text || '').trim().split(/\s+/).filter(Boolean).length;
const missions = active(d.missions).map(m => {
    const scenes = active(d.storyScenes).filter(s => s.missionId === m.id).sort((a,b) => Number(a.order)-Number(b.order));
    const quizzes = active(d.quizzes).filter(q => q.missionId === m.id);
    const questions = active(d.questions).filter(q => quizzes.some(quiz => quiz.id === q.quizId));
    const practice = active(d.practiceQuestions).filter(q => q.missionId === m.id);
    const topicIds = [...new Set([...questions.map(q => q.topic), ...practice.map(q => q.topic), ...scenes.flatMap(s => s.reviewTopics || [])].filter(Boolean))];
    const topics = topicIds.map(topic => {
        const mapped = scenes.filter(s => s.reviewTopics?.includes(topic));
        return { topic, sceneIds: mapped.map(s => s.id), sceneTitles: mapped.map(s => s.title),
            questionIds: questions.filter(q => q.topic === topic).map(q => q.id),
            practiceQuestionIds: practice.filter(q => q.topic === topic).map(q => q.id),
            practiceDifficulties: [...new Set(practice.filter(q => q.topic === topic).map(q => q.difficulty))],
            finding: mapped.length ? 'Mapped; instructional depth needs editorial review' : 'No active review-topic scene mapping' };
    });
    const images = scenes.map(s => {
        const url = s.imageUrl || '';
        const local = url.startsWith('../assets/') ? url.slice(3) : null;
        return { sceneId:s.id, imageUrl:url, localFileExists:local ? fs.existsSync(path.join(root, local)) : null };
    });
    return { missionId:m.id, chapterId:m.chapterId, title:m.title, objectives:m.learningObjectives || [m.learningObjective].filter(Boolean),
        sceneCount:scenes.length, questionCount:questions.length, practiceCount:practice.length,
        repeatedClueScenes:scenes.filter(s => s.exploreItems?.length && s.exploreItems.every(item => item.discovery && s.content?.includes(item.discovery))).map(s => s.id),
        readingWords:scenes.map(s => ({sceneId:s.id,bodyWords:words(s.content)})), images, topics,
        editorial:review.missions.find(r => r.missionId === m.id) || {gap:'Not editorially reviewed'} };
}).sort((a,b) => (d.chapters.find(c=>c.id===a.chapterId)?.order || 0)-(d.chapters.find(c=>c.id===b.chapterId)?.order || 0)
    || (d.missions.find(m=>m.id===a.missionId)?.order || 0)-(d.missions.find(m=>m.id===b.missionId)?.order || 0));
const topicRows = missions.flatMap(m => m.topics.map(t => ({missionId:m.missionId,...t})));
const summary = { activeMissions:missions.length, activeScenes:missions.reduce((n,m)=>n+m.sceneCount,0),
    quizQuestions:missions.reduce((n,m)=>n+m.questionCount,0), practiceQuestions:missions.reduce((n,m)=>n+m.practiceCount,0),
    topics:topicRows.length, unmappedTopics:topicRows.filter(t=>!t.sceneIds.length).length,
    topicsWithoutQuiz:topicRows.filter(t=>!t.questionIds.length).length,
    topicsWithoutPractice:topicRows.filter(t=>!t.practiceQuestionIds.length).length,
    missingLocalImages:missions.flatMap(m=>m.images).filter(i=>i.localFileExists===false).length,
    repeatedClueScenes:missions.reduce((n,m)=>n+m.repeatedClueScenes.length,0) };
const result = { auditedAt:snapshot.auditedAt, projectId:snapshot.projectId,
    scope:'Original Firestore curriculum only; no student records, no writes',
    interpretation:'Topic mapping and document counts do not certify instructional completeness, Grade 5 comprehension, historical accuracy, or mastery.',summary,missions };
fs.writeFileSync(path.join(root,'data/learning-coverage-audit.json'),JSON.stringify(result,null,2));
const table = ['| Mission | Scenes | Quiz bank | Practice | Editorial priority |','| --- | ---: | ---: | ---: | --- |',
    ...missions.map(m=>`| ${m.title} (${m.missionId}) | ${m.sceneCount} | ${m.questionCount} | ${m.practiceCount} | ${m.editorial.priority} |`)].join('\n');
const matrix = ['# Topic-to-lesson audit','',`Snapshot: ${snapshot.auditedAt}. Tags indicate intended links, not proof that the teaching is sufficient.`,'',
    '| Mission / topic | Teaching scenes | Quiz variants | Practice variants / difficulties |','| --- | --- | ---: | --- |',
    ...topicRows.map(t=>`| ${t.missionId} / ${t.topic} | ${t.sceneIds.join(', ') || 'MISSING'} | ${t.questionIds.length} | ${t.practiceQuestionIds.length}: ${t.practiceDifficulties.join(', ')} |`)].join('\n');
fs.writeFileSync(path.join(root,'docs/validation/learning-topic-matrix.md'),matrix+'\n');
const report = `# Student learning-content coverage audit

Audit date: ${snapshot.auditedAt}. Read-only snapshot of the original Firestore curriculum; no learner data was read or modified.

## Finding

The current build implements the project roadmap's Era 1 prologue and Chapters 1–4, but it is not a complete Grade 5 Philippine-history course. Chapters 5–14 in Eras 2–4 are not present in this snapshot. Even Era 1 needs instructional expansion: having a topic tag, a scene and a question is not enough evidence of understanding.

There are ${summary.activeMissions} active missions, ${summary.activeScenes} scenes, ${summary.quizQuestions} quiz-bank questions and ${summary.practiceQuestions} practice questions. Of ${summary.topics} distinct mission/topic pairs, ${summary.unmappedTopics} lack a scene mapping, ${summary.topicsWithoutQuiz} lack quiz questions and ${summary.topicsWithoutPractice} lack practice. This establishes navigation coverage only. The five-topic blueprints were authoring choices, not competency validation. Each main quiz still selects five questions from its bank.

${summary.missingLocalImages} configured local scene images are missing from the workspace at audit time. Artwork must teach a relevant detail; attractive backgrounds alone cannot replace a map, labelled diagram or evidence card.

In ${summary.repeatedClueScenes} scenes every exploration discovery is an exact excerpt already in the scene body. Opening these clues is interaction, but does not add a new observation or test an interpretation. Many new distractors make implausible absolute claims, letting students eliminate answers without understanding the history. These are editorial findings, not measured item-difficulty results.

## Topics outside the main quiz blueprint

Four mapped practice/review topics have no main-quiz question carrying the same topic ID:

${topicRows.filter(t=>!t.questionIds.length).map(t=>'- '+t.missionId+' / '+t.topic+' (scenes: '+t.sceneIds.join(', ')+')').join('\n')}

These are additional practice topics, not proof of four missing quiz questions: the configured five-slot quiz blueprints may assess related ideas under another tag. Reconcile topic meanings before adding questions or changing passing rules. Otherwise some practice can appear unrelated to the diagnosis. Topic IDs need semantic review, not automatic merging.

## Roadmap and curriculum boundary

The comparison uses the user's Final Grade 5 Learning Roadmap v1.1 attachment: four prologue missions, thirteen missions in Chapters 1–4, and ten future chapters. All seventeen planned Era 1 mission titles have counterparts in the live catalog. Future chapters are absent, not partially completed.

The [published DepEd Grade 5 reference](https://lrmds.deped.gov.ph/detail/15672) explicitly includes geography/climate and island formation alongside early societies and colonial history. The current geography mission has no explicit tropical-climate objective; formation explains shoreline change without explicitly teaching continental shelf. These need an alignment decision and sourced teaching. This reference is a legacy K–12 portal listing, not certification of alignment to the currently applicable curriculum. The project's teacher must confirm the intended curriculum version and competency codes before an approval claim.

## Mission inventory

P1 = next instructional expansion; P2 = retain core explanation and strengthen examples/comparison. Neither label means teacher-approved or ready for classroom release.

${table}

## Editorial review by mission

${missions.map(m=>`### ${m.title} — ${m.editorial.priority}\n\nScene IDs: ${m.topics.flatMap(t=>t.sceneIds).filter((id,i,a)=>a.indexOf(id)===i).join(', ')}.\n\nCurrently taught: ${m.editorial.taught}\n\nGap / change: ${m.editorial.gap}\n\nEvidence students should demonstrate: ${m.editorial.nextEvidence}`).join('\n\n')}

## Recommended implementation order

1. Expand Prologue Mission 1 first: an actual labelled map, guided example, learner location task, then a recap. Decide where tropical location/climate belongs. Keep the existing mission ID and completion records.
2. Expand formation and archaeology with labelled diagrams, site cards and chronological context; then scaffold population-history explanations with two supplied sources.
3. Add sourced concrete examples to Asian trade, goods, ports, writing, crafts and regional diversity. Reuse examples in the heritage synthesis so learning builds across missions.
4. Revise questions after teaching is expanded. Keep the agreed five-question, three-correct mission rule, but assess the new objectives; extra questions in the bank do not create missing teaching. Use plausible misconceptions and worked feedback. Topic-matched retries are not empirically proven equivalent difficulty.
5. Review the complete content with the teacher and actual Grade 5 learners before describing it as educationally validated. Add scene counts only when the objectives require them; avoid another fixed scene quota.

Do not make AI responsible for missing core instruction or allow it to supply assessed facts that are absent from authored lessons. Authored explanation, hints and review must work without an AI response. No AI integration changes are part of this audit.

## Reproduce and inspect

Run node functions/audit-learning-coverage.cjs to refresh the read-only live snapshot, then node functions/build-learning-coverage-report.cjs to regenerate this report and the topic matrix. The report combines structural checks with the explicit editorial review in data/learning-coverage-editorial-review.json; it does not infer comprehension from word counts. The snapshot covers curriculum collections only. No content has been changed by this task.

See [every topic-to-scene/question mapping](validation/learning-topic-matrix.md) and data/learning-coverage-audit.json for the machine-readable evidence. Semantic answer alignment and distractor quality were sampled editorially, not independently validated question by question. Classroom outcomes and the currently applicable curriculum remain unverified.
`;
fs.writeFileSync(path.join(root,'docs/student-content-coverage-audit.md'),report);
console.log(JSON.stringify(summary,null,2));
