const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({URL});
vm.runInContext(fs.readFileSync(require.resolve('../js/student-shell-route.js'), 'utf8').replace(/export /g, ''), context);
const base = 'https://example.test/app/pages/';

test('student shell preserves the exact active activity, encoded topic and hash', () => {
    const route = 'story.html?chapter=c1&mission=m1&reviewTopic=custom+%26+shared#clues';
    assert.equal(context.studentRouteForPage(route, base), route);
    const shell = context.shellUrlForPage(base + 'student-shell.html?route=student-dashboard.html', base + route);
    assert.equal(new URL(shell).searchParams.get('route'), route);
});

test('shell rejects external URLs, unsupported pages and paths outside its pages directory', () => {
    for (const route of ['https://external.test/app/pages/quiz.html', '../quiz.html', '../other/quiz.html',
        'login.html', 'student-shell.html', 'javascript:alert(1)', 'data:text/html,quiz.html']) {
        assert.equal(context.studentRouteForPage(route, base), null, route);
        assert.equal(context.shellUrlForPage(base + 'student-shell.html', route), null, route);
    }
});

test('shell URL updates replace its route while retaining other outer parameters', () => {
    const start = base + 'student-shell.html?route=mission.html%3Fchapter%3Dc1&view=student';
    const result = new URL(context.shellUrlForPage(start, base + 'quiz.html?chapter=c1&mission=m1'));
    assert.equal(result.searchParams.get('route'), 'quiz.html?chapter=c1&mission=m1');
    assert.equal(result.searchParams.get('view'), 'student');
    assert.equal(context.shellUrlForPage(result.href, base + 'quiz.html?chapter=c1&mission=m1'), result.href);
});

test('shell rejects adversarial origins, encoded paths and nested protected filenames', () => {
    for (const route of [
        '//external.test/app/pages/quiz.html',
        'https://example.test.evil/app/pages/quiz.html',
        'https://example.test:444/app/pages/quiz.html',
        'https://example.test@external.test/app/pages/quiz.html',
        '\\\\external.test\\app\\pages\\quiz.html',
        '/app/pages/nested/quiz.html',
        '%2e%2e/quiz.html',
        '%2e%2e%2fquiz.html',
        'nested%2fquiz.html',
        '%71uiz.html',
        'quiz.html/extra',
        'student-shell.html?route=quiz.html',
        'login.html?route=quiz.html',
        'javascript://example.test/app/pages/quiz.html',
        'data:text/html,quiz.html'
    ]) {
        assert.equal(context.studentRouteForPage(route, base), null, route);
        assert.equal(context.shellUrlForPage(base + 'student-shell.html', route), null, route);
    }
});

test('same-directory URL normalization and arbitrary activity query text remain supported', () => {
    const route = 'quiz.html?return=https%3A%2F%2Fexternal.test%2F&topic=%2F%3F%23%26#answer-2';
    for (const input of [route, './' + route, '../pages/' + route, base + route]) {
        assert.equal(context.studentRouteForPage(input, base), route, input);
        assert.equal(new URL(context.shellUrlForPage(base + 'student-shell.html', input)).searchParams.get('route'), route);
    }
});
