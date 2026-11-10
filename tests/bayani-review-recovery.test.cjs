'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function fixture() {
  const nodes = new Map();
  const element = () => ({ hidden: false, disabled: false, textContent: '', children: [],
    handlers: {}, addEventListener(name, fn) { this.handlers[name] = fn; },
    replaceChildren() { this.children = []; }, setAttribute(name,value) { this[name]=value; }, focus() { this.focused=true; }, append(item) { this.children.push(item); } });
  const document = { getElementById(id) { if (!nodes.has(id)) nodes.set(id, element()); return nodes.get(id); },
    querySelector() { return document.getElementById('layout'); }, createElement: element };
  let fails = true, reads = 0, gate = null;
  const context = vm.createContext({ document, URLSearchParams,
    location: { search: '?mission=m1&chapter=c1' }, auth: { currentUser: { uid: 'student-one' } }, db: {},
    onAuthStateChanged() {}, window: { handlers: {}, addEventListener(name, fn) { this.handlers[name] = fn; } },
    doc: () => null, collection: () => null, where: () => null, query: () => null,
    getDocFromServer: async () => { reads++; if (gate) await gate; if (fails) throw Error('offline');
      return { exists: () => true, data: () => ({ status: 'active', chapterId: 'c1', title: 'A history lesson' }) }; },
    getDocs: async () => ({ docs: [{ data: () => ({ title: 'Source', content: 'A verified lesson sentence. '.repeat(8) }) }] }),
    withBayaniDeadline: operation => operation(), BAYANI_REPLY_TIMEOUT_MS: 100, BAYANI_CONNECT_TIMEOUT_MS: 100,
    connectBayani: () => { throw Error('AI must not be invoked for lesson retry'); },
    parseReviewQuestion() {}, reviewPrompt() {} });
  const source = fs.readFileSync('js/bayani-review.js', 'utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, '');
  vm.runInContext(source, context);
  return { context, nodes, prepare: () => vm.runInContext('prepare()', context),
    recover() { fails = false; }, block(promise) { gate = promise; }, reads: () => reads };
}
test('failed lesson can be retried in place without enabling AI prematurely', async () => {
  const f = fixture(); await f.prepare();
  const retry = f.nodes.get('retryReviewLesson'), generate = f.nodes.get('generateReviewQuestion');
  assert.equal(retry.hidden, false); assert.equal(retry.disabled, false); assert.equal(generate.disabled, true);
  assert.match(f.nodes.get('reviewQuestionStatus').textContent, /Retry the lesson/);
  f.recover(); let release; f.block(new Promise(resolve => { release = resolve; }));
  retry.handlers.click(); retry.handlers.click();
  assert.equal(retry.hidden, true); assert.equal(retry.disabled, true); assert.equal(generate.disabled, true);
  assert.equal(f.reads(), 2, 'rapid retry cannot start another request');
  release(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(generate.disabled, false); assert.equal(retry.hidden, true);
  assert.equal(f.nodes.get('reviewSourceLesson').hidden, false);
});
test('account change discards an earlier lesson load', async () => {
  const f = fixture(); f.recover(); let release; f.block(new Promise(resolve => { release = resolve; }));
  const pending = f.prepare(); f.context.auth.currentUser = null; await f.prepare(); release(); await pending;
  assert.equal(f.nodes.get('bayaniReviewPanel').hidden, true);
  assert.equal(f.nodes.get('generateReviewQuestion').disabled, true);
  assert.equal(f.nodes.get('retryReviewLesson').hidden, true);
});
test('leaving the page prevents a failed request from reopening recovery controls', async () => {
  const f = fixture(); let release; f.block(new Promise(resolve => { release = resolve; }));
  const pending = f.prepare(); f.context.window.handlers.pagehide(); release(); await pending;
  assert.equal(f.nodes.get('retryReviewLesson').hidden, true);
  assert.equal(f.nodes.get('bayaniReviewPanel').hidden, true);
});
test('review feedback is final, focusable and removed when the account session changes', async () => {
  const f=fixture();
  vm.runInContext("question={answer:'A',options:{A:'Trade'},explanation:'A lesson explanation.'};selected='A';",f.context);
  const button=f.nodes.get('checkReviewAnswer');button.handlers.click();
  const feedback=f.nodes.get('reviewAnswerFeedback');
  assert.match(feedback.textContent,/suggested answer/);assert.equal(feedback.focused,true);
  assert.equal(feedback.tabindex,'-1');assert.equal(button.disabled,true);
  vm.runInContext("selected='B'",f.context);button.handlers.click();
  assert.match(feedback.textContent,/You chose the suggested answer/,'repeat action cannot replace checked feedback');
  f.context.auth.currentUser=null;await f.prepare();
  assert.equal(feedback.textContent,'');assert.equal(f.nodes.get('reviewQuestionOptions').children.length,0);
});
