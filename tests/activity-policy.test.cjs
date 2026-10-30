const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname, '../js/activity-policy.js'), 'utf8')
    .replace('export function', 'function'), context);
const policy = context.requirePassingScore;
test('Firestore passing scores include zero and both boundary values', () => {
    for (const passingScore of [0, 45, 72.5, 100]) assert.equal(policy({ passingScore }), passingScore);
});
test('missing or malformed configuration cannot silently award completion', () => {
    for (const passingScore of [undefined, null, '', '60', false, -1, 101, NaN, Infinity]) {
        assert.throws(() => policy({ passingScore }), /Firestore passingScore/);
    }
    assert.throws(() => policy(null), /Firestore passingScore/);
});
