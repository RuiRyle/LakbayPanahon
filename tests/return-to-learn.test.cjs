const assert=require('node:assert/strict');
const {test}=require('node:test');
const fs=require('node:fs');
const vm=require('node:vm');
const code=fs.readFileSync(require('node:path').join(__dirname,'../js/return-to-learn.js'),'utf8').replaceAll('export function ','function ');
const context=vm.createContext({URLSearchParams});
vm.runInContext(code+';globalThis.chooseReturnTopic=chooseReturnTopic;globalThis.listReturnTopics=listReturnTopics;globalThis.chooseRecallQuestion=chooseRecallQuestion;globalThis.renderReturnToLearn=renderReturnToLearn;globalThis.requireReturnPolicy=requireReturnPolicy;',context);
const choose=context.chooseReturnTopic;
const day=86400000,now=10*day;
const base={userId:'student',policy:{reviewAfterDays:3},now,missions:[{id:'m1',chapterId:'c1',status:'active',title:'Map Lesson'}],missionProgress:[{userId:'student',missionId:'m1',completed:true,completedAt:4*day}],questions:[{id:'q1',missionId:'m1',status:'active',topic:'maps',topicLabel:'Reading Maps'}]};
test('requires an authored Firestore interval',()=>{
 assert.throws(()=>choose({...base,policy:{}}),/reviewAfterDays/);
 assert.equal(choose({...base,policy:{reviewAfterDays:7}}),null);
});
test('offers an old completed topic with its authored label and lesson route',()=>{
 const topic=choose(base);
 assert.equal(topic.label,'Reading Maps');
 assert.equal(topic.chapterId,'c1');
 assert.equal(topic.topic,'maps');
});
test('recent study defers the memory check and other users cannot supply progress',()=>{
 assert.equal(choose({...base,practiceSessions:[{userId:'student',missionId:'m1',completedAt:9*day,questionResults:[{topic:'maps'}]}]}),null);
 assert.equal(choose({...base,attempts:[{userId:'student',missionId:'m1',completedAt:9*day,questionIds:['any']}]}),null);
 assert.equal(choose({...base,missionProgress:[{...base.missionProgress[0],userId:'another'}]}),null);
});
test('inactive, unavailable, and newly completed missions do not appear',()=>{
 assert.equal(choose({...base,missions:[{...base.missions[0],status:'draft'}]}),null);
 assert.equal(choose({...base,questions:[{...base.questions[0],status:'draft'}]}),null);
 assert.equal(choose({...base,missionProgress:[{...base.missionProgress[0],completedAt:9*day}]}),null);
});
test('renders story-first and optional practice links with encoded Firestore topic',()=>{
 const make=tag=>({tag,textContent:'',children:[],append(...items){this.children.push(...items);},prepend(...items){this.children.unshift(...items);},replaceChildren(...items){this.children=items;},setAttribute(){},addEventListener(){}});
 context.document={createElement:make};
 const container=make('div');
 context.renderReturnToLearn(container,{chapterId:'c&1',missionId:'m?1',topic:'maps & places',label:'<img>',missionTitle:'Map Lesson'});
 const card=container.children[0];
 assert.equal(card.children[1].textContent,'<img>');
 const findLink=(node,label)=>node.tag==='a'&&node.textContent===label?node:node.children.map(child=>findLink(child,label)).find(Boolean);
 const storyLink=findLink(card,'Revisit Story Clue'),practiceLink=findLink(card,'Try Memory Practice');
 assert.ok(storyLink,'Story review action is missing');
 assert.ok(practiceLink,'Optional practice action is missing');
 const story=new URL(storyLink.href,'http://localhost/pages/');
 const practice=new URL(practiceLink.href,'http://localhost/pages/');
 assert.equal(story.pathname,'/pages/story.html');
 assert.equal(story.searchParams.get('reviewTopic'),'maps & places');
 assert.equal(practice.searchParams.get('topic'),'maps & places');
 assert.equal(practice.searchParams.get('chapter'),'c&1');
});
test('chooses an authored easy recall question and excludes incomplete banks',()=>{
 const topic=choose(base);
 const valid={id:'q2',missionId:'m1',topic:'maps',status:'active',question:'Where is north?',optionA:'At the top',optionB:'At the bottom',optionC:'On the left',optionD:'On the right',correctAnswer:'A',difficulty:'easy'};
 assert.equal(context.chooseRecallQuestion(topic,[{...valid,id:'hard',difficulty:'hard'},valid]).id,'q2');
 assert.equal(context.chooseRecallQuestion(topic,[{...valid,optionD:''}]),null);
});
test('one-question recall gives immediate feedback without a progress write',()=>{
 const make=tag=>({tag,children:[],dataset:{},append(...items){this.children.push(...items);},prepend(...items){this.children.unshift(...items);},replaceChildren(...items){this.children=items;},setAttribute(){},addEventListener(name,handler){this[name]=handler;},focus(){}});
 context.document={createElement:make};
 const container=make('div');
 const question={id:'q2',missionId:'m1',topic:'maps',status:'active',question:'Where is north?',optionA:'At the top',optionB:'At the bottom',optionC:'On the left',optionD:'On the right',correctAnswer:'A',explanation:'Look at the compass.'};
 context.renderReturnToLearn(container,choose(base),question);
 const check=container.children[0].children[3],choices=check.children[1].children,feedback=check.children[2];
 choices[1].click();
 assert.match(feedback.textContent,/Have another look/);
 assert.match(feedback.textContent,/Look at the compass/);
 assert.equal(choices.every(choice=>choice.disabled),true);
});
test('a second due topic can be offered after answering the first clue',()=>{
 const due=context.listReturnTopics({...base,questions:[...base.questions,{id:'q2',missionId:'m1',status:'active',topic:'islands',topicLabel:'Islands'}]});
 assert.equal(due.length,2);
 const make=tag=>({tag,children:[],dataset:{},hidden:false,append(...items){this.children.push(...items);},prepend(...items){this.children.unshift(...items);},replaceChildren(...items){this.children=items;},setAttribute(){},addEventListener(name,handler){this[name]=handler;},focus(){}});
 context.document={createElement:make};
 const container=make('div');let advanced=false;
 const question={id:'q1',missionId:'m1',topic:due[0].topic,status:'active',question:'Which way?',optionA:'North',optionB:'South',optionC:'East',optionD:'West',correctAnswer:'A'};
 context.renderReturnToLearn(container,due[0],question,()=>{advanced=true;});
 const check=container.children[0].children[3],next=check.children[3];
 assert.equal(next.hidden,true);
 check.children[1].children[0].click();
 assert.equal(next.hidden,false);
 next.click();
 assert.equal(advanced,true);
});
