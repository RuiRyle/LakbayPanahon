const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(require.resolve('../js/story-exhibit.js'),'utf8').replace(/export /g,''),ctx);
const plan=require('../data/chapter15-mission2-migration.json');const scene=plan.writes.find(w=>w.fields.exhibitActivity).fields;
const fresh=()=>JSON.parse(JSON.stringify(scene.exhibitActivity));
test('contribution exhibit requires each correct connection and does not accept blanks or repeated guesses',()=>{
 const activity=fresh(),correct=Object.fromEntries(activity.pairs.map(p=>[p.id,p.effectId]));
 assert.equal(ctx.evaluateExhibit(activity,correct).valid,true);assert.equal(ctx.evaluateExhibit(activity,{}).correct,0);
 assert.equal(ctx.evaluateExhibit(activity,{translation:correct.translation}).valid,false);
 const repeated=Object.fromEntries(activity.pairs.map(p=>[p.id,activity.effects[0].id]));assert.equal(ctx.evaluateExhibit(activity,repeated).valid,false);
 assert.equal(ctx.evaluateExhibit(activity,null).valid,false);
});
test('misconfigured or ambiguous exhibit cards cannot silently count as complete',()=>{
 for(const mutate of [a=>a.pairs[1].effectId=a.pairs[0].effectId,a=>a.effects[1].id=a.effects[0].id,a=>a.pairs[0].effectId='missing',a=>a.pairs[0].feedback='',a=>a.pairs=[]]){const activity=fresh();mutate(activity);assert.throws(()=>ctx.validateExhibit(activity),/Configure/);}
});
test('an authored exhibit change revalidates saved matches rather than trusting a confirmation flag',()=>{
 const activity=fresh(),matches=Object.fromEntries(activity.pairs.map(p=>[p.id,p.effectId]));
 [activity.pairs[0].effectId,activity.pairs[1].effectId]=[activity.pairs[1].effectId,activity.pairs[0].effectId];assert.equal(ctx.evaluateExhibit(activity,matches).valid,false);
});
