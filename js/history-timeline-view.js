// Display-only renderer. All ordering, completion and access come from buildJourneyPath.
const chapterArtwork = {
    'era1-prologue': '../assets/brand/expedition-atlas.svg',
    'chapter-1': '../assets/story/chapter-1-mission-1-scene-1.png',
    'chapter-2': '../assets/story/chapter-2-mission-1-scene-1.png',
    'chapter-3': '../assets/story/chapter3-mission1-scene1.png',
    'chapter-4': '../assets/story/learning-guide-chapter4-mission1-scene1.svg'
};
const timelineText = (tag, value, className) => {
    const node = document.createElement(tag);
    node.textContent = value;
    if (className) node.className = className;
    return node;
};
function timelineMeter(value, total, label) {
    const meter = document.createElement('progress');
    meter.max = Math.max(1, total);
    meter.value = value;
    meter.setAttribute('aria-label', label);
    return meter;
}
function timelinePicture(chapter) {
    const frame = timelineText('div', '', 'timeline-chapter-art');
    frame.setAttribute('aria-hidden', 'true');
    const image = document.createElement('img');
    image.alt = ''; image.loading = 'lazy'; image.decoding = 'async';
    const fallback = chapterArtwork[chapter.id] || '../assets/brand/expedition-archive.svg';
    // Authored HTTPS imagery may override the existing local decorative illustration.
    let source = fallback;
    if (typeof chapter.imageUrl === 'string') {
        try { const url = new URL(chapter.imageUrl); if (url.protocol === 'https:') source = url.href; } catch {}
    }
    image.addEventListener('error', () => {
        if (image.dataset.fallback) { image.remove(); return; }
        image.dataset.fallback = 'true'; image.src = fallback;
    });
    image.src = source; frame.append(image); return frame;
}
export function renderHistoryTimeline(host, groups, selected = '') {
    host.replaceChildren();
    const visible = groups.filter(group => !selected || (group.id || 'unassigned') === selected);
    if (!visible.length) return;
    const periods = timelineText('div', '', 'timeline-periods');
    for (const era of visible) {
        const section = timelineText('section', '', 'timeline-period');
        const heading = timelineText('div', '', 'timeline-period-heading');
        const symbol = timelineText('span', '\u25c8', 'timeline-period-symbol'); symbol.setAttribute('aria-hidden', 'true');
        const title = timelineText('div', ''); title.append(timelineText('h2', era.title || 'Learning chapters'));
        if (era.dateRange) title.append(timelineText('p', era.dateRange, 'timeline-date'));
        heading.append(symbol, title); section.append(heading);
        if (era.description) section.append(timelineText('p', era.description, 'timeline-era-description'));
        const list = timelineText('ol', '', 'history-timeline-list');
        for (const [index, chapter] of era.chapters.entries()) {
            const item = timelineText('li', '', 'history-timeline-stop');
            item.dataset.chapterId = chapter.id;
            item.dataset.state = chapter.completed ? 'complete' : chapter.accessible ? 'available' : 'locked';
            const layout = timelineText('div', '', 'timeline-chapter-layout');
            const copy = timelineText('div', '', 'timeline-chapter-copy');
            const top = timelineText('div', '', 'timeline-chapter-top');
            top.append(timelineText('span', chapter.order === 0 ? 'INTRODUCTION' : 'CHAPTER ' + (Number.isFinite(chapter.order) && chapter.order > 0 ? chapter.order : index + 1), 'timeline-chapter-number'),
                timelineText('span', chapter.completed ? '\u2713 Completed' : chapter.accessible ? 'Ready to explore' : 'Locked', 'timeline-state'));
            copy.append(top, timelineText('h3', chapter.title || 'History chapter'));
            if (chapter.dateRange) copy.append(timelineText('p', chapter.dateRange, 'timeline-date'));
            if (chapter.description) copy.append(timelineText('p', chapter.description, 'timeline-chapter-description'));
            const total = chapter.missions.length, done = chapter.missions.filter(mission => mission.completed).length;
            const progress = timelineText('div', '', 'timeline-chapter-progress');
            const progressLabel = timelineText('div', '', 'timeline-progress-label');
            progressLabel.append(timelineText('span', 'Mission progress'), timelineText('span', done + ' / ' + total + ' completed'));
            progress.append(progressLabel, timelineMeter(done, total, 'Mission progress: ' + chapter.title)); copy.append(progress);
            const details = document.createElement('details'); details.append(timelineText('summary', 'What happens in this chapter?'));
            const topics = document.createElement('ul');
            for (const mission of chapter.missions) topics.append(timelineText('li', mission.title || 'History mission'));
            if (!total) topics.append(timelineText('li', 'No missions are published for this chapter yet.'));
            details.append(topics); copy.append(details);
            const footer = timelineText('div', '', 'timeline-chapter-footer');
            if (chapter.accessible) {
                const link = timelineText('a', chapter.completed ? 'Revisit Chapter' : 'Explore Chapter', 'timeline-chapter-action');
                link.href = 'mission.html?' + new URLSearchParams({chapter: chapter.id});
                footer.append(link);
                if (!chapter.completed && total && done === total) footer.append(timelineText('span', 'Finish the chapter challenge to complete this chapter.', 'timeline-challenge-note'));
            } else footer.append(timelineText('span', chapter.ready === false ? 'This chapter is being prepared.' : 'Continue earlier chapters first.', 'timeline-locked-note'));
            copy.append(footer); layout.append(timelinePicture(chapter), copy); item.append(layout); list.append(item);
        }
        section.append(list); periods.append(section);
    }
    const side = timelineText('aside', '', 'timeline-side'); side.setAttribute('aria-label', 'Era progress and learning highlights');
    const panel = timelineText('section', '', 'timeline-side-panel');
    panel.append(timelineText('span', 'YOUR EXPEDITION', 'eyebrow'), timelineText('h2', selected ? 'Era progress' : 'Progress by era'));
    for (const era of visible) {
        const complete = era.chapters.filter(chapter => chapter.completed).length;
        const meter = timelineText('div', '', 'timeline-era-meter');
        meter.append(timelineText('strong', era.title || 'Learning chapters'));
        const count = timelineText('div', '', 'timeline-era-count');
        count.append(timelineText('b', complete + ' / ' + era.chapters.length), timelineText('span', 'chapters complete'));
        meter.append(count, timelineMeter(complete, era.chapters.length, 'Chapter completion: ' + era.title)); panel.append(meter);
    }
    panel.append(timelineText('p', 'Chapter completion comes from your saved chapter results. Finishing missions alone does not complete a chapter.'));
    const highlights = timelineText('section', '', 'timeline-side-panel');
    highlights.append(timelineText('span', 'LOOK CLOSER', 'eyebrow'), timelineText('h2', 'Learning highlights'), timelineText('p', 'A few of the published lessons along this trail.'));
    const lessons = timelineText('ul', '', 'timeline-highlights');
    const titles = [...new Set(visible.flatMap(era => era.chapters.flatMap(chapter => chapter.missions.map(mission => mission.title).filter(Boolean))))].slice(0, 4);
    for (const name of titles) lessons.append(timelineText('li', name));
    if (!titles.length) lessons.append(timelineText('li', 'Lesson highlights will appear when missions are published.'));
    highlights.append(lessons); side.append(panel, highlights); host.append(periods, side);
}
