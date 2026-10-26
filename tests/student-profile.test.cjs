const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../js/student-profile.js'), 'utf8')
    .replace(/import[\s\S]*?from\s+"[^"]+";/g, '').replace(/export /g, '');
function fixture() {
    const name = {};
    const avatar = {};
    const context = vm.createContext({ document: {
        getElementById: id => id === 'topStudentName' ? name : null,
        querySelectorAll: () => [avatar]
    } });
    vm.runInContext(source + '\nglobalThis.changes = profileChanges; globalThis.render = renderStudentIdentity;', context);
    return { context, name, avatar };
}
test('profile save trims names and allowlists fields, excluding account/reward values', () => {
    const { context } = fixture();
    const data = context.changes({ firstName: '  Ana  ', middleName: ' ', lastName: ' Dela Cruz ', avatarId: 'book', role: 'admin', xp: 9999 });
    assert.equal(data.firstName, 'Ana');
    assert.equal(data.middleName, '');
    assert.equal(data.lastName, 'Dela Cruz');
    assert.equal(data.avatarId, 'book');
    assert.equal(data.role, undefined);
    assert.equal(data.xp, undefined);
});
test('profile rejects blank names, oversized names and arbitrary avatar values', () => {
    const { context } = fixture();
    const valid = { firstName: 'Ana', lastName: 'Cruz', avatarId: 'book' };
    assert.throws(() => context.changes({ ...valid, firstName: '   ' }), /first and last/);
    assert.throws(() => context.changes({ ...valid, middleName: 'a'.repeat(101) }), /100 characters/);
    assert.throws(() => context.changes({ ...valid, avatarId: '<script>' }), /Choose an avatar/);
});
test('saved avatars render consistently and legacy profiles fall back to their initial', () => {
    const { context, name, avatar } = fixture();
    context.render({ firstName: 'Ana', avatarId: 'book' });
    assert.equal(name.textContent, 'Ana');
    assert.equal(avatar.textContent, '\u{1F4DA}');
    context.render({ firstName: 'Rui' });
    assert.equal(avatar.textContent, 'R');
    context.render({ firstName: 'Luna', avatarId: 'invalid' });
    assert.equal(avatar.textContent, 'L');
});
