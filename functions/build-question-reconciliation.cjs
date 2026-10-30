// Review bundle only: no Firebase dependencies and deliberately no writes array.
const fs=require('node:fs'),path=require('node:path'),{isDeepStrictEqual:equal}=require('node:util');
const root=path.join(__dirname,'..');
const snapshot=require('../docs/validation/learning-content-snapshot.json');
const feedback=require('../data/question-feedback-migration.json');
const roadmap=require('../data/roadmap-chapter34-migration.json');
const required=['question','optionA','optionB','optionC','optionD','correctAnswer','explanation','learningPoint','historicalClue','answerExplanations'];
function build(){
    const questions=[];
    for(const older of feedback.writes){
        const baseline=snapshot.collections.questions.find(q=>'questions/'+q.id===older.path);
        if(!baseline)throw Error('Missing question baseline: '+older.path);
        if(Object.entries(older.fields).every(([k,v])=>equal(baseline[k],v)))continue;
        for(const field of required)if(baseline[field]===undefined)throw Error('Incomplete coherent question: '+older.path+'.'+field);
        const canonical=Object.fromEntries(Object.entries(baseline).filter(([k])=>k!=='id'));
        const later=roadmap.writes.find(w=>w.path===older.path);
        const matchesRoadmap=!!later&&Object.entries(later.fields).every(([k,v])=>equal(canonical[k],v));
        const family=older.path.includes('/quiz-1-')?'barangay-scenario-quiz.json':older.path.includes('/quiz-2-')?'livelihood-scenario-quiz.json':null;
        const scenario=family?require('../data/'+family).writes.find(w=>w.path===older.path):null;
        const changed=Object.keys(scenario?.fields||{}).filter(k=>!equal(scenario.fields[k],canonical[k]));
        questions.push({path:older.path,source:matchesRoadmap?'roadmap-chapter34-migration.json':'dated-curriculum-snapshot',
            sourceSnapshotAt:snapshot.auditedAt,earlierScenario:family,fieldsChangedFromEarlierScenario:changed,
            answerKeyMatchesEarlierScenario:scenario?scenario.fields.correctAnswer===canonical.correctAnswer:null,
            decision:'Retain this complete baseline question-and-feedback set for review; supersede the older partial-feedback replay for this path.',
            canonicalReviewFields:canonical,
            supersededInput:{file:'question-feedback-migration.json',fields:Object.keys(older.fields)},
            liveStateVerified:false});
    }
    return {projectId:'lakbaypanahon-1797e',kind:'non-executable-question-review-bundle',snapshotAt:snapshot.auditedAt,
        teacherReview:'pending',liveStateVerified:false,questions,
        publicationRule:'Do not replay superseded partial feedback or older scenario wording over these sets. Compare full current documents before preparing any guarded migration.'};
}
if(require.main===module){const result=build();fs.writeFileSync(path.join(root,'data/question-reconciliation-review.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({questions:result.questions.length,roadmapMatches:result.questions.filter(q=>q.source==='roadmap-chapter34-migration.json').length,
snapshotScenarioSets:result.questions.filter(q=>q.earlierScenario).length,changedAnswerKeys:result.questions.filter(q=>q.answerKeyMatchesEarlierScenario===false).length,executable:false}));}
module.exports={build};
