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
export function renderDashboardExpedition(state, eras = []) {
    const host = document.getElementById('homeExpeditionArt');
    if (!host) return;
    host.replaceChildren();
    host.append(createHomeChapterArt(state.chapter || {}));
    host.dataset.state = state.kind;
    const details = document.querySelector('#newJourneyState .journey-details');
    if (!details) return;
    const era = eras.find(item => item.id === state.chapter?.eraId);
    if (typeof era?.dateRange === 'string' && era.dateRange.trim()) {
        const period = document.createElement('p');
        period.className = 'journey-meta hq-authored-period';period.textContent = era.dateRange;
        details.querySelector('.journey-chapter-label')?.after(period);
    }
    const action = details.querySelector('a.journey-action-button');
    // Keep explicit resume, assessment and recovery labels for those existing flows.
    if (action && state.kind === 'mission' && !state.draft && state.attempt?.passed !== false) {
        action.textContent = state.started ? 'Continue Learning' : 'Start Learning';
    }
}
