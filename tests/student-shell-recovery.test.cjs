const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture(){
    const elements=new Map(),timers=new Map();let next=0;
    for(const id of ['studentRouteFrame','shellLoading','shellRecovery','shellLoadingMessage','shellRetry'])elements.set(id,{hidden:false,listeners:{},addEventListener(name,handler){this.listeners[name]=handler;}});
    const frame=elements.get('studentRouteFrame');frame.contentDocument={title:'Mission'};frame.contentWindow={location:{href:'https://example.test/pages/story.html?mission=m1'},addEventListener(){}};
    const context=vm.createContext({URL,URLSearchParams,document:{getElementById:id=>elements.get(id)},window:{location:{href:'https://example.test/pages/student-shell.html?route=story.html%3Fmission%3Dm1',search:'?route=story.html%3Fmission%3Dm1'},history:{replaceState(){}}},setTimeout(fn){const id=++next;timers.set(id,fn);return id;},clearTimeout(id){timers.delete(id);}});
    vm.runInContext(fs.readFileSync('js/student-shell-route.js','utf8').replace(/export /g,''),context);
    vm.runInContext(fs.readFileSync('js/student-shell.js','utf8').replace(/^import .*;\r?\n/gm,''),context);
    return {elements,frame,timers,context};
}
test('slow initial shell load offers recovery and retry retains the mission route',()=>{
    const {elements,frame,timers}=fixture();
    assert.equal(elements.get('shellRecovery').hidden,true);
    [...timers.values()][0]();assert.equal(elements.get('shellRecovery').hidden,false);
    elements.get('shellRetry').listeners.click();assert.equal(elements.get('shellRecovery').hidden,true);
    assert.equal(frame.src,'https://example.test/pages/story.html?mission=m1');
    frame.listeners.load();assert.equal(elements.get('shellLoading').hidden,true);assert.equal(timers.size,0);
});
test('frame errors expose retry and invalid retry destinations never leave the student routes',()=>{
    const {elements,frame,timers,context}=fixture();frame.listeners.error();
    assert.equal(elements.get('shellRecovery').hidden,false);assert.equal(timers.size,0);
    context.window.location.search='?route=https%3A%2F%2Fevil.test%2Fquiz.html';
    elements.get('shellRetry').listeners.click();assert.match(frame.src,/\/pages\/story\.html\?mission=m1$/);
});
