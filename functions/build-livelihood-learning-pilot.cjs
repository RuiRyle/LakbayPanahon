const fs=require('node:fs'),path=require('node:path');
const snapshot=require('../docs/validation/learning-content-snapshot.json').collections;
const lessons=require('../data/livelihood-learning-pilot.json');
const sourceUrls=['https://www.nationalmuseum.gov.ph/our-collections/archaeology/tools/','https://www.nationalmuseum.gov.ph/our-collections/ethnology/mats-and-baskets/','https://www.nationalmuseum.gov.ph/2022/02/22/batanes-neolithic-artifacts/'];
const writes=[];
function put(p,fields){const [collection,id]=p.split('/'),old=snapshot[collection]?.find(d=>d.id===id);if(!old)throw Error('Existing mission content required: '+p);writes.push({path:p,create:false,expected:Object.fromEntries(Object.keys(fields).filter(k=>old[k]!==undefined).map(k=>[k,old[k]])),expectedAbsent:Object.keys(fields).filter(k=>old[k]===undefined),fields});}
const order={'mission2-scene1':1,'mission2-scene2':2,'mission2-scene3':3,'mission2-scene5':4,'mission2-scene4':5,'mission2-scene6':6};
for(const [i,l]of lessons.entries()){
 const choices=l.task.slice(1),offset=i%4,rotated=choices.slice(offset).concat(choices.slice(0,offset));
 put('storyScenes/'+l.id,{missionId:'mission-2',status:'active',order:order[l.id],title:l.title,content:l.content,
  reviewTopics:l.topics,exploreIntroduction:'Open the three clues. Connect a resource, a skill, a product and a need.',
  exploreItems:l.clues.map(([title,discovery])=>({title,hint:'Find an observation that helps explain the plan.',discovery,icon:'\ud83d\udd0e'})),
  decisionSituation:l.task[0],decisionQuestion:'Which explanation uses the lesson clues?',decisionChoices:rotated,decisionCorrectAnswer:choices[0],decisionExplanation:l.reason,
  discoveryTitle:'Connect the discovery',discoveryText:l.reason,keyTerm:l.term,keyTermDefinition:l.definition,
  historicalInsight:'This scene is a fictional teaching example. Resources, skills and arrangements varied among early communities; living traditions are not proof of identical past practices.',
  learningHelp:{explanation:l.reason,vocabulary:[{term:l.term,definition:l.definition},{term:'Product',definition:'Something made or obtained through work for use or exchange.'}],example:l.clues[0][1],guidingQuestion:'What resource and skill are used, and whose need does the plan meet?'},sourceUrls,contentReviewStatus:'Source-informed expansion; teacher and Grade 5 learner review pending'});
}
// Change only the position of the existing investigation. Never rewrite its
// stock, needs, agreement, plan rules, reflection or saved reward behavior.
put('storyScenes/mission2-scene4',{order:order['mission2-scene4']});
put('missions/mission-2',{introduction:'Connect resources, skills, products and needs. Follow farming, fishing and craft examples, plan an exchange, then explain how it helps both groups.',
 learningObjective:'Explain how resources and skilled work support livelihoods, then apply supplies, needs and an agreement to a fictional exchange.',
 learningObjectives:['Connect farming resources and learned activities with food production.','Explain why fishing needs knowledge and equipment as well as nearby water.','Connect suitable materials and craft skills with useful products.','Check what both communities have and need before proposing barter.','Explain how exchange can provide products not easily available locally.'],
 lessonRecap:'Farming, fishing and craft work connect resources and skills with food and useful products. Communities can have different resources and needs. A useful exchange considers both sides, available quantities and an agreement. The activity quantities are fictional teaching values, not historical prices for every community.',sourceUrls});
fs.writeFileSync(path.join(__dirname,'../data/livelihood-learning-migration.json'),JSON.stringify({projectId:'lakbaypanahon-1797e',scope:'Chapter 1 Trade and Livelihood teaching and lesson order only; preserve images, assessments, trade configuration and rewards',sourceUrls,writes},null,2));
console.log('Built '+writes.length+' guarded lesson changes.');
