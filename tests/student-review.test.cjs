const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({ URLSearchParams });
const source = fs.readFileSync(path.join(__dirname, '../js/practice-review.js'), 'utf8').replace(/export /g, '');
vm.runInContext(source + '\nglobalThis.summarize = reviewTopicsFromHistory; globalThis.link = practiceTopicUrl;', context);
const question = (id, missionId = 'm1', topic = 'Trade & travel') => ({ id, missionId, topic, topicLabel: 'Trading communities', status: 'active' });
const session = (time, results, missionId = 'm1') => ({ id: String(time), missionId,
    completedAt: { toMillis: () => time }, questionResults: results });
const answer = (questionId, firstTryCorrect) => ({ questionId, firstTryCorrect });

test('review uses database topics and labels, counting each latest question once', () => {
    const result = context.summarize([
        session(20, [answer('q1', false), answer('q2', true)]),
        session(10, [answer('q1', false)])
    ], [question('q1'), question('q2')]);
    assert.equal(result.length, 1);
    assert.equal(result[0].label, 'Trading communities');
    assert.equal(result[0].attempted, 2);
    assert.equal(result[0].missed, 1);
});
test('a later first-try success resolves an older mistake without clearing other questions', () => {
    const result = context.summarize([
        session(10, [answer('q1', false), answer('q2', false)]),
        session(30, [answer('q1', true)])
    ], [question('q1'), question('q2')]);
    assert.equal(result[0].missed, 1);
    assert.equal(result[0].correct, 1);
});
test('question identities and topic recommendations remain scoped to each mission', () => {
    const result = context.summarize([
        session(10, [answer('same-id', false)]),
        session(20, [answer('same-id', true)], 'm2')
    ], [question('same-id'), question('same-id', 'm2')]);
    assert.equal(result.length, 2);
    assert.equal(result.find(item => item.missionId === 'm1').missed, 1);
    assert.equal(result.find(item => item.missionId === 'm2').missed, 0);
});
test('removed, inactive, untagged questions and malformed attempts do not create recommendations', () => {
    const result = context.summarize([
        session(10, [answer('gone', false), answer('inactive', false), answer('blank', false), answer('good', 'false')]),
        { missionId: 'm1', questionResults: [answer('good', false)] }
    ], [{ ...question('inactive'), status: 'disabled' }, { ...question('blank'), topic: '' }, question('good')]);
    assert.equal(result.length, 0);
});
test('renamed database topics replace stale labels stored in old attempts', () => {
    const result = context.summarize([session(10, [{ ...answer('q1', false), topic: 'Old label' }])],
        [{ ...question('q1'), topic: 'New topic', topicLabel: 'New display name' }]);
    assert.equal(result[0].topic, 'New topic');
    assert.equal(result[0].label, 'New display name');
});
test('topic links preserve spaces, Filipino text and reserved URL characters', () => {
    const link = context.link('c & 1', 'm/2', 'Kalakalan & paglalayag #1');
    const parsed = new URL(link, 'https://example.com/pages/');
    assert.equal(parsed.searchParams.get('chapter'), 'c & 1');
    assert.equal(parsed.searchParams.get('mission'), 'm/2');
    assert.equal(parsed.searchParams.get('topic'), 'Kalakalan & paglalayag #1');
});
