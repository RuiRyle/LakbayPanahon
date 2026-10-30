// Build a guarded, seven-document migration from authored data and the reviewed local baseline.
// This command reads local files only. It never connects to Firebase.
const fs = require('node:fs');
const path = require('node:path');
const {validatePlan, buildLocalCatalog} = require('./apply-chapter2-family-learning-polish.cjs');

const root = path.join(__dirname, '..');
const sourceFile = path.join(root, 'data/chapter2-family-learning-polish.content.json');
const outputFile = path.join(root, 'data/chapter2-family-learning-polish-migration.json');

function build() {
    const source = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
    const {snapshot, catalog} = buildLocalCatalog();
    const writes = source.writes.map(({path: documentPath, fields}) => {
        const current = catalog.get(documentPath);
        if (!current || current.id !== documentPath.split('/')[1]) {
            throw Error('Missing reviewed local document: ' + documentPath);
        }
        const {id, ...expected} = current;
        const expectedAbsent = Object.keys(fields).filter(key => !Object.hasOwn(expected, key));
        return {path: documentPath, create: false, expected, expectedAbsent, fields};
    });
    const plan = {
        projectId: source.projectId,
        scope: source.scope,
        sourceNote: source.sourceNote,
        sourceUrls: source.sourceUrls,
        baselineSource: 'docs/validation/learning-content-snapshot.json',
        baselineAt: snapshot.auditedAt,
        overlaySources: [
            'data/social-roles-learning-migration.json',
            'data/chapter2-reading-polish-migration.json',
            'data/chapter2-feedback-polish-migration.json',
            'data/chapter2-beginner-practice-migration.json'
        ],
        publicationStatus: 'local-draft-not-published',
        writes
    };
    validatePlan(plan);
    fs.writeFileSync(outputFile, JSON.stringify(plan, null, 2) + '\n', {encoding: 'utf8'});
    return {outputFile, writes: writes.length, baselineAt: snapshot.auditedAt};
}

if (require.main === module) {
    try { console.log(JSON.stringify(build(), null, 2)); }
    catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = {build};
