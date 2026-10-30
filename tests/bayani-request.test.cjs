const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'../js/bayani-request.js'),'utf8');
const modulePromise=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const flush=async()=>{for(let i=0;i<4;i++)await Promise.resolve();};
function fakeClock(){
    const pending=new Map();
    let next=0;
    return {
        pending,
        setTimer(callback,milliseconds){const id=++next;pending.set(id,{callback,milliseconds});return id;},
        clearTimer(id){pending.delete(id);},
        expire(){const [id,timer]=pending.entries().next().value;pending.delete(id);timer.callback();}
    };
}

test('Bayani connection and reply deadlines remain 30 and 45 seconds',async()=>{
    const module=await modulePromise;
    assert.equal(module.BAYANI_CONNECT_TIMEOUT_MS,30000);
    assert.equal(module.BAYANI_REPLY_TIMEOUT_MS,45000);
});

test('settled requests clear their deadline and preserve the original result or error',async()=>{
    const {withBayaniDeadline}=await modulePromise;
    const clock=fakeClock();
    assert.equal(await withBayaniDeadline(()=>Promise.resolve('Reply'),45000,clock),'Reply');
    assert.equal(clock.pending.size,0);
    const failure=Object.assign(Error('Private provider detail'),{code:'ai/response-blocked'});
    await assert.rejects(withBayaniDeadline(()=>{throw failure;},30000,clock),error=>error===failure);
    assert.equal(clock.pending.size,0);
});

test('deadline rejects once without retries and ignores both late resolution and late rejection',async()=>{
    const {withBayaniDeadline}=await modulePromise;
    for(const rejectLate of [false,true]){
        const clock=fakeClock();
        let resolveOperation,rejectOperation,calls=0,settlements=0;
        const operation=new Promise((resolve,reject)=>{resolveOperation=resolve;rejectOperation=reject;});
        const request=withBayaniDeadline(()=>{calls++;return operation;},45000,clock);
        request.then(()=>settlements++,()=>settlements++);
        const rejected=assert.rejects(request,error=>error.code==='bayani/deadline-exceeded');
        await flush();
        assert.equal(clock.pending.values().next().value.milliseconds,45000);
        clock.expire();
        await rejected;
        if(rejectLate)rejectOperation(Error('Late private error'));else resolveOperation('Late answer');
        await flush();
        assert.equal(calls,1);
        assert.equal(settlements,1);
        assert.equal(clock.pending.size,0);
    }
});

test('known reply outcomes offer rephrasing or a new chat without exposing provider details',async()=>{
    const {bayaniFailureMessage}=await modulePromise;
    for(const code of ['ai/response-error','ai/response-blocked','ai/invalid-content','bayani/no-content']){
        const message=bayaniFailureMessage({code,message:'Private provider response with 403 and quota details'});
        assert.match(message,/different way|rephrasing/);
        assert.doesNotMatch(message,/Private|403|quota|sending your question again|usage limit|connect securely/);
    }
    assert.match(bayaniFailureMessage(Error('Bayani AI could not respond. Please rephrase your question.')),/different way/);
});

test('deadline, offline, quota and security failures retain fixed recovery guidance',async()=>{
    const {bayaniFailureMessage}=await modulePromise;
    assert.match(bayaniFailureMessage({code:'bayani/deadline-exceeded'},{connecting:true}),/too long to connect/);
    assert.match(bayaniFailureMessage({code:'bayani/deadline-exceeded'}),/too long to reply/);
    assert.match(bayaniFailureMessage(Error('Unknown private detail'),{online:false}),/internet connection/);
    assert.match(bayaniFailureMessage({code:'resource-exhausted'}),/usage limit/);
    assert.match(bayaniFailureMessage({code:'ai/fetch-error',message:'HTTP 403'}),/connect securely/);
    assert.match(bayaniFailureMessage(Error('Unknown private detail'),{connecting:true}),/unavailable right now/);
    assert.doesNotMatch(bayaniFailureMessage(Error('Unknown private detail')),/private detail/);
});

test('secure backend outcomes use fixed age-appropriate guidance without exposing response text',async()=>{
    const {bayaniFailureMessage}=await modulePromise;
    const outcomes={
        'bayani/privacy-blocked':/private details/,
        'bayani/rate-limit':/usage limit/,
        'bayani/quota-exceeded':/usage limit/,
        'bayani/unauthenticated':/Sign in again/,
        'bayani/permission-denied':/connect securely/,
        'bayani/app-check-required':/connect securely/,
        'bayani/unavailable':/unavailable right now/,
        'bayani/response-blocked':/different way/,
        'bayani/invalid-request':/rephrasing/
    };
    for(const [code,expected] of Object.entries(outcomes)){
        const message=bayaniFailureMessage({code,message:'Private upstream response: 403 quota from provider'});
        assert.match(message,expected,code);
        assert.doesNotMatch(message,/Private upstream|403|from provider/);
    }
});
