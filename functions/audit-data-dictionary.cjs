// Checks documentation against independent rule/client references and the
// offline published catalog. No Firebase connection or learner data is used.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {inventory,runtime}=require('./data-dictionary-inventory.cjs');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const document=read('docs/data-dictionary-academic.md'),rules=read('firestore.rules');
const observed=inventory(),issues=[],references=new Set();
for(const m of rules.matchAll(/match \/([A-Za-z]+)\//g))if(m[1]!=='databases')references.add(m[1]);
for(const file of fs.readdirSync(path.join(root,'js')).filter(f=>f.endsWith('.js'))){
 const text=read('js/'+file);
 for(const m of text.matchAll(/(?:collection|doc)\(\s*db\s*,\s*['"]([^'"]+)['"]/g))references.add(m[1]);
}
for(const name of references)if(!document.includes('`'+name+'/'))issues.push('Missing collection: '+name);
const ruleFields=[...rules.matchAll(/(?:hasOnly|hasAll)\(\[([\s\S]*?)\]\)/g)].flatMap(m=>[...m[1].matchAll(/'([^']+)'/g)].map(x=>x[1]));
for(const field of new Set(ruleFields))if(!document.includes(field))issues.push('Missing rule field: '+field);
let catalogPaths=0,runtimePaths=0;
for(const [collection,fields]of Object.entries(observed.schemas))for(const field of Object.keys(fields)){
 catalogPaths++;
 if(!document.includes('`'+field+'`'))issues.push('Missing catalog path: '+collection+'.'+field);
}
for(const [structure,fields]of Object.entries(runtime))for(const field of Object.keys(fields)){
 runtimePaths++;
 if(!document.includes('`'+field+'`'))issues.push('Missing runtime path: '+structure+'.'+field);
}
const tables=[...document.matchAll(/^### Table (\d+)$/gm)].map(m=>Number(m[1]));
if(!tables.length||tables.some((n,i)=>n!==i+7))issues.push('Invalid table numbering');
for(const line of document.split('\n').filter(l=>l.startsWith('|')))if(line.split('|').length!==7)issues.push('Malformed five-column row: '+line);
for(const label of ['question prompt/type fields','matching/task fields','image metadata'])if(document.includes('| '+label+' |'))issues.push('Unexpanded placeholder: '+label);
const sourceFiles=['firestore.rules','docs/data-dictionary.md','data/avatar-catalog.json','data/artifact-learning-details.json','docs/validation/learning-content-snapshot-2026-10-31.json','functions/prepare-data-dictionary.cjs','functions/data-dictionary-inventory.cjs','functions/audit-data-dictionary.cjs',...fs.readdirSync(path.join(root,'js')).filter(f=>f.endsWith('.js')).map(f=>'js/'+f),'functions/index.js','server/bayani/usage.cjs','server/bayani/core.cjs'];
const report={checkedOn:'2026-11-03',mode:'offline-documentation-coverage',status:issues.length?'fail':'pass',tables:tables.length,collectionReferences:[...references].sort(),ruleFieldNames:[...new Set(ruleFields)].sort(),catalogFieldPaths:catalogPaths,runtimeFieldPaths:runtimePaths,baselineAt:observed.baselineAt,publicationProofs:observed.proofs,catalogSchemas:observed.schemas,runtimeSchemas:runtime,sourceHashes:Object.fromEntries(sourceFiles.map(f=>[f,crypto.createHash('sha256').update(read(f)).digest('hex')])),documentSha256:crypto.createHash('sha256').update(document).digest('hex'),issues,limits:['Offline checked-in code and dated catalog with verified overlays; not a fresh live database export.','Rule/client reference checks prove name presence; nested writer types and meanings require editorial review.','Firebase SDK internals, secret environment values, migration bookkeeping, test fixtures and backups are not application entities.','Inactive backend and proposed profile extensions are explicitly separated from implemented records.']};
fs.writeFileSync(path.join(root,'docs/validation/data-dictionary-audit-2026-11-03.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,tables:tables.length,collectionReferences:references.size,catalogFieldPaths:catalogPaths,runtimeFieldPaths:runtimePaths,issues},null,2));
if(issues.length)process.exitCode=1;
