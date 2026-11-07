const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../js/practice.js'),'utf8');
const saveSource=source.slice(source.indexOf('async function savePracticeSession()'),source.indexOf('async function finishPractice()'));
const versionSource=fs.readFileSync(path.join(__dirname,'../js/quiz-draft-policy.js'),'utf8').replace(/export /g,'');
function fixture({change=()=>{},readFails=false,cached=false,pending=false}={}) {
    let submitted,serverReads=0,cachedReads=0;
    const failure=Error('Write acknowledgement unavailable');
    const context=vm.createContext({currentUser:{uid:'student'},practiceSessionReference:{id:'session'},
        chapterId:'c1',missionId:'m1',practiceResults:[{questionId:'q1',topic:'trade',firstTryCorrect:false}],
        serverTimestamp:()=>({server:true}),console:{log(){}},
        setDoc:async(_,data)=>{submitted=structuredClone(data);throw failure;},
        getDoc:async()=>{cachedReads++;return {exists:()=>true,data:()=>submitted};},
        getDocFromServer:async()=>{serverReads++;if(readFails)throw Error('Offline');const data=structuredClone(submitted);change(data);return {exists:()=>true,data:()=>data,metadata:{fromCache:cached,hasPendingWrites:pending}};}
    });
    vm.runInContext(versionSource+'\n'+saveSource,context);
    return {save:()=>context.savePracticeSession(),failure,reads:()=>({serverReads,cachedReads})};
}
test('a lost acknowledgement succeeds only after matching server-confirmed practice data',async()=>{
    const f=fixture();await f.save();assert.deepEqual(f.reads(),{serverReads:1,cachedReads:0});
});
test('a same-owner result with different mission, questions, score or review topics is not save success',async()=>{
    for(const change of [d=>d.chapterId='other',d=>d.missionId='other',d=>d.totalQuestions=9,
        d=>d.firstTryCorrectCount=1,d=>d.questionResults[0].questionId='different',d=>d.topicsForReview=[]]){
        const f=fixture({change});await assert.rejects(f.save(),error=>error===f.failure);
    }
});
test('offline, cached and still-pending results never acknowledge a failed write',async()=>{
    for(const options of [{readFails:true},{cached:true},{pending:true}]){
        const f=fixture(options);await assert.rejects(f.save(),error=>error===f.failure);
    }
});
