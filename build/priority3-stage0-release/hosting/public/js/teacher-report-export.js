export const learningEvidenceGuide = Object.freeze([
 {label:'Participation and rewards',meaning:'XP and levels recognize game participation and achievements. They do not measure understanding.',next:'Use learning records to decide what to discuss.'},
 {label:'Mission completion',meaning:'A saved completion records that the mission goal was reached. It is not a mastery percentage.',next:'Check the related quiz evidence and ask the student to explain an idea.'},
 {label:'Quiz practice',meaning:'A dated attempt shows saved performance on that attempt. Scores are browser-graded practice evidence; questions may differ.',next:'Review the flagged topic and the actual lesson before choosing support.'},
 {label:'Student explanation',meaning:'A shared explanation is available for teacher review. Submission alone does not establish that the reasoning is correct.',next:'Check the historical claim, supporting clue and connection between them.'},
 {label:'Teacher guidance',meaning:'A sent response records support provided. It does not establish that the student understood or improved.',next:'Check the student response and look for subsequent practice or explanation evidence.'},
 {label:'Retention and application',meaning:'Current completion and immediate retry results do not establish lasting learning or transfer to another example.',next:'Use a later check and a new example during learning evaluation. No retention score is inferred here.'}
]);
export function learningReportRows({studentName,className,report,missions,generatedAt=new Date()}) {
    const timestamp=value=>{const ms=value?.toMillis?.();return Number.isFinite(ms)?new Date(ms).toISOString():'Unavailable';};
    const title=id=>missions.find(m=>m.id===id)?.title||missions.find(m=>m.id===id)?.name||id||'Unknown mission';
    const topic=value=>String(value).replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[-_]+/g,' ');
    const rows=[['LakbayPanahon student learning report'],['Student',studentName],['Class',className],['Generated (UTC)',generatedAt.toISOString()],['Scope','Saved mission progress and browser-graded quiz attempts; not a verified exam or measure of ability. Completion is not mastery; XP is not a learning score. Explanations, guidance, retention and transfer are not assessed by this export. Private teacher notes and student-visible feedback are excluded.'],[],['Record type','Mission','Completed','Score (%)','Saved result','Recorded time (UTC)','Topics to revisit']];
    for(const record of report.progress)rows.push(['Mission progress',title(record.missionId),record.completed===true?'Yes':'Not yet completed',Number.isFinite(record.bestScore)?record.bestScore:'Unavailable','Best saved mission score',timestamp(record.completedAt),'']);
    for(const attempt of [...report.attempts].sort((a,b)=>(b.completedAt?.toMillis?.()||0)-(a.completedAt?.toMillis?.()||0)))rows.push(['Quiz attempt',title(attempt.missionId),'',Number.isFinite(attempt.score)?attempt.score:'Unavailable',attempt.passed===true?'Passed':attempt.passed===false?'Review suggested':'Unavailable',timestamp(attempt.completedAt),Array.isArray(attempt.topicsForReview)?attempt.topicsForReview.map(topic).join('; '):'']);
    if(!report.progress.length&&!report.attempts.length)rows.push(['No saved learning records available']);
    return rows;
}
export function learningReportCSV(rows) {
    return '\uFEFF'+rows.map(row=>row.map(value=>{
        let text=String(value??'');
        if(/^[\s\u0000-\u001f]*[=+@-]/.test(text)||/^[\t\r\n]/.test(text))text="'"+text;
        return '"'+text.replace(/"/g,'""')+'"';
    }).join(',')).join('\r\n');
}
export function downloadLearningReport(rows,filename='lakbay-student-learning-report.csv') {
    const url=URL.createObjectURL(new Blob([learningReportCSV(rows)],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function printLearningReport(rows) {
    const frame=document.createElement('iframe');frame.title='Printable student learning report';frame.className='teacher-print-frame';frame.style.cssText='position:fixed;width:1px;height:1px;left:-10000px;border:0';document.body.append(frame);
    const doc=frame.contentDocument;
    const style=doc.createElement('style');style.textContent='body{font:12px/1.5 Arial,sans-serif;color:#16283c;margin:28px}h1{font-size:20px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:8px;border:1px solid #aaa;text-align:left;vertical-align:top;overflow-wrap:anywhere}thead{display:table-header-group}tr{break-inside:avoid}p{margin:6px 0}@page{size:landscape;margin:15mm}';doc.head.append(style);doc.title='LakbayPanahon student learning report';
    const add=(tag,text,parent)=>{const el=doc.createElement(tag);el.textContent=text;parent.append(el);return el;};
    add('h1',rows[0][0],doc.body);for(const row of rows.slice(1,5))add('p',row.join(': '),doc.body);
    const table=doc.createElement('table');doc.body.append(table);const head=doc.createElement('thead');table.append(head);const heading=doc.createElement('tr');head.append(heading);for(const cell of rows[6])add('th',cell,heading);
    const body=doc.createElement('tbody');table.append(body);for(const row of rows.slice(7)){const tr=doc.createElement('tr');body.append(tr);for(const cell of row)add('td',String(cell??''),tr);}
    const cleanup=()=>frame.remove();frame.contentWindow.addEventListener('afterprint',cleanup,{once:true});setTimeout(cleanup,120000);
    frame.contentWindow.focus();frame.contentWindow.print();
}

export function classroomReportRows({className,students,missions,generatedAt=new Date()}) {
    const rows=[['LakbayPanahon classroom learning report'],['Class',className],['Generated (UTC)',generatedAt.toISOString()],['Students in snapshot',students.length],['Scope','Current members; completion uses the currently available mission catalog. Latest quiz scores are saved practice evidence, not official grades. Unavailable records are not zero scores. Completion and XP do not establish understanding; explanations, guidance, retention and transfer are not assessed by this export. Private notes and feedback are excluded.'],[],['Student','Record availability','Completed missions','Available missions','Latest quiz score (%)','Latest quiz result','Latest quiz time (UTC)']];
    const missionKeys=new Set(missions.map(m=>m.chapterId+'|'+m.id));
    for(const student of students){
        if(!student.report){rows.push([student.name,'Unavailable','','','','','']);continue;}
        const {report}=student,name=[report.profile?.firstName,report.profile?.lastName].filter(Boolean).join(' ')||student.name;
        const completed=new Set(report.progress.filter(p=>p.completed===true&&missionKeys.has(p.chapterId+'|'+p.missionId)).map(p=>p.chapterId+'|'+p.missionId)).size;
        const attempts=report.attempts.filter(a=>missionKeys.has(a.chapterId+'|'+a.missionId)&&Number.isFinite(a.completedAt?.toMillis?.())&&a.completedAt.toMillis()>0&&a.completedAt.toMillis()<=generatedAt.getTime()).sort((a,b)=>b.completedAt.toMillis()-a.completedAt.toMillis());
        const latest=attempts[0],ambiguous=latest&&attempts[1]?.completedAt.toMillis()===latest.completedAt.toMillis();
        rows.push([name,'Available',completed,missionKeys.size,latest&&!ambiguous&&Number.isFinite(latest.score)&&latest.score>=0&&latest.score<=100?latest.score:'Unavailable',!latest?'No dated quiz attempt':ambiguous?'Latest attempt unclear':latest.passed===true?'Passed':latest.passed===false?'Review suggested':'Unavailable',latest&&!ambiguous?new Date(latest.completedAt.toMillis()).toISOString():'Unavailable']);
    }
    return rows;
}
