const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../js/page-transition.js'),'utf8').split('// Shared, accessible menu behavior')[0];
function fixture(){
 const listeners={},scheduled=[],assigned=[];
 const classes={add(){},remove(){},contains(){return false;}};
 class Element{closest(){return this;}hasAttribute(){return false;}getAttribute(){return '';}relList={contains:()=>false};href='https://example.test/pages/chapters.html';}
 const context=vm.createContext({Element,URL,document:{readyState:'complete',body:{classList:classes,append(){}},querySelectorAll:()=>[],getElementById:()=>null,createElement:()=>({setAttribute(){}}),addEventListener:(type,fn)=>listeners[type]=fn},
 window:{location:{href:'https://example.test/index.html',origin:'https://example.test',pathname:'/index.html',search:'',assign:url=>assigned.push(url)},addEventListener(){},matchMedia:()=>({matches:false}),setTimeout:(fn,ms)=>scheduled.push({fn,ms})}});
 vm.runInContext(source,context);return {listeners,scheduled,assigned,Element};
}
test('internal navigation shows a brief transition before leaving',()=>{
 const f=fixture();let prevented=false;f.listeners.click({button:0,target:new f.Element(),preventDefault(){prevented=true;}});
 assert(prevented);assert.equal(f.assigned.length,0);assert.equal(f.scheduled[0].ms,220);
 f.scheduled[0].fn();assert.deepEqual(f.assigned,['https://example.test/pages/chapters.html']);
});
test('modified clicks retain native browser navigation',()=>{
 const f=fixture();f.listeners.click({button:0,ctrlKey:true,target:new f.Element(),preventDefault(){throw Error('must stay native');}});assert.equal(f.assigned.length,0);
});
test('login transition remains visible for 220ms before navigating',()=>{
 const f=fixture(),link=new f.Element();link.href='https://example.test/pages/login.html';
 let prevented=false;
 f.listeners.click({button:0,target:link,preventDefault(){prevented=true;}});
 assert(prevented);assert.equal(f.assigned.length,0);assert.equal(f.scheduled[0].ms,220);
 f.scheduled[0].fn();assert.deepEqual(f.assigned,['https://example.test/pages/login.html']);
});
