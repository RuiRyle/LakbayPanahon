// Catalog migration for the original project. Dry run by default; --apply commits atomically.
const fs = require('node:fs');
const path = require('node:path');
const auth = require(path.join(process.env.APPDATA, 'npm/node_modules/firebase-tools/lib/auth.js'));
const plan = JSON.parse(fs.readFileSync(path.join(__dirname, process.argv.includes('--lesson-recaps') ? '../data/lesson-recap-migration.json' : process.argv.includes('--practice-feedback') ? '../data/practice-feedback-migration.json' : process.argv.includes('--feedback') ? '../data/question-feedback-migration.json' : '../data/mission-quiz-flow-migration.json'), 'utf8'));
const encode = value => value === null ? {nullValue:null} : typeof value === 'string' ? {stringValue:value}
    : typeof value === 'boolean' ? {booleanValue:value} : typeof value === 'number'
    ? Number.isInteger(value) ? {integerValue:String(value)} : {doubleValue:value}
    : Array.isArray(value) ? {arrayValue:{values:value.map(encode)}} : {mapValue:{fields:fields(value)}};
const fields = data => Object.fromEntries(Object.entries(data).map(([key,value])=>[key,encode(value)]));
const canonical = value => Array.isArray(value) ? value.map(canonical)
    : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])) : value;
const same = (a,b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
async function main() {
    if (plan.projectId !== 'lakbaypanahon-1797e' || process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Original project only.');
    const account = auth.getProjectDefaultAccount(process.cwd());
    if (!account) throw new Error('Run firebase login first.');
    const token = await auth.getAccessToken(account.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform']);
    const headers = {Authorization:'Bearer '+token.access_token, 'Content-Type':'application/json'};
    const base = 'https://firestore.googleapis.com/v1/projects/'+plan.projectId+'/databases/(default)/documents';
    const backup = []; const writes=[];
    for (const item of plan.writes) {
        if (!(process.argv.includes('--lesson-recaps') ? /^missions\/[^/]+$/ : /^(quizzes|questions|practiceQuestions)\/[^/]+$/).test(item.path)) throw new Error('Invalid catalog path.');
        const response = await fetch(base+'/'+item.path,{headers});
        if (!response.ok && response.status !== 404) throw new Error(item.path+' HTTP '+response.status);
        const existing = response.ok ? await response.json() : null;
        const encoded = fields(item.fields);
        if (existing && Object.entries(encoded).every(([key,value])=>same(existing.fields[key], value))) continue;
        if (item.expected && (!existing || Object.entries(fields(item.expected)).some(([key,value])=>!same(existing.fields[key], value)))) throw new Error("Source content changed; review feedback again: " + item.path);
        if (item.create && existing && !process.argv.includes('--revise')) {
            throw new Error('New content already exists with different values: '+item.path);
        }
        if (!item.create && !existing) throw new Error('Missing source document: '+item.path);
        backup.push({path:item.path,document:existing});
        writes.push({update:{name:base.replace('https://firestore.googleapis.com/v1/','')+'/'+item.path,fields:encoded},
            updateMask:{fieldPaths:Object.keys(encoded)}, currentDocument:existing?{updateTime:existing.updateTime}:{exists:false}});
    }
    console.log('Validated '+writes.length+' catalog changes for '+plan.projectId+'. No student records are included.');
    if (!process.argv.includes('--apply')) return;
    const backupPath=path.join(__dirname,'../backups/mission-flow-write-backup-'+Date.now()+'.json');
    fs.writeFileSync(backupPath,JSON.stringify(backup,null,2));
    const response=await fetch(base+':commit',{method:'POST',headers,body:JSON.stringify({writes})});
    if (!response.ok) throw new Error('Atomic commit rejected: HTTP '+response.status+' '+await response.text());
    console.log('Committed '+writes.length+' catalog changes. Backup: '+backupPath);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
