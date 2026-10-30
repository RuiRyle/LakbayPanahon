// Offline only: never imports Firebase, authenticates, or executes migration scripts.
const fs = require('node:fs');
const path = require('node:path');
const {isDeepStrictEqual} = require('node:util');
const root = path.join(__dirname, '..');
const allowed = /^(eras|chapters|missions|quizzes|questions|practiceQuestions|storyScenes|chapterChallenges|chapterChallengeQuestions|artifacts|badges)\/[^/]+$/;
function audit(plans, assetExists = name => fs.existsSync(path.join(root, name))) {
    const catalog = new Map(), errors = [], external = new Set(), sequence = [];
    const fail = (file, message) => errors.push({file, message});
    for (const {file, plan} of plans) {
        if (plan.projectId !== 'lakbaypanahon-1797e') fail(file, 'Unexpected project');
        const seen = new Set();
        for (const prerequisite of plan.prerequisites || []) {
            const current = catalog.get(prerequisite.path);
            if (!current) { external.add(prerequisite.path); continue; }
            for (const [key, value] of Object.entries(prerequisite.expected || {}))
                if (!isDeepStrictEqual(current[key], value)) fail(file, 'Prerequisite mismatch: ' + prerequisite.path + '.' + key);
        }
        for (const write of plan.writes || []) {
            if (!allowed.test(write.path)) fail(file, 'Non-curriculum path: ' + write.path);
            if (seen.has(write.path)) fail(file, 'Duplicate write: ' + write.path);
            seen.add(write.path);
            const current = catalog.get(write.path);
            if (write.create && current) fail(file, 'Creation collision: ' + write.path);
            if (!write.create && !current) external.add(write.path);
            if (current) {
                for (const [key, value] of Object.entries(write.expected || {}))
                    if (!isDeepStrictEqual(current[key], value)) fail(file, 'Guard mismatch: ' + write.path + '.' + key);
                for (const key of write.expectedAbsent || [])
                    if (Object.hasOwn(current, key)) fail(file, 'Expected absent field exists: ' + write.path + '.' + key);
            }
            catalog.set(write.path, {...current, ...write.fields});
        }
        const stem = file.replace('-migration.json', '');
        sequence.push({file, applyScript: 'functions/apply-' + stem + '.cjs', writes: seen.size,
            prerequisites: (plan.prerequisites || []).length});
    }
    const entries = collection => [...catalog].filter(([p]) => p.startsWith(collection + '/'));
    for (const [p, mission] of entries('missions')) {
        const id = p.split('/')[1], quizzes = entries('quizzes').filter(([, q]) => q.missionId === id);
        if (!catalog.has('chapters/' + mission.chapterId)) fail(p, 'Missing chapter');
        if (quizzes.length !== 1) fail(p, 'Expected one main quiz');
        const scenes = entries('storyScenes').filter(([, s]) => s.missionId === id);
        if (!scenes.length) fail(p, 'Missing lesson scenes');
        for (const [sp, scene] of scenes) {
            if (scene.imageUrl?.startsWith('../assets/') && !assetExists(scene.imageUrl.slice(3))) fail(sp, 'Missing local image');
        }
        for (const [qp, quiz] of quizzes) {
            const questions = entries('questions').filter(([, q]) => q.quizId === qp.split('/')[1]);
            for (const topic of quiz.questionBlueprint || []) {
                if (questions.filter(([, q]) => q.topic === topic.topic && q.difficulty === topic.difficulty).length < topic.count)
                    fail(qp, 'Insufficient blueprint questions: ' + topic.topic);
                if (!scenes.some(([, s]) => s.reviewTopics?.includes(topic.topic))) fail(qp, 'No mapped lesson: ' + topic.topic);
            }
        }
    }
    for (const [p, challenge] of entries('chapterChallenges')) {
        const questions = entries('chapterChallengeQuestions').filter(([, q]) => q.challengeId === p.split('/')[1]);
        if (questions.length !== 10) fail(p, 'Expected ten challenge activities');
        if (!entries('badges').some(([, b]) => b.chapterId === challenge.chapterId)) fail(p, 'Missing chapter badge');
        for (const [qp, q] of questions) for (const card of q.evidenceTask?.cards || []) {
            const scene = catalog.get('storyScenes/' + card.sceneId);
            if (!scene?.exploreItems?.[card.clueIndex]?.discovery) fail(qp, 'Missing evidence discovery');
        }
    }
    return {mode: 'offline-only', liveStateVerified: false, plans: sequence.length,
        documents: catalog.size, counts: Object.fromEntries(['eras','chapters','missions','storyScenes','quizzes','questions','practiceQuestions','chapterChallenges','chapterChallengeQuestions','artifacts','badges'].map(c => [c, entries(c).length])),
        errors, externalBaselinePaths: [...external].sort(), sequence};
}
function loadPlans() {
    return fs.readdirSync(path.join(root, 'data')).filter(f => /^chapter\d+-(mission\d+|challenge)-migration\.json$/.test(f))
        .sort((a, b) => {
            const key = f => { const m = f.match(/^chapter(\d+)-(?:mission(\d+)|challenge)/); return [Number(m[1]), m[2] ? Number(m[2]) : 1000]; };
            const x = key(a), y = key(b); return x[0] - y[0] || x[1] - y[1];
        }).flatMap(file => file === 'chapter15-mission4-migration.json' ? [file, 'cavite-accounts-migration.json'] : [file]).map(file => ({file, plan: JSON.parse(fs.readFileSync(path.join(root, 'data', file), 'utf8'))}));
}
if (require.main === module) {
    const report = audit(loadPlans());
    fs.writeFileSync(path.join(root, 'docs/validation/publication-local.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({...report, sequence: undefined}, null, 2));
    process.exitCode = report.errors.length ? 1 : 0;
}
module.exports = {audit, loadPlans};
