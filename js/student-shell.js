import "./student-audio-host.js";
import {studentRouteForPage, shellUrlForPage} from './student-shell-route.js';

const frame = document.getElementById("studentRouteFrame");
const loading = document.getElementById("shellLoading");
const recovery = document.getElementById('shellRecovery');
const loadingMessage = document.getElementById('shellLoadingMessage');
const compass = document.getElementById('shellLoadingCompass');
const retry = document.getElementById('shellRetry');
let loadTimer;
function showRecovery() {
    loading.hidden = false;
    recovery.hidden = false;
    if (compass) compass.hidden = true;
    frame.inert = true;
    loadingMessage.textContent = 'We could not open this learning page.';
    if (document.activeElement === frame || document.activeElement === document.body) retry.focus();
}
function startLoading() {
    clearTimeout(loadTimer);
    loading.hidden = false;
    recovery.hidden = true;
    if (compass) compass.hidden = false;
    frame.inert = true;
    loadingMessage.textContent = 'Opening your learning journey…';
    loadTimer = setTimeout(showRecovery, 20000);
}
const pagesDirectory = new URL(".", window.location.href);
const requestedRoute = new URLSearchParams(window.location.search).get("route") || "student-dashboard.html";
const routeUrl = new URL(studentRouteForPage(requestedRoute, pagesDirectory) || 'student-dashboard.html', pagesDirectory);

function syncCurrentRoute() {
    try {
        const nextUrl = shellUrlForPage(window.location.href, frame.contentWindow.location.href);
        if (nextUrl && nextUrl !== window.location.href) {
            window.history.replaceState(window.history.state, '', nextUrl);
        }
    } catch { /* Ignore frames outside the supported same-origin student pages. */ }
}

frame.addEventListener("load", () => {
    clearTimeout(loadTimer);
    try {
        const page = new URL(frame.contentWindow.location.href);
        if (page.href === 'about:blank') {
            loadTimer = setTimeout(showRecovery,20000);
            return;
        }
        if (page.origin !== pagesDirectory.origin || !frame.contentDocument ||
            frame.contentDocument.body?.hasAttribute('data-student-route-missing')) {
            showRecovery();
            return;
        }
        loading.hidden = true;
        frame.inert = false;
        const pageTitle = frame.contentDocument?.title;
        if (pageTitle) document.title = `${pageTitle} | LakbayPanahon`;
        syncCurrentRoute();
        frame.contentWindow.addEventListener('hashchange', syncCurrentRoute);
        frame.contentWindow.addEventListener('popstate', syncCurrentRoute);
    } catch { showRecovery(); }
});
frame.addEventListener('error', () => { clearTimeout(loadTimer); showRecovery(); });
retry.addEventListener('click', () => {
    const currentRoute = studentRouteForPage(new URLSearchParams(window.location.search).get('route') || '', pagesDirectory);
    startLoading();
    frame.src = new URL(currentRoute || routeUrl.href, pagesDirectory).href;
});
startLoading();
frame.src = routeUrl.href;
