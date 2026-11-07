const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/lakbay-passport.js'),'utf8').replace(/export /g,'');
const context=vm.createContext({Intl,Date,URLSearchParams});
vm.runInContext(source,context);
test('passport stamps require owned completed evidence and ready chapters',()=>{
 const groups=[{id:'era',title:'An era',chapters:[
  {id:'earned',title:'Earned chapter',ready:true,completed:true},
  {id:'other',ready:true,completed:true},
  {id:'unready',ready:false,completed:true},
  {id:'incomplete',ready:true,completed:false}]}];
 const progress=[{userId:'me',chapterId:'earned',completed:true,completedAt:{toDate:()=>new Date('2026-10-29T17:00:00Z')}},
  {userId:'someone-else',chapterId:'other',completed:true},
  {userId:'me',chapterId:'unready',completed:true}];
 const entries=context.passportEntries(groups,progress,'me');
 assert.equal(entries.length,1);assert.equal(entries[0].id,'earned');
 assert.match(entries[0].date,/30/,'date must use the Philippines timezone');
 assert.equal(context.passportEntries(groups,progress,'signed-out').length,0);
});
test('missing or invalid completion dates are never invented',()=>{
 assert.equal(context.completionDate(null),'');
 assert.equal(context.completionDate({toDate:()=>new Date('invalid')}),'');
 assert.equal(context.completionDate({toDate:()=>null}),'');
});
