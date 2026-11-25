import {chapterArtworkFor} from './chapter-artwork.js';
// Display-only renderer. All ordering, completion and access come from buildJourneyPath.
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
    const fallback = '../assets/brand/expedition-archive.svg';
    const source = chapterArtworkFor(chapter.id)?.src || fallback;
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
    const destinations = new Map();
    for (const era of visible) {
        const section = timelineText('section', '', 'timeline-period');
        const heading = timelineText('div', '', 'timeline-period-heading');
        const symbol = timelineText('span', '\u25c8', 'timeline-period-symbol'); symbol.setAttribute('aria-hidden', 'true');
        const title = timelineText('div', ''); title.append(timelineText('h2', era.title || 'Learning chapters'));
        if (era.dateRange) title.append(timelineText('p', era.dateRange, 'timeline-date'));
        const destination = title.querySelector('h2');
        destination.tabIndex = -1;
        destinations.set(era, destination);
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
    const side = timelineText('aside', '', 'timeline-side'); side.setAttribute('aria-label', 'Lesson shortcut and era index');
    const panel = timelineText('section', '', 'timeline-side-panel timeline-progress-panel');
    const header = timelineText('div', '', 'timeline-ledger-heading');
    const emblem = timelineText('span', '', 'timeline-ledger-emblem');
    emblem.setAttribute('aria-hidden', 'true');
    emblem.append(timelineText('span', '', 'interface-icon interface-icon--compass'));
    header.append(emblem, timelineText('h2', 'Jump to an era'));
    panel.append(header);
    for (const era of visible) {
        const complete = era.chapters.filter(chapter => chapter.completed).length;
        const title = era.title || 'Learning chapters';
        const meter = timelineText('button', '', 'timeline-era-meter');
        meter.type = 'button';
        meter.addEventListener('click', () => destinations.get(era).focus());
        meter.dataset.eraId = era.id;
        const scene = timelineText('span', '', 'timeline-era-scene');
        scene.setAttribute('aria-hidden', 'true');
        meter.append(scene, timelineText('strong', title, 'timeline-index-title'));
        const count = timelineText('div', '', 'timeline-era-count');
        count.append(timelineText('b', complete + ' / ' + era.chapters.length), timelineText('span', 'chapters complete'));
        meter.append(count); panel.append(meter);
    }

    const highlights = timelineText('section', '', 'timeline-side-panel timeline-highlights-panel');
    const highlightsHeader = timelineText('div', '', 'timeline-ledger-heading');
    const book = timelineText('span', '', 'timeline-ledger-emblem');
    book.setAttribute('aria-hidden', 'true');
    book.append(timelineText('span', '', 'interface-icon interface-icon--book-open'));
    const available = visible.flatMap(era => era.chapters.filter(chapter => chapter.accessible)
        .flatMap(chapter => chapter.missions.filter(mission => mission.accessible)
            .map(mission => ({chapter, mission}))));
    const pick = available.find(({mission}) => !mission.completed) || available.at(-1);
    highlightsHeader.append(book, timelineText('h2', pick?.mission.completed ? 'Lesson to revisit' : 'Your next lesson'));
    highlights.append(highlightsHeader);
    if (pick) {
        const {chapter, mission} = pick;
        const art = timelinePicture(chapter);
        art.classList.add('timeline-lesson-cover');
        const link = timelineText('a', mission.completed ? 'Revisit lesson' : 'Open lesson', 'timeline-chapter-action');
        link.href = 'story.html?' + new URLSearchParams({chapter: chapter.id, mission: mission.id});
        highlights.append(art, timelineText('p', chapter.title, 'timeline-lesson-chapter'),
            timelineText('h3', mission.title || 'History mission'), link);
    } else {
        highlights.append(timelineText('p', 'No open lessons in this view. Choose another period to find one.'));
    }
    side.append(highlights, panel); host.append(periods, side);
}
