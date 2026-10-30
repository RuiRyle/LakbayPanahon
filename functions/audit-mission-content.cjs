// Read-only catalog audit using the existing Firebase CLI login. Never prints credentials.
const path = require('node:path');
const auth = require(path.join(process.env.APPDATA, 'npm/node_modules/firebase-tools/lib/auth.js'));
async function main() {
    const account = auth.getProjectDefaultAccount(process.cwd());
    if (!account) throw new Error('Sign in with firebase login first.');
    const token = await auth.getAccessToken(account.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform']);
    const headers = { Authorization: 'Bearer ' + token.access_token };
    if (process.argv.includes('--billing')) {
        const response = await fetch('https://cloudbilling.googleapis.com/v1/projects/lakbaypanahon-1797e/billingInfo', {headers});
        if (!response.ok) throw new Error('Billing check HTTP ' + response.status);
        const info = await response.json(); console.log(JSON.stringify({projectId: info.projectId, billingEnabled: info.billingEnabled})); return;
    }
    if (process.argv.includes('--rules-check')) {
        const rulesBase='https://firebaserules.googleapis.com/v1/projects/lakbaypanahon-1797e';
        const release=await fetch(rulesBase+'/releases/cloud.firestore',{headers});
        if(!release.ok)throw new Error('Rules release HTTP '+release.status);
        const releaseData=await release.json();
        const current=await fetch('https://firebaserules.googleapis.com/v1/'+releaseData.rulesetName,{headers});
        if(!current.ok)throw new Error('Rules source HTTP '+current.status);
        const source=await current.json();
        require('fs').writeFileSync('backups/firestore-rules-before-mission-flow.json',JSON.stringify({release:releaseData,source},null,2));
        require('fs').writeFileSync('backups/firestore-rules-before-mission-flow.rules',source.source.files[0].content);
        const result=await fetch(rulesBase+':test',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({source:{files:[{name:'firestore.rules',content:require('fs').readFileSync('firestore.rules','utf8')}]},testSuite:{testCases:[]}})});
        if(!result.ok)throw new Error('Rules validation HTTP '+result.status+' '+await result.text());
        console.log(JSON.stringify(await result.json(),null,2));return;
    }
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
    if (process.argv.includes('--missions')) { console.log(JSON.stringify(await list('missions'),null,2)); return; }
    const [quizzes, questions, practice] = await Promise.all(['quizzes','questions','practiceQuestions'].map(list));
    if (process.argv.includes('--snapshot')) { require('fs').mkdirSync('backups', {recursive:true}); require('fs').writeFileSync('backups/mission-quiz-catalog-before.json', JSON.stringify({quizzes,questions,practice},null,2)); console.log('Saved catalog backup: backups/mission-quiz-catalog-before.json'); return; }
    if (process.argv.includes('--details')) { console.log(JSON.stringify({quizzes, questions, practice}, null, 2)); return; }
    console.log(JSON.stringify(quizzes.filter(q => q.status === 'active').map(quiz => {
        const bank = questions.filter(q => q.quizId === quiz.id && q.status === 'active');
        const review = practice.filter(q => q.missionId === quiz.missionId && q.status === 'active');
        const counts = bank.reduce((result,q) => { const key = JSON.stringify([q.topic || null,q.difficulty || null]); result[key] = (result[key] || 0)+1; return result; }, {});
        return { quizId: quiz.id, missionId: quiz.missionId, questionCount: quiz.questionCount, passingScore: quiz.passingScore,
            questionBlueprint: quiz.questionBlueprint, practicePolicy: quiz.practicePolicy, bankSize: bank.length, coverage: counts,
            practiceCount: review.length, practiceTopics: [...new Set(review.map(q=>q.topic || null))] };
    }), null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
