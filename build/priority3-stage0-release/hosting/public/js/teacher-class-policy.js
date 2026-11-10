export function textField(value, label, maximum, optional = false) {
    const text = String(value ?? '').trim();
    if ((!optional && !text) || text.length > maximum) throw Error(`${label} must ${optional ? 'be' : 'contain 1 to'} ${maximum} characters or fewer.`);
    return text;
}
export function classDetails(name, description) {
    return {name: textField(name, 'Class name', 100), description: textField(description, 'Description', 500, true)};
}
export function invitationCode(random = crypto) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    // Rejection sampling avoids favouring some characters after modulo.
    while (result.length < 12) {
        for (const byte of random.getRandomValues(new Uint8Array(24))) {
            if (byte < 252 && result.length < 12) result += alphabet[byte % 36];
        }
    }
    return result;
}
export function publishedDetails(kind, values) {
    const result = {title: textField(values.title, 'Title', 120), status: kind==='assignment'&&['closed','withdrawn'].includes(values.status)?values.status:values.status === 'draft' ? 'draft' : 'published'};
    if (kind === 'announcement') result.body = textField(values.body, 'Message', 3000);
    else {
        result.instructions = textField(values.instructions, 'Instructions', 1500, true);
        result.missionId = textField(values.missionId, 'Mission', 150);
        result.chapterId = textField(values.chapterId, 'Chapter', 150);
        if (result.missionId.includes('/') || result.chapterId.includes('/')) throw Error('Choose a valid mission.');
    }
    return result;
}
export function assignmentDueMillis(value) {
    if (!value) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw Error('Choose a valid due date.');
    const milliseconds = Date.parse(value + 'T23:59:59.999+08:00');
    if (!Number.isFinite(milliseconds) || new Date(milliseconds + 8 * 60 * 60 * 1000).toISOString().slice(0,10) !== value) throw Error('Choose a valid due date.');
    return milliseconds;
}
export function assignmentDueInput(value) {
    const time = value?.toMillis?.();
    return Number.isFinite(time) ? new Date(time + 8 * 60 * 60 * 1000).toISOString().slice(0,10) : '';
}
export function assignmentProgressState(record, assignment, unavailable = false, now = Date.now()) {
    if (unavailable || (record && record.chapterId !== assignment.chapterId)) return {status:'unavailable',label:'Unavailable',timing:'Unavailable'};
    const cutoff=assignment.endedAt?.toMillis?.();if(['closed','withdrawn'].includes(assignment.status)&&(!Number.isFinite(cutoff)||cutoff>now))return {status:'unavailable',label:'Unavailable',timing:'Ending date unavailable'};
    if(Number.isFinite(cutoff)&&record?.completed===true&&!Number.isFinite(record.completedAt?.toMillis?.()))return {status:'unavailable',label:'Unavailable',timing:'Completion date unavailable'};
    if(Number.isFinite(cutoff)&&record?.completedAt?.toMillis?.()>cutoff)record=null;
    const deadline = assignment.dueAt?.toMillis?.();
    const due = Number.isFinite(deadline);
    if (record?.completed === true) {
        const completed = record.completedAt?.toMillis?.();
        return {status:'completed',label:'Completed',timing:!due ? 'No due date' : !Number.isFinite(completed) ? 'Completion date unavailable' : completed <= deadline ? 'Completed by due date' : 'Completed after due date'};
    }
    if(['closed','withdrawn'].includes(assignment.status))return {status:'incomplete',label:'No verified completion before ending',timing:assignment.status==='closed'?'Activity closed':'Activity withdrawn'};
    return {status:'incomplete',label:'Not yet completed',timing:due && deadline < now ? 'Past due · not yet completed' : due ? 'Due ' + assignmentDueInput(assignment.dueAt) : 'No due date'};
}
// A review is based on newly saved evidence, never a historical completion flag.
export function reviewEvidence(assignment,attempts,userId,now=Date.now()) {
    const anchor=assignment.assignedAt?.toMillis?.(),ended=['closed','withdrawn'].includes(assignment.status),cutoff=ended?assignment.endedAt?.toMillis?.():now;
    if(ended&&(!Number.isFinite(cutoff)||cutoff>now||cutoff<anchor))return {unavailable:true,completed:false};
    const relevant=attempts.filter(a=>a.userId===userId&&a.missionId===assignment.missionId&&a.chapterId===assignment.chapterId);
    if(!Number.isFinite(anchor)||anchor<=0||anchor>now)return {unavailable:true,completed:false};
    const dated=relevant.filter(a=>Number.isFinite(a.completedAt?.toMillis?.())&&a.completedAt.toMillis()>0&&a.completedAt.toMillis()<=now&&Number.isFinite(a.score)&&a.score>=0&&a.score<=100);
    const within=dated.filter(a=>a.completedAt.toMillis()<=cutoff);
    const before=within.filter(a=>a.completedAt.toMillis()<=anchor).sort((a,b)=>b.completedAt.toMillis()-a.completedAt.toMillis());
    const after=within.filter(a=>a.completedAt.toMillis()>anchor).sort((a,b)=>b.completedAt.toMillis()-a.completedAt.toMillis());
    const passed=after.find(a=>a.passed===true);
    const ambiguous=rows=>rows.length>1&&rows[0].completedAt.toMillis()===rows[1].completedAt.toMillis();
    const baseline=ambiguous(before)?null:before[0]||null,latest=ambiguous(after)?null:after[0]||null;
    return {unavailable:relevant.length!==dated.length,completed:!!passed,passingAttemptId:passed?.id||null,completedAt:passed?.completedAt||null,bestScore:latest?.score??null,baseline:baseline?.score??null,baselineAt:baseline?.completedAt||null,latest:latest?.score??null,latestAt:latest?.completedAt||null,change:baseline&&latest?latest.score-baseline.score:null,attempted:after.length>0};
}

// Compare the server record with the version opened by an editor. No stored schema field is needed.
export function publicationVersion(record){
    const normalize=value=>{if(value===null||typeof value!=='object')return value;if(typeof value.toMillis==='function')return ['timestamp',value.seconds??null,value.nanoseconds??null,value.toMillis()];if(Array.isArray(value))return value.map(normalize);return Object.fromEntries(Object.keys(value).sort().filter(key=>value[key]!==undefined).map(key=>[key,normalize(value[key])]));};
    return JSON.stringify(normalize(Object.fromEntries(Object.entries(record||{}).filter(([key])=>key!=='id'))));
}

// Learning evidence and conversation progress are separate; none of these states awards a grade or XP.
export function reviewLearningStages(evidence,reflection,{reflectionAvailable=true,requested=true}={}){
 const practice=!evidence||evidence.unavailable?'unavailable':evidence.completed?'passed':'not-yet';
 const valid=reflection===null||(typeof reflection?.body==='string'&&reflection.body.trim()&&typeof reflection.response==='string');
 const known=reflectionAvailable&&!!valid;
 const explanation=!requested?'not-requested':!known?'unavailable':reflection?'shared':'not-yet';
 const guidance=!requested?'not-requested':!known?'unavailable':!reflection?'after-explanation':reflection.response.trim()?'sent':'not-yet';
 return {practice,explanation,guidance,
  practiceLabel:({unavailable:'Practice unavailable',passed:'Practice passed','not-yet':'No passing result yet'})[practice],
  explanationLabel:({'not-requested':'Not requested',unavailable:'Explanation unavailable',shared:'Explanation shared','not-yet':'Not shared yet'})[explanation],
  guidanceLabel:({'not-requested':'Not requested',unavailable:'Guidance unavailable','after-explanation':'After an explanation',sent:'Teacher guidance sent','not-yet':'Awaiting teacher guidance'})[guidance]};
}

export function activeReviewDuplicates(rows,classId,missionId,userIds,excludedIds=[]){
 const targets=new Set(userIds),excluded=new Set(excludedIds);
 return rows.filter(row=>row.classId===classId&&row.missionId===missionId&&row.status==='published'&&!row.endedAt&&targets.has(row.userId)&&!excluded.has(row.id));
}

export function reviewInterventionSummary(evidence,stages,followup=null){
 const before=evidence?.baseline!=null?'Before assignment: '+evidence.baseline+'% on the latest dated saved attempt.':'Before assignment: no unambiguous dated baseline available.';
 const support=stages?.guidance==='sent'?'Teacher guidance was sent for the current explanation.':stages?.guidance==='unavailable'?'Teacher guidance could not be checked.':stages?.guidance==='not-requested'?'This review has no explanation/guidance prompt.':'Teacher guidance has not been sent for the current explanation.';
 let state='needs-check',after='Check the current practice result and explanation before choosing support.',next='Read the student explanation and identify a specific clue to discuss.';
 if(!evidence||evidence.unavailable||stages?.guidance==='unavailable'){state='unavailable';after='Evidence is incomplete or unavailable; no improvement judgment is made.';next='Refresh evidence before deciding the next step.';}
 else if(stages?.guidance==='sent'){
  if(!followup||followup.unavailable){after='Post-guidance evidence could not be compared safely.';next='Check the saved dates and ask the student to explain the idea.';}
  else if(!followup.attempted){state='awaiting-followup';after='No saved quiz attempt after this guidance yet.';next='Invite the student to revisit the clue, then try practice and explain their reasoning.';}
  else if(followup.change==null){after='A post-guidance attempt exists, but there is no clear before/after score comparison.';next='Read the explanation and inspect the dated attempts.';}
  else {state=followup.change>0?'higher-practice-score':followup.change<0?'lower-practice-score':'same-practice-score';after='After guidance: '+followup.latest+'% (before guidance: '+followup.baseline+'%; change: '+(followup.change>0?'+':'')+followup.change+' percentage points).';next=followup.change>0?'A higher practice score is observed. Ask for a supporting clue and a new example before judging understanding.':'Another understanding check is useful. Discuss the specific misconception before assigning more work.';}
 }
 return {state,before,support,after,next,limit:'Saved practice scores may use different questions. This does not establish mastery, retention, or that guidance caused a change.'};
}
