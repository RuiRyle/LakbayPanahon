// Assign image references for newly authored scenes. Images remain static assets;
// Firestore owns the explicit scene-to-image mapping. Dry run unless --apply.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
async function main() {
    if (process.env.FIRESTORE_EMULATOR_HOST) throw Error('Original database only.');
    const plans = ['prologue-migration.json', 'roadmap-chapter34-migration.json'];
    const targets = [...new Set(plans.flatMap(file => require(path.join(root, 'data', file)).writes
        .filter(w => w.path.startsWith('storyScenes/') && w.fields.missionId)
        .map(w => w.path)))];
    const cli = require(path.join(process.env.APPDATA, 'npm/node_modules/firebase-tools/lib/auth.js'));
    const account = cli.getProjectDefaultAccount(root);
    if (!account) throw Error('Firebase login required.');
    const token = await cli.getAccessToken(account.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform']);
    const base = 'https://firestore.googleapis.com/v1/projects/lakbaypanahon-1797e/databases/(default)/documents';
    const headers = { Authorization: 'Bearer ' + token.access_token, 'Content-Type': 'application/json' };
    async function call(url, body) {
        const response = await fetch(url, { headers, ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}) });
        const data = await response.json();
        if (!response.ok) throw Error('Firestore ' + response.status + ': ' + (data.error?.message || 'request failed'));
        return data;
    }
    const documents = [];
    for (let i = 0; i < targets.length; i += 10) documents.push(...await Promise.all(targets.slice(i, i + 10).map(p => call(base + '/' + p))));
    const writes = [], backup = [], manifest = [];
    for (const document of documents) {
        const id = document.name.split('/').pop();
        const current = document.fields.imageUrl;
        const assigned = current?.stringValue?.trim();
        if (current && current.stringValue === undefined && !current.nullValue) throw Error('Unexpected imageUrl type: ' + id);
        const filename = id + '.png';
        const imageUrl = assigned || '../assets/story/' + filename;
        const localPath = imageUrl.startsWith('../assets/story/') ? imageUrl.slice(3) : null;
        manifest.push({ sceneId: id, title: document.fields.title?.stringValue || '', imageUrl,
            preserved: !!assigned, file: localPath, fileExists: localPath ? fs.existsSync(path.join(root, localPath)) : null });
        if (assigned) continue;
        backup.push(document);
        writes.push({ update: { name: document.name, fields: { imageUrl: { stringValue: imageUrl } } },
            updateMask: { fieldPaths: ['imageUrl'] }, currentDocument: { updateTime: document.updateTime } });
    }
    fs.writeFileSync(path.join(root, 'data/story-image-manifest.json'), JSON.stringify({ projectId: 'lakbaypanahon-1797e', scenes: manifest }, null, 2));
    console.log(JSON.stringify({ scenes: manifest.length, fieldsToAdd: writes.length, preserved: manifest.filter(x => x.preserved).length,
        missingLocalImages: manifest.filter(x => x.fileExists === false).length, mode: process.argv.includes('--apply') ? 'apply' : 'dry-run' }));
    if (!process.argv.includes('--apply')) return;
    if (writes.length) {
        const folder = path.join(root, 'backups'); fs.mkdirSync(folder, { recursive: true });
        fs.writeFileSync(path.join(folder, 'story-images-' + Date.now() + '.json'), JSON.stringify(backup, null, 2));
        await call(base + ':commit', { writes });
    }
    for (let i = 0; i < manifest.length; i += 10) await Promise.all(manifest.slice(i, i + 10).map(async item => {
        const document = await call(base + '/storyScenes/' + item.sceneId);
        if (document.fields.imageUrl?.stringValue !== item.imageUrl) throw Error('Readback failed: ' + item.sceneId);
    }));
    console.log('Verified all image references. Existing images and learner records preserved.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
