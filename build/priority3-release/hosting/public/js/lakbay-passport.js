const node = (tag, copy, className) => {
    const element = document.createElement(tag);
    if (copy) element.textContent = copy;
    if (className) element.className = className;
    return element;
};
export function completionDate(value) {
    const date = value?.toDate?.();
    return date instanceof Date && Number.isFinite(date.getTime())
        ? new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', year: 'numeric', month: 'short', day: 'numeric' }).format(date)
        : '';
}
export function passportEntries(groups, progress, userId) {
    const owned = progress.filter(row => row.userId === userId && row.completed === true);
    return groups.flatMap(era => era.chapters.filter(chapter => chapter.ready && chapter.completed)
        .map(chapter => {
            const record = owned.find(row => row.chapterId === chapter.id);
            return record ? { id: chapter.id, eraId: era.id, title: chapter.title || 'Historical chapter', era: era.title || era.name || 'Philippine history', date: completionDate(record.completedAt) } : null;
        }).filter(Boolean));
}
export function renderPassport(container, entries) {
    if (!container) return;
    container.replaceChildren();
    if (!entries.length) {
        container.append(node('p', 'Your first stamp is waiting. Complete a chapter challenge to record a new destination in your passport.'));
        return;
    }
    for (const entry of entries) {
        const stamp = node('article', '', 'passport-stamp');
        stamp.append(node('span', 'CHAPTER COMPLETED', 'stamp-mark'), node('h3', entry.title), node('small', entry.era));
        if (entry.date) stamp.append(node('small', 'Completed ' + entry.date));
        const link = node('a', 'Revisit chapter');
        link.href = 'mission.html?' + new URLSearchParams({ chapter: entry.id });
        stamp.append(link); container.append(stamp);
    }
}
