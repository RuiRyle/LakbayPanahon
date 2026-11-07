const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync('js/mission-learning-guide-policy.js','utf8').replace(/export /g,''),context);
const validate = context.validatedMissionLearningGuide;
const guides = require('../functions/build-all-mission-learning.cjs').loadGuides();
const mission = () => ({id:guides[0].missionId,chapterId:guides[0].chapterId,learningGuide:structuredClone(guides[0])});

test('all 66 authored published guide shapes are accepted without a runtime catalog', () => {
    for (const guide of guides) assert.ok(validate({id:guide.missionId,chapterId:guide.chapterId,learningGuide:guide}));
    const source = fs.readFileSync('js/mission-learning-companion.js','utf8');
    assert.doesNotMatch(source,/mission-learning-guides|authoring|\bgetDoc|\bgetDocs/);
    assert.equal(fs.existsSync('js/mission-learning-guides.js'),false);
});
test('missing, mismatched and malformed guides never supply a fallback lesson', () => {
    for (const value of [null,{},mission()]) {
        if (value?.learningGuide) delete value.learningGuide;
        assert.equal(validate(value),null);
    }
    for (const mutate of [
        m=>m.learningGuide.missionId='other', m=>m.learningGuide.chapterId='other',
        m=>m.learningGuide.question=' ', m=>m.learningGuide.task=null,
        m=>m.learningGuide.choices=['One'], m=>m.learningGuide.choices=['Same',' Same '],
        m=>m.learningGuide.feedback=['Only one'], m=>m.learningGuide.feedback[1]='',
        m=>m.learningGuide.answer=99, m=>m.learningGuide.answer='0', m=>m.learningGuide.answer=-1
    ]) {const m=mission();mutate(m);assert.equal(validate(m),null);}
});
test('published edits and answer counts remain data-driven and arrays are detached', () => {
    const m=mission();
    m.learningGuide.question='A newly published question?';
    m.learningGuide.choices.push('Fourth answer');m.learningGuide.feedback.push('Fourth explanation');m.learningGuide.answer=3;
    const result=validate(m);
    assert.equal(result.question,'A newly published question?');assert.equal(result.answer,3);
    assert.equal(result.choices.length,4);
    result.choices[0]='Changed locally';assert.notEqual(result.choices[0],m.learningGuide.choices[0]);
});
