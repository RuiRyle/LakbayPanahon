// Read-only catalog audit using the existing Firebase CLI login. Never prints credentials.
const path = require('node:path');
const auth = require(path.join(process.env.APPDATA, 'npm/node_modules/firebase-tools/lib/auth.js'));
async function main() {
    if(process.env.FIRESTORE_EMULATOR_HOST)throw Error('Original project only.');
    const account = auth.getProjectDefaultAccount(process.cwd());
    if (!account) throw new Error('Sign in with firebase login first.');
    const token = await auth.getAccessToken(account.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform']);
    const headers = { Authorization: 'Bearer ' + token.access_token };
    const base = 'https://firestore.googleapis.com/v1/projects/lakbaypanahon-1797e/databases/(default)/documents';
    const decode = value => 'stringValue' in value ? value.stringValue : 'integerValue' in value ? Number(value.integerValue)
        : 'doubleValue' in value ? value.doubleValue : 'booleanValue' in value ? value.booleanValue
        : 'arrayValue' in value ? (value.arrayValue.values || []).map(decode)
        : 'mapValue' in value ? Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([key, val]) => [key, decode(val)])) : null;
    async function list(name) {
        const docs = []; let cursor = '';
        do {
            const response = await fetch(base + '/' + name + '?pageSize=300' + (cursor ? '&pageToken=' + encodeURIComponent(cursor) : ''), { headers });
            if (!response.ok) throw new Error(name + ' HTTP ' + response.status);
            const data = await response.json();
            for (const doc of data.documents || []) docs.push({ id: doc.name.split('/').at(-1), ...Object.fromEntries(Object.entries(doc.fields || {}).map(([key,val]) => [key, decode(val)])) });
            cursor = data.nextPageToken;
        } while (cursor);
        return docs;
    }
    const names=['eras','chapters','missions','storyScenes','quizzes','questions','practiceQuestions','chapterChallenges','chapterChallengeQuestions'];
    const entries=await Promise.all(names.map(async name=>[name,await list(name)]));
    const snapshot={projectId:'lakbaypanahon-1797e',auditedAt:new Date().toISOString(),collections:Object.fromEntries(entries)};
    require('fs').mkdirSync('docs/validation',{recursive:true});
    require('fs').writeFileSync('docs/validation/learning-content-snapshot.json',JSON.stringify(snapshot,null,2));
    console.log(JSON.stringify(Object.fromEntries(entries.map(([name,rows])=>[name,rows.length]))));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
