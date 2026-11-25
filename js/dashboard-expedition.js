import {createHomeChapterArt} from './home-learning-trail.js';

// Mirror the existing level output, including Daily Challenge updates. No level math.
const currentLevelOutput=document.getElementById('studentLevel');
const levelStatistic=document.getElementById('studentLevelStat');
if(currentLevelOutput&&levelStatistic){
    const syncLevelStatistic=()=>{levelStatistic.textContent=currentLevelOutput.textContent.trim();};
    new MutationObserver(syncLevelStatistic).observe(currentLevelOutput,{childList:true,characterData:true,subtree:true});
    syncLevelStatistic();
}

// A presentation layer over the existing recommendation; never selects a new route.
export function renderDashboardExpedition(state, eras = [], loadMissionScenes, isCurrent = () => true) {
    const host = document.getElementById('homeExpeditionArt');
    if (!host) return;
    host.replaceChildren();
    const chapterArt = createHomeChapterArt(state.chapter || {}, {eager:true});
    host.append(chapterArt);
    if (state.kind === 'mission' && state.mission?.id && loadMissionScenes) {
        showMissionArtwork(host, chapterArt, state.mission.id, state.draft, loadMissionScenes, isCurrent);
    }
    host.dataset.state = state.kind;
    const journeyHost = document.getElementById('newJourneyState');
    if(journeyHost)journeyHost.dataset.journeyState = state.kind;
    const details = document.querySelector('#newJourneyState .journey-details');
    if (!details) return;
    for(const control of details.querySelectorAll('a,button')){
        control.classList.add('lp-button', control.matches('.journey-action-button') ? 'lp-button-primary' : 'lp-button-secondary');
    }
    const era = eras.find(item => item.id === state.chapter?.eraId);
    const savedIndex = state.draft?.state?.index;
    if (state.kind === 'mission' && state.draft?.kind === 'quiz' && Number.isInteger(savedIndex) && savedIndex >= 0) {
        appendResumeNote(details, 'Saved checkpoint · Question ' + (savedIndex + 1));
    }
    if (typeof era?.dateRange === 'string' && era.dateRange.trim()) {
        const period = document.createElement('p');
        period.className = 'journey-meta hq-authored-period';period.textContent = era.dateRange;
        details.querySelector('.journey-chapter-label')?.after(period);
    }
    const action = details.querySelector('a.journey-action-button');
    // Keep explicit resume, assessment and recovery labels for those existing flows.
    if (action && state.kind === 'mission' && !state.draft && state.attempt?.passed !== false) {
        action.textContent = state.started ? 'Resume Lesson' : 'Start Lesson';
    }
}

function appendResumeNote(details, text) {
    const note = document.createElement('p');
    note.className = 'hq-saved-checkpoint';
    note.textContent = text;
    details.querySelector('.journey-action-button')?.before(note);
}

async function showMissionArtwork(host, chapterArt, missionId, draft, loadMissionScenes, isCurrent) {
    try {
        const scenes = await loadMissionScenes(missionId);
        if (!isCurrent() || chapterArt.parentNode !== host) return;
        const savedScene = draft?.kind === 'story' && scenes.find(scene =>
            scene.status === 'active' && scene.missionId === missionId && scene.id === draft.state?.sceneId);
        const details = document.querySelector('#newJourneyState .journey-details');
        if (details && savedScene && typeof savedScene.title === 'string' && savedScene.title.trim()) {
            appendResumeNote(details, 'Saved scene · ' + savedScene.title.trim());
        }
        const eligible = scenes.filter(scene => scene.status === 'active' && scene.missionId === missionId
            && /^\.\.\/assets\/story\/[a-z0-9][a-z0-9_.-]*\.(?:svg|png|jpe?g|webp)$/i.test(scene.imageUrl));
        // The geography lesson opens with a regional map. Use its island-group
        // map as the cover so the Philippine coastline is the focal point.
        const coverRank = scene => scene === savedScene ? -2 : scene.id === 'prologue-mission1-scene3' ? -1 : 0;
        eligible.sort((a, b) => coverRank(a) - coverRank(b) || (Number(a.order) || 0) - (Number(b.order) || 0));
        for (const scene of eligible) {
            const image = document.createElement('img');
            image.alt = '';
            image.className = 'hq-chapter-illustration hq-mission-illustration';
            image.src = scene.imageUrl;
            try { await image.decode(); } catch { continue; }
            if (!isCurrent() || chapterArt.parentNode !== host) return;
            chapterArt.replaceWith(image);
            return;
        }
    } catch {
        // Keep the chapter illustration if the optional scene lookup fails.
    }
}
