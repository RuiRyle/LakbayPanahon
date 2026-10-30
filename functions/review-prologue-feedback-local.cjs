const fs=require('node:fs'),path=require('node:path');
const {isDeepStrictEqual:equal}=require('node:util');
const root=path.join(__dirname,'..');
const matches=(doc,fields)=>!!doc&&Object.entries(fields||{}).every(([k,v])=>equal(doc[k],v));
function reviewRevision(previous,current){
    const docs=new Map(previous.writes.map(w=>[w.path,w.fields]));
    return current.writes.map(w=>({path:w.path,
        expectedMatchesPriorAuthoredRevision:matches(docs.get(w.path),w.expected||{})&&!(w.expectedAbsent||[]).some(k=>Object.hasOwn(docs.get(w.path)||{},k)),
        changedFields:Object.keys(w.fields).filter(k=>!equal(docs.get(w.path)?.[k],w.fields[k]))}));
}
function build(snapshot,previous,current,feedback,wording){
    const docs=new Map(Object.entries(snapshot.collections).flatMap(([c,rows])=>rows.map(d=>[c+'/'+d.id,d])));
    const words=new Map(wording.writes.map(w=>[w.path,w]));
    return {mode:'offline-review-only',liveStateVerified:false,snapshotAt:snapshot.auditedAt,
        archaeology:{retain:'data/archaeology-pilot-migration.json',priorRevision:'backups/archaeology-pilot-before-glossary.json',
            disposition:'Preserve the current guarded revision; do not rebase it onto the older snapshot or execute the historical backup as a new migration.',
            documents:reviewRevision(previous,current)},
        feedback:feedback.writes.map(w=>{const word=words.get(w.path),doc=docs.get(w.path);
            return {path:w.path,feedbackMatchesSnapshot:matches(doc,w.fields),wordingOverlap:!!word,
                wordingMatchesSnapshot:word?matches(doc,word.fields):null,
                disposition:matches(doc,w.fields)?'Snapshot already represents feedback; no replay justified by this baseline.':'Review the whole question with later mission revisions before any replay.'};}),
        pending:['Current live state','Whole-question review for nonmatching feedback','Teacher review','Authenticated verification'],
        executable:false};
}
if(require.main===module){
    const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
    const report=build(read('docs/validation/learning-content-snapshot.json'),read('backups/archaeology-pilot-before-glossary.json'),read('data/archaeology-pilot-migration.json'),read('data/question-feedback-migration.json'),read('data/grade5-quiz-wording.json'));
    fs.writeFileSync(path.join(root,'docs/validation/prologue-feedback-review-local.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({archaeologyDocuments:report.archaeology.documents.length,matchingPriorRevision:report.archaeology.documents.filter(d=>d.expectedMatchesPriorAuthoredRevision).length,
        feedbackMatchesSnapshot:report.feedback.filter(q=>q.feedbackMatchesSnapshot).length,feedbackNeedsReview:report.feedback.filter(q=>!q.feedbackMatchesSnapshot).length,
        wordingOverlaps:report.feedback.filter(q=>q.wordingOverlap).length,wordingOverlapsMatchingSnapshot:report.feedback.filter(q=>q.wordingOverlap&&q.wordingMatchesSnapshot).length}));
}
module.exports={reviewRevision,build};
