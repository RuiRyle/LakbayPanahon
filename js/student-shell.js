import "./student-audio-host.js";
import {studentRouteForPage, shellUrlForPage} from './student-shell-route.js';

const frame = document.getElementById("studentRouteFrame");
const loading = document.getElementById("shellLoading");
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
    loading.hidden = true;
    try {
        const pageTitle = frame.contentDocument?.title;
        if (pageTitle) document.title = `${pageTitle} | LakbayPanahon`;
        syncCurrentRoute();
        frame.contentWindow.addEventListener('hashchange', syncCurrentRoute);
        frame.contentWindow.addEventListener('popstate', syncCurrentRoute);
    } catch {}
});
frame.src = routeUrl.href;
