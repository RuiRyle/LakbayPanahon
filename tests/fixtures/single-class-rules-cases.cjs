const base='/databases/(default)/documents/';
function scenario(name,expectation,{old,oldMember=false,afterMember=true,uid='alice',target='alice'}={}){
 const exact=(fn,path,value)=>({function:fn,args:[{exactValue:base+path}],result:{value}});
 const mocks=[exact('get','users/'+uid,{data:{role:'student',status:'active'}}),exact('exists','studentClassSlots/'+target,!!old),exact('exists','classMembers/'+target+'_old',oldMember)];
 if(afterMember)mocks.push(exact('getAfter','classMembers/'+target+'_new',{data:{userId:target,classId:'new',status:'active'}}));
 for(const fn of ['get','getAfter'])mocks.push({function:fn,args:[{anyValue:{}}],result:{undefined:{}}});
 mocks.push({function:'exists',args:[{anyValue:{}}],result:{value:false}});
 return {name,expectation,request:{auth:{uid,token:{}},path:base+'studentClassSlots/'+target,method:old?'update':'create',time:'2026-11-10T04:00:00Z',resource:{data:{classId:'new'}}},...(old?{resource:{data:{classId:old}}}:{}),functionMocks:mocks};
}
const cases=[scenario('first slot requires paired membership','ALLOW'),scenario('slot alone cannot reserve class','DENY',{afterMember:false}),scenario('cannot move slot while old membership exists','DENY',{old:'old',oldMember:true}),scenario('leave or removal releases reservation','ALLOW',{old:'old'}),scenario('same-class slot remains idempotent','ALLOW',{old:'new'}),scenario('another student cannot reserve slot','DENY',{target:'bob'})];
module.exports={cases};
