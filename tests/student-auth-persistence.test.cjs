const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'../js/auth-ui.js'),'utf8')
    .replace(/import[\s\S]*?from\s+"[^"]+";/g,'');

function element(value='') {
    const handlers=new Map();
    return {value,checked:false,disabled:false,hidden:false,textContent:'',innerHTML:'',
        classList:{add(){},remove(){}},
        addEventListener(type,callback){handlers.set(type,callback);},
        trigger(type){return handlers.get(type)?.({preventDefault(){}});}};
}
function fixture({register=false,remember=false}={}) {
    const elements=new Map();
    const field=(id,value='')=>{const item=element(value);elements.set(id,item);return item;};
    const button=element(),form=field(register?'studentRegisterForm':'loginForm');
    form.querySelector=()=>button;
    form.reportValidity=()=>true;
    form.reset=()=>{form.resetCount=(form.resetCount||0)+1;};
    if(register){
        for(const [id,value]of Object.entries({firstName:' Ana ',middleName:'',lastName:' Cruz ',studentEmail:'student@example.com',studentPassword:'secret123',studentConfirmPassword:'secret123'}))field(id,value);
        field('studentTerms').checked=true;
        field('studentRegisterMessage');field('studentRegistrationContinue').hidden=true;
    } else {
        field('loginEmail','student@example.com');field('loginPassword','secret123');
        field('rememberMe').checked=remember;field('loginMessage');
    }
    const calls=[],profiles=new Map(),auth={currentUser:null},local={kind:'LOCAL'},session={kind:'SESSION'};
    const state={gate:null,persistenceFails:false};
    const window={location:{href:''}};window.self=window;window.top=window;
    const context=vm.createContext({auth,db:{},window,console:{log(){},error(){}},
        document:{getElementById:id=>elements.get(id)||null,querySelectorAll:()=>[],addEventListener(type,callback){if(type==='DOMContentLoaded')callback();}},
        browserLocalPersistence:local,browserSessionPersistence:session,
        setPersistence:async(instance,persistence)=>{
            assert.equal(instance,auth);calls.push(['persistence',persistence.kind]);
            if(state.gate)await state.gate;
            if(state.persistenceFails)throw Object.assign(Error('Private storage detail'),{code:'auth/web-storage-unsupported'});
        },
        signInWithEmailAndPassword:async(instance,email,password)=>{calls.push(['signIn',email,password]);auth.currentUser={uid:'student',email};return{user:auth.currentUser};},
        createUserWithEmailAndPassword:async(instance,email,password)=>{calls.push(['create',email,password]);auth.currentUser={uid:'student',email};return{user:auth.currentUser};},
        signOut:async()=>{calls.push(['signOut']);auth.currentUser=null;},
        doc:(_,collection,id)=>collection+'/'+id,
        getDoc:async ref=>{calls.push(['profile',ref]);return{exists:()=>true,data:()=>({role:'student',status:'active'})};},
        getDocFromServer:async ref=>({exists:()=>profiles.has(ref),data:()=>profiles.get(ref)}),
        setDoc:async(ref,data)=>{calls.push(['save',ref]);profiles.set(ref,data);},
        serverTimestamp:()=>123
    });
    vm.runInContext(source,context);
    return {calls,auth,state,window,form,button,elements,profiles,
        submit:()=>form.trigger('submit'),
        message:()=>elements.get(register?'studentRegisterMessage':'loginMessage').textContent};
}
const tick=async()=>{for(let i=0;i<4;i++)await Promise.resolve();};

test('unchecked Remember me waits for SESSION persistence and blocks duplicate sign-in',async()=>{
    const f=fixture();let release;f.state.gate=new Promise(resolve=>release=resolve);
    const pending=f.submit();await tick();
    assert.deepEqual(f.calls,[['persistence','SESSION']]);
    assert.equal(f.button.disabled,true);
    await f.submit();assert.equal(f.calls.length,1);
    release();await pending;
    assert.deepEqual(f.calls.map(call=>call[0]),['persistence','signIn','profile']);
    assert.equal(f.window.location.href,'student-shell.html');
    assert.equal(f.button.disabled,false);
});

test('checked Remember me selects LOCAL persistence before sign-in',async()=>{
    const f=fixture({remember:true});await f.submit();
    assert.deepEqual(f.calls[0],['persistence','LOCAL']);
    assert.equal(f.calls[1][0],'signIn');
});

test('failed login persistence authenticates nobody, hides storage details and permits retry',async()=>{
    const f=fixture({remember:true});f.state.persistenceFails=true;await f.submit();
    assert.deepEqual(f.calls,[['persistence','LOCAL']]);
    assert.equal(f.auth.currentUser,null);
    assert.equal(f.window.location.href,'');
    assert.equal(f.button.disabled,false);
    assert.match(f.message(),/could not apply your sign-in choice/);
    assert.doesNotMatch(f.message(),/Private|web-storage/);
    assert.equal(f.elements.get('loginEmail').value,'student@example.com');
    f.state.persistenceFails=false;f.elements.get('rememberMe').checked=false;await f.submit();
    assert.deepEqual(f.calls[1],['persistence','SESSION']);
    assert.equal(f.calls.filter(call=>call[0]==='signIn').length,1);
    assert.equal(f.window.location.href,'student-shell.html');
});

test('student registration waits for SESSION persistence before creating an account',async()=>{
    const f=fixture({register:true});let release;f.state.gate=new Promise(resolve=>release=resolve);
    const pending=f.submit();await tick();
    assert.deepEqual(f.calls,[['persistence','SESSION']]);
    assert.equal(f.auth.currentUser,null);
    await f.submit();assert.equal(f.calls.length,1);
    release();await pending;
    assert.deepEqual(f.calls.map(call=>call[0]),['persistence','create','save']);
    assert.equal(f.profiles.get('users/student').role,'student');
    assert.equal(f.elements.get('studentRegistrationContinue').hidden,false);
    assert.equal(f.button.disabled,true);
});

test('failed registration persistence creates no account or profile and permits retry',async()=>{
    const f=fixture({register:true});f.state.persistenceFails=true;await f.submit();
    assert.deepEqual(f.calls,[['persistence','SESSION']]);
    assert.equal(f.auth.currentUser,null);assert.equal(f.profiles.size,0);
    assert.equal(f.form.resetCount,undefined);assert.equal(f.button.disabled,false);
    assert.match(f.message(),/could not set up a sign-in session/);
    assert.doesNotMatch(f.message(),/Private|web-storage/);
    f.state.persistenceFails=false;await f.submit();
    assert.equal(f.calls.filter(call=>call[0]==='create').length,1);
    assert.equal(f.profiles.size,1);assert.equal(f.form.resetCount,1);
});
