const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const context=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/quiz-draft-policy.js'),'utf8').replace(/export /g,''),context);
test('quiz resume version changes with assessment content but preserves feedback-only edits',()=>{
 const quiz={passingScore:60,questionCount:1,questionBlueprint:[{topic:'trade',difficulty:'easy',count:1}]};
 const question={id:'q1',question:'Question',optionA:'One',optionB:'Two',correctAnswer:'A',topic:'trade',difficulty:'easy',explanation:'Original'};
 const version=context.quizDraftVersion(quiz,[question]);
 assert.equal(version,context.quizDraftVersion(quiz,[{...question,explanation:'Updated',learningPoint:'New feedback'}]));
 for(const field of ['id','question','optionA','optionB','correctAnswer','topic','difficulty']) assert.notEqual(version,context.quizDraftVersion(quiz,[{...question,[field]:'changed'}]));
 assert.notEqual(version,context.quizDraftVersion({...quiz,passingScore:80},[question]));
});

test('Firestore map order does not invalidate saved learning content',()=>{
 const original={policy:{questionLimit:5,initialDifficulty:'easy'},scenes:[{id:'s1',title:'Scene',exploreItems:[{title:'Item',discovery:'Clue'}]}]};
 const reordered={scenes:[{exploreItems:[{discovery:'Clue',title:'Item'}],title:'Scene',id:'s1'}],policy:{initialDifficulty:'easy',questionLimit:5}};
 assert.equal(context.stableDraftVersion(original),context.stableDraftVersion(reordered));
 assert.notEqual(context.stableDraftVersion(original),context.stableDraftVersion({...reordered,scenes:[]}));
 const blueprint=[{topic:'trade',difficulty:'easy',count:1}];
 assert.equal(context.quizDraftVersion({passingScore:60,questionCount:1,questionBlueprint:blueprint},[]),context.quizDraftVersion({passingScore:60,questionCount:1,questionBlueprint:[{count:1,difficulty:'easy',topic:'trade'}]},[]));
});
