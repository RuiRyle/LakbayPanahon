export function membershipStamp(value) {
    if(!value||typeof value.toMillis!=='function'||!Number.isFinite(value.toMillis()))return null;
    return Number.isInteger(value.seconds)&&Number.isInteger(value.nanoseconds)?value.seconds+':'+value.nanoseconds:'ms:'+value.toMillis();
}
export function classroomAssignmentEvidence(assignment,attempts,membership,userId,now=Date.now()) {
    const joined=membership?.joinedAt?.toMillis?.(),assigned=assignment.publishedAt?.toMillis?.();
    const version=assignment.submissionVersion??1,ended=['closed','withdrawn'].includes(assignment.status);
    const cutoff=ended?assignment.endedAt?.toMillis?.():now;
    if(!Array.isArray(attempts)||membership?.userId!==userId||membership.classId!==assignment.classId||membership.status!=='active'||
        !Number.isFinite(joined)||joined<=0||joined>now||!Number.isInteger(version)||version<1||
        !Number.isFinite(cutoff)||cutoff>now||(!ended&&(!Number.isFinite(assigned)||assigned<=0||assigned>now)))return {unavailable:true,completed:false};
    const key=membershipStamp(membership.joinedAt);
    const relevant=attempts.filter(a=>a.userId===userId&&a.chapterId===assignment.chapterId&&a.missionId===assignment.missionId&&
        a.classroom?.classId===assignment.classId&&a.classroom.assignmentId===assignment.id&&a.classroom.version===version&&
        (a.classroom.joinedAtKey===key||(Number.isFinite(a.classroom.joinedAt)&&a.classroom.joinedAt>0&&a.classroom.joinedAt<joined)));
    const valid=relevant.filter(a=>{
        const at=a.completedAt?.toMillis?.(),context=a.classroom;
        const originalJoin=Number.isFinite(context.joinedAt)?context.joinedAt:joined;
        return Number.isFinite(at)&&at<=cutoff&&at<=now&&at>=context.issuedAt&&context.issuedAt>originalJoin&&
            Number.isFinite(context.assignedAt)&&context.issuedAt>context.assignedAt&&
            (ended||context.assignedAt===assigned)&&Number.isFinite(a.score)&&a.score>=0&&a.score<=100;
    });
    if(valid.length!==relevant.length)return {unavailable:true,completed:false};
    const ordered=[...valid].sort((a,b)=>a.completedAt.toMillis()-b.completedAt.toMillis()||String(a.id).localeCompare(String(b.id)));
    const passed=ordered.find(a=>a.passed===true),latest=ordered.at(-1);
    return {unavailable:false,completed:!!passed,completedAt:passed?.completedAt||null,bestScore:latest?.score??null,latest:latest?.score??null,attempted:ordered.length>0,passingAttemptId:passed?.id||null};
}
