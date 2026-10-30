const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../functions/audit-web-release-local.cjs'), 'utf8');
const fixtureRoot = path.resolve(__dirname, 'release-fixture-not-created');

function inventory(reference) {
    const reads = [];
    let report;
    const fakeFs = {
        existsSync() { return true; },
        readdirSync() { return []; },
        readFileSync(absolute) {
            const file = path.relative(fixtureRoot, absolute).replaceAll('\\','/');
            reads.push(file);
            return file === 'index.html' ? `<script src="${reference}"></script>` : '';
        },
        writeFileSync(_, value) { report = JSON.parse(value); }
    };
    const process = {exitCode:0};
    vm.runInNewContext(source, {
        __dirname:path.join(fixtureRoot,'functions'),
        require(name) { if (name === 'node:fs') return fakeFs; if (name === 'node:path') return path; throw Error(name); },
        console:{log() {}}, process
    });
    return {report, reads, exitCode:process.exitCode};
}

test('public dependency inventory rejects server code before reading or selecting it', () => {
    const result = inventory('server/bayani/server.cjs');
    assert.equal(result.exitCode, 1);
    assert.equal(result.report.rejected.length, 1);
    assert.equal(result.report.files.some(file => file.startsWith('server/')), false);
    assert.equal(result.reads.some(file => file.startsWith('server/')), false);
    assert.ok(result.report.excluded.includes('server/'));
});

test('supported server JavaScript is rejected while public client modules remain publishable', () => {
    const blocked = inventory('server/bayani/accidental-secret.js');
    assert.equal(blocked.report.rejected.length, 1);
    assert.equal(blocked.reads.includes('server/bayani/accidental-secret.js'), false);
    const allowed = inventory('js/bayani-backend-client.js');
    assert.equal(allowed.exitCode, 0);
    assert.equal(allowed.report.rejected.length, 0);
    assert.ok(allowed.report.files.includes('js/bayani-backend-client.js'));
});

test('private authoring, function and validation directories remain outside the public inventory', () => {
    for (const directory of ['backups','data','docs','functions','tests']) {
        const result = inventory(directory + '/private.js');
        assert.equal(result.report.rejected.length, 1, directory);
        assert.equal(result.report.files.includes(directory + '/private.js'), false, directory);
    }
});

test('settings and the computed student-shell destination are explicit public entry pages', () => {
    const result = inventory('js/bayani-backend-client.js');
    for (const file of ['pages/settings.html','pages/student-shell.html']) {
        assert.ok(result.report.entryPages.includes(file), file);
        assert.ok(result.report.files.includes(file), file);
    }
    for (const file of ['pages/practice-audit.html','pages/test-ai-auth-local.html']) {
        assert.equal(result.report.entryPages.includes(file), false, file);
    }
});
