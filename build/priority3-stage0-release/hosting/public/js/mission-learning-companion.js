import {auth} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {validatedMissionLearningGuide} from './mission-learning-guide-policy.js';
import {renderMissionQuestion,mountMissionApplication} from './mission-learning-guide-view.js';
const questionHost = document.getElementById('missionLearningCompass');
const application = document.getElementById('missionApplication');
if (questionHost) {
    const params = new URLSearchParams(location.search);
    let generation = 0, dispose = null, suspended = false;
    function clear() {
        generation++;
        dispose?.();
        dispose = null;
        questionHost.replaceChildren();
        questionHost.hidden = true;
        if (application) {
            application.open = false;
            application.hidden = true;
            application.querySelector('[data-mission-application]')?.replaceChildren();
        }
    }
    function receive(event) {
        clear();
        const {mission, user} = event.detail || {};
        if (suspended || !user || user !== auth.currentUser || params.get('reviewTopic')) return;
        const guide = validatedMissionLearningGuide(mission);
        if (!guide) return;
        const request = generation;
        questionHost.hidden = false;
        renderMissionQuestion(questionHost, guide);
        const host = application?.querySelector('[data-mission-application]');
        if (host) {
            application.hidden = false;
            dispose = mountMissionApplication(host, guide, {
                isCurrent: () => !suspended && request === generation && auth.currentUser === user
            });
        }
    }
    // Reuse the page's loaded Firestore mission; no additional database request.
    // Request/reply covers either module finishing initialization first.
    function requestGuide() {
        clear();
        if (!suspended && auth.currentUser) document.dispatchEvent(new Event('lakbay:request-mission-guide'));
    }
    document.addEventListener('lakbay:mission-guide', receive);
    onAuthStateChanged(auth, requestGuide);
    window.addEventListener('pagehide', () => { suspended = true; clear(); });
    window.addEventListener('pageshow', event => {
        suspended = false;
        if (event.persisted) requestGuide();
    });
}
