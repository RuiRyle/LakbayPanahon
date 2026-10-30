export function nextChapterCandidate(currentId, chapters, progress, userId) {
    const current = chapters.find(row => row.id === currentId);
    if (!current) return null;
    const ordered = chapters.filter(row => row.eraId === current.eraId && row.status === "active" && row.contentReady !== false)
        .sort((a,b) => (Number(a.order)||0)-(Number(b.order)||0) || a.id.localeCompare(b.id));
    const completed = new Set(progress.filter(row => row.userId === userId && row.completed === true).map(row => row.chapterId));
    if (!completed.has(currentId)) return null;
    const next = ordered.find(row => !completed.has(row.id) && (row.requiredForProgression!==false || ordered.findIndex(item=>item.id===row.id)>ordered.findIndex(item=>item.id===currentId)));
    if (!next || ordered.findIndex(row=>row.id===next.id) <= ordered.findIndex(row=>row.id===currentId)) return null;
    return next;
}

export function nextChapterAfterCompletion(currentId, chapters, progress, missions, userId) {
    const next = nextChapterCandidate(currentId, chapters, progress, userId);
    return next && missions.some(row => row.chapterId === next.id && row.status === "active") ? next : null;
}
