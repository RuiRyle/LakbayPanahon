// Explicit original-project publication. Each child preserves its own guards,
// preconditions, backup, atomic commit and readback verification.
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.join(__dirname, '..');
if (!process.argv.includes('--apply')) throw Error('Use --apply only for an authorized publication run.');
if (process.env.FIRESTORE_EMULATOR_HOST) throw Error('Original project only.');
const order = name => {
    const match = name.match(/chapter(\d+)-(?:mission(\d+)|(challenge))/);
    return Number(match[1]) * 100 + (match[3] ? 99 : Number(match[2]));
};
const plans = fs.readdirSync(__dirname)
    .filter(name => /^apply-chapter(7|8|9|10|11|12|13|14)-(mission\d+|challenge)\.cjs$/.test(name))
    .sort((a,b) => order(a)-order(b));
const folder = path.join(root, 'docs/validation');
fs.mkdirSync(folder,{recursive:true});
const report = {projectId:'lakbaypanahon-1797e',startedAt:new Date().toISOString(),releases:[],complete:false};
const reportPath = path.join(folder,'chapters7-14-publication-live.json');
for (const plan of plans) {
    const release = {script:plan,checks:[]};report.releases.push(release);
    for (const args of [[],['--apply']]) {
        const result = spawnSync(process.execPath,[path.join(__dirname,plan),...args],{
            cwd:root,encoding:'utf8',windowsHide:true,timeout:120000
        });
        const check = {mode:args.length?'apply':'dry-run',exitCode:result.status,output:(result.stdout||'').trim(),error:(result.stderr||result.error?.message||'').trim()};
        release.checks.push(check);
        fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
        process.stdout.write(plan+' '+check.mode+': '+check.output+'\n');
        if(result.status!==0){process.stderr.write(check.error+'\n');process.exit(1);}
    }
}
report.complete=true;report.finishedAt=new Date().toISOString();
fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
console.log('Published and verified '+plans.length+' releases.');
