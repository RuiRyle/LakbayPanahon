// Offline-only review. Does not contact Firebase or publish anything.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const root = path.resolve(__dirname,'..'), hash = value => crypto.createHash('sha256').update(value).digest('hex');
const normalize = value => value.replace(/\r\n/g,'\n');
const allowed = new Set(['function activeTeacher','function ownsClass','function activeOwnedMember','function teacherCanReport','function validPublication',
    'match /classJoinCodes/{code}','match /classes/{classId}','match /classMembers/{membershipId}',
    'match /classAssignments/{assignmentId}','match /classAnnouncements/{announcementId}','match /teacherStudentLinks/{linkId}',
    'match /users/{userId}','match /{catalog}/{contentId}','match /studentProgress/{progressId}','match /studentQuizAttempts/{attemptId}']);
function scopes(source) {
    const result = new Map(); let outside = '', cursor = 0;
    for (const match of source.matchAll(/^(?:    )?(?:function |match )[^\n]+/gm)) {
        if (match.index < cursor) continue;
        const line = match[0], key = line.trim().startsWith('function ')
            ? 'function '+line.trim().slice(9).split('(')[0] : line.trim().slice(0,line.trim().lastIndexOf(' {'));
        const open = match.index + (key.startsWith('function ') ? line.indexOf('{') : line.lastIndexOf('{'));
        let depth = 0, quote = null, end;
        for (let i=open;i<source.length;i++) {
            const c=source[i];
            if(quote){if(c==='\\')i++;else if(c===quote)quote=null;continue;}
            if(c==='"'||c==="'"){quote=c;continue;}
            if(c==='{')depth++;
            if(c==='}'&&!--depth){end=i+1;break;}
        }
        if(!end)throw Error('Unclosed scope '+key);
        if(result.has(key))throw Error('Duplicate scope '+key);
        outside += source.slice(cursor,match.index);
        result.set(key,source.slice(match.index,end));cursor=end;
    }
    outside += source.slice(cursor);
    return {result,outside:outside.split('\n').filter(line=>line.trim()).join('\n')};
}
function main() {
    const proof = JSON.parse(fs.readFileSync(path.join(root,'docs/validation/journey-finale-rules-publication-2026-10-31.json'),'utf8'));
    const backup = JSON.parse(fs.readFileSync(path.join(root,proof.backup),'utf8'));
    const finale = '    match /learningSettings/journeyFinale {\n      allow get: if activeStudent();\n      allow list, write: if false;\n    }\n';
    const baseline = normalize(backup.ruleset.source.files[0].content).replace('    function rewardUpdate() {',finale+'    function rewardUpdate() {');
    if(hash(baseline)!==proof.sourceHash)throw Error('Reconstructed last-published baseline does not match publication proof.');
    const raw = fs.readFileSync(path.join(root,'firestore.rules'),'utf8'), candidate = normalize(raw);
    const before = scopes(baseline), after = scopes(candidate);
    if(before.outside!==after.outside)throw Error('Changes outside named rule scopes require review.');
    const changed = [...new Set([...before.result.keys(),...after.result.keys()])].filter(key=>before.result.get(key)!==after.result.get(key));
    if(changed.some(key=>!allowed.has(key)))throw Error('Unreviewed scope changes: '+changed.filter(key=>!allowed.has(key)).join(', '));
    const local = JSON.parse(fs.readFileSync(path.join(root,'docs/validation/teacher-workflow-emulator-2026-10-31.json'),'utf8'));
    if(local.sourceHash!==hash(raw)||!local.steps.length||local.steps.some(step=>step.status!=='pass'))throw Error('Matching local integration checks required.');
    const report = {mode:'offline-reviewed-candidate-not-published',preparedAt:new Date().toISOString(),baselineSourceHash:hash(baseline),baselineRuleset:proof.rulesetName,sourceHash:hash(raw),outsideScopeMatches:true,changedScopes:changed,localChecks:local.steps.length};
    fs.writeFileSync(path.join(root,'docs/validation/teacher-rules-review-2026-10-31.json'),JSON.stringify(report,null,2));
    fs.writeFileSync(path.join(root,'docs/teacher-rules-review.md'),'# Teacher permission changes\n\nThis is an offline comparison against the recorded pre-teacher publication baseline, not a fresh live release read. Current activation status is recorded in teacher-workflow.md and the publication evidence. All changes are confined to the scopes below; quiz/reward write checks and independent student access are preserved.\n\n'+changed.map(key=>'## '+key+'\n\nBefore:\n```\n'+(before.result.get(key)||'(absent)')+'\n```\n\nAfter:\n```\n'+(after.result.get(key)||'(absent)')+'\n```\n').join('\n'));
    console.log(JSON.stringify(report,null,2));
}
if(require.main===module)main();
module.exports={scopes};
