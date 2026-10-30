// Read-only audit of the adaptive question publication state.
const fs = require('node:fs');
const path = require('node:path');
const auth = require(path.join(process.env.APPDATA, 'npm/node_modules/firebase-tools/lib/auth.js'));
const manifestPaths = [
    '../data/mission1-adaptive-quiz-question-drafts.json',
    '../data/other-missions-adaptive-quiz-question-drafts.json'
];
const items = manifestPaths.flatMap(file => {
    const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf8').replace(/^\uFEFF/, ''));
    if (manifest.projectId !== 'lakbaypanahon-1797e') throw Error('Unexpected project in draft manifest.');
    return manifest.writes.map(write => write.path);
});
const quizIds = [...new Set(manifestPaths.flatMap(file => {
    const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf8').replace(/^\uFEFF/, ''));
    return manifest.writes.map(write => write.fields.quizId);
}))];

async function main() {
    const account = auth.getProjectDefaultAccount(process.cwd());
    if (!account) throw Error('Run firebase login first.');
    const token = await auth.getAccessToken(account.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform']);
    const headers = {Authorization: 'Bearer ' + token.access_token};
    const base = 'https://firestore.googleapis.com/v1/projects/lakbaypanahon-1797e/databases/(default)/documents';
    const states = {active: 0, draft: 0, missing: 0, other: 0};
    const quizStates = {active: 0, inactive: 0, missing: 0};
    let cursor = 0;
    if (!process.argv.includes('--quizzes-only')) {
        const workers = Array.from({length: 20}, async () => {
            while (cursor < items.length) {
                const pathIndex = cursor++;
                const response = await fetch(`${base}/${items[pathIndex]}`, {headers});
                if (response.status === 404) {
                    states.missing++;
                    continue;
                }
                if (!response.ok) throw Error(`${items[pathIndex]} HTTP ${response.status}`);
                const document = await response.json();
                const status = document.fields?.status?.stringValue;
                if (Object.hasOwn(states, status)) states[status]++;
                else states.other++;
            }
        });
        await Promise.all(workers);
    }

    const quizResponse = await fetch(`${base}/quizzes?pageSize=1000`, {headers});
    if (!quizResponse.ok) throw Error(`quizzes collection HTTP ${quizResponse.status}`);
    const quizPage = await quizResponse.json();
    const currentQuizzes = new Map((quizPage.documents || []).map(document => [
        document.name.split('/').at(-1), document
    ]));
    for (const id of quizIds) {
        const quiz = currentQuizzes.get(id);
        if (!quiz) quizStates.missing++;
        else if (quiz.fields?.status?.stringValue === 'active') quizStates.active++;
        else quizStates.inactive++;
    }
    console.log(JSON.stringify({projectId: 'lakbaypanahon-1797e', questions: {total: items.length, ...states}, quizzes: {total: quizIds.length, ...quizStates}}, null, 2));
}

main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
});
