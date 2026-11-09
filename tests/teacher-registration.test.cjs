const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../js/auth-ui.js'),'utf8').replace(/import[\s\S]*?from\s+"[^"]+";/g,'');
function fixture(){
 const elements=new Map(),profiles=new Map(),calls=[],auth={currentUser:null},state={failSave:false,lostAck:false,persistenceFailure:false,readGate:null};
 function field(id,value=''){const handlers=new Map(),el={value,checked:false,disabled:false,hidden:false,textContent:'',innerHTML:'',classList:{add(){},remove(){}},addEventListener:(name,fn)=>handlers.set(name,fn),submit:()=>handlers.get('submit')({preventDefault(){}})};elements.set(id,el);return el;}
 const form=field('teacherRegisterForm'),button=field('submit');form.querySelector=()=>button;form.reset=()=>{};
 for(const [id,value]of Object.entries({teacherFirstName:' Ana ',teacherMiddleName:'',teacherLastName:' Cruz ',teacherEmail:'teacher@example.com',teacherPassword:'secret123',teacherConfirmPassword:'secret123'}))field(id,value);
 field('teacherTerms').checked=true;field('teacherRegisterMessage');field('teacherRegistrationContinue').hidden=true;
 const context=vm.createContext({auth,db:{},console:{log(){},error(){}},window:{},
  document:{body:{dataset:{}},getElementById:id=>elements.get(id)||null,querySelectorAll:()=>[],addEventListener:(name,fn)=>{if(name==='DOMContentLoaded')fn();}},
  browserLocalPersistence:{},browserSessionPersistence:{kind:'session'},setPersistence:async()=>{calls.push('persistence');if(state.persistenceFailure)throw Error('Storage blocked');},
  createUserWithEmailAndPassword:async(_,email)=>{calls.push('create');const user={uid:'teacher',email};auth.currentUser=user;return{user};},
  doc:(_,name,id)=>name+'/'+id,serverTimestamp:()=>123,
  getDocFromServer:async ref=>{if(state.readGate)await state.readGate;return{exists:()=>profiles.has(ref),data:()=>profiles.get(ref)};},
  setDoc:async(ref,data)=>{calls.push('save');if(state.failSave)throw Object.assign(Error('Offline'),{code:'unavailable'});profiles.set(ref,data);if(state.lostAck)throw Object.assign(Error('Lost acknowledgement'),{code:'unavailable'});}
 });vm.runInContext(source,context);
 return{auth,state,profiles,calls,elements,button,submit:()=>form.submit(),message:()=>elements.get('teacherRegisterMessage').textContent};
}
const tick=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
test('teacher validation checks notice, name bounds and matching password before account creation',async()=>{
 const f=fixture();f.elements.get('teacherTerms').checked=false;await f.submit();assert.equal(f.calls.length,0);
 f.elements.get('teacherTerms').checked=true;f.elements.get('teacherFirstName').value='x'.repeat(101);await f.submit();assert.equal(f.calls.length,0);
 f.elements.get('teacherFirstName').value='Ana';f.elements.get('teacherConfirmPassword').value='wrong';await f.submit();assert.equal(f.calls.length,0);
});
test('teacher profile retry reuses one Auth identity and blocks duplicate submits',async()=>{
 const f=fixture();let release;f.state.readGate=new Promise(r=>release=r);f.state.failSave=true;
 const pending=f.submit();await tick();await f.submit();assert.equal(f.calls.filter(c=>c==='create').length,1);release();await pending;
 assert.match(f.message(),/Retry Register as Teacher/);assert.equal(f.button.disabled,false);assert.equal(f.elements.get('teacherPassword').disabled,true);
 f.state.readGate=null;f.state.failSave=false;await f.submit();assert.equal(f.calls.filter(c=>c==='create').length,1);
 const saved=f.profiles.get('users/teacher');assert.equal(saved.role,'teacher');assert.equal(saved.status,'pending');assert.equal(saved.firstName,'Ana');assert.equal('xp'in saved,false);
 assert.equal(f.button.disabled,true);assert.equal(f.elements.get('teacherRegistrationContinue').hidden,false);
});
test('lost teacher profile acknowledgement is confirmed without a second account or overwrite',async()=>{
 const f=fixture();f.state.lostAck=true;await f.submit();assert.equal(f.profiles.size,1);assert.equal(f.calls.filter(c=>c==='save').length,1);assert.equal(f.button.disabled,true);
 await f.submit();assert.equal(f.calls.filter(c=>c==='create').length,1);
});
test('existing approved teacher stays approved and keeps the original profile',async()=>{
 const f=fixture();f.auth.currentUser={uid:'teacher',email:'teacher@example.com'};const profile={role:'teacher',status:'active',email:'teacher@example.com',firstName:'Original',createdAt:1};f.profiles.set('users/teacher',profile);
 await f.submit();assert.equal(f.calls.includes('create'),false);assert.equal(f.calls.includes('save'),false);assert.equal(f.profiles.get('users/teacher'),profile);assert.match(f.message(),/account is ready/);assert.match(f.message(),/password is unchanged/);
});
for(const profile of [{role:'student',status:'active'},{role:'teacher',status:'inactive'}])test('registration cannot replace '+profile.role+' '+profile.status+' profile',async()=>{
 const f=fixture();f.auth.currentUser={uid:'teacher',email:'teacher@example.com'};const saved={...profile,email:'teacher@example.com'};f.profiles.set('users/teacher',saved);await f.submit();assert.equal(f.calls.includes('save'),false);assert.equal(f.profiles.get('users/teacher'),saved);assert.match(f.message(),/already has a profile/);
});
test('partial teacher signup cannot switch the email on retry',async()=>{
 const f=fixture();f.state.failSave=true;await f.submit();const before=f.calls.length;f.elements.get('teacherEmail').value='other@example.com';await f.submit();assert.equal(f.calls.length,before);assert.match(f.message(),/before changing the email/);
});
test('session change while reading a teacher profile prevents a profile write',async()=>{
 const f=fixture();let release;f.state.readGate=new Promise(r=>release=r);const pending=f.submit();await tick();f.auth.currentUser={uid:'other',email:'other@example.com'};release();await pending;
 assert.equal(f.calls.includes('save'),false);assert.equal(f.elements.get('teacherRegistrationContinue').hidden,true);assert.match(f.message(),/session changed/);
});
test('registration resumes a signed-in identity without an application profile',async()=>{
 const f=fixture();f.auth.currentUser={uid:'teacher',email:'teacher@example.com'};await f.submit();assert.equal(f.calls.includes('create'),false);assert.equal(f.profiles.get('users/teacher').status,'pending');
});
test('blocked persistence creates no teacher identity and permits retry',async()=>{
 const f=fixture();f.state.persistenceFailure=true;await f.submit();assert.equal(f.calls.includes('create'),false);assert.equal(f.profiles.size,0);assert.equal(f.button.disabled,false);
 f.state.persistenceFailure=false;await f.submit();assert.equal(f.calls.filter(c=>c==='create').length,1);
});
