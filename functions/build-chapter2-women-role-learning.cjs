// Local authoring only; no Firebase credentials or network access.
const fs = require('node:fs');
const path = require('node:path');
const {buildLocalCatalog,validatePlan} = require('./apply-chapter2-women-role-learning.cjs');
const root = path.join(__dirname,'..');
function build() {
    const source = JSON.parse(fs.readFileSync(path.join(root,'data/chapter2-women-role-learning.content.json'),'utf8'));
    const {snapshot,catalog} = buildLocalCatalog();
    const writes = source.writes.map(({path:documentPath,fields}) => {
        const current = catalog.get(documentPath);
        if (!current || current.id !== documentPath.split('/')[1]) throw Error('Missing baseline: '+documentPath);
        const {id,...expected} = current;
        return {path:documentPath,create:false,expected,
            expectedAbsent:Object.keys(fields).filter(key=>!Object.hasOwn(expected,key)),fields};
    });
    const plan = {...source,baselineAt:snapshot.auditedAt,publicationStatus:'local-draft-not-published',writes};
    validatePlan(plan);
    fs.writeFileSync(path.join(root,'data/chapter2-women-role-learning-migration.json'),JSON.stringify(plan,null,2)+'\n');
    return {documents:writes.length,status:plan.publicationStatus};
}
module.exports={build};
if(require.main===module)try{console.log(JSON.stringify(build()));}catch(error){console.error(error.message);process.exitCode=1;}
