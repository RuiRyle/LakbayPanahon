const landingHeader = document.querySelector(".landing-header");
const menuButton = document.getElementById("menuButton");
const navLinks = document.getElementById("navLinks");
const mobileLandingMenu = window.matchMedia("(max-width: 900px)");

function setLandingMenu(open, restoreFocus = false) {
    navLinks.classList.toggle("active", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (restoreFocus) menuButton.focus();
}

const landingMenuIsOpen = () => navLinks.classList.contains("active");
menuButton.addEventListener("click", () => setLandingMenu(!landingMenuIsOpen()));
navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
        if (!landingMenuIsOpen()) return;
        if (link.matches('a[href^="#"]')) {
            document.getElementById(link.hash.slice(1))?.focus({ preventScroll: true });
        }
        setLandingMenu(false);
    });
});
document.addEventListener("keydown", event => {
    if (event.key === "Escape" && landingMenuIsOpen()) setLandingMenu(false, true);
});
for (const type of ["click", "focusin"]) {
    document.addEventListener(type, event => {
        if (landingMenuIsOpen() && !landingHeader.contains(event.target)) setLandingMenu(false);
    });
}
mobileLandingMenu.addEventListener("change", event => {
    if (!event.matches) setLandingMenu(false);
});
landingHeader.dataset.menuReady = "";

const previewTabs = document.querySelector(".landing-preview-controls");
if (previewTabs) {
    const tabs = [...previewTabs.querySelectorAll('[role="tab"]')];
    const panels = tabs.map(tab => document.getElementById(tab.getAttribute("aria-controls")));
    let selectedIndex = tabs.findIndex(tab => tab.getAttribute("aria-selected") === "true");

    function selectPreview(index) {
        if (index === selectedIndex) return;
        tabs[selectedIndex].tabIndex = -1;
        tabs[selectedIndex].setAttribute("aria-selected", "false");
        panels[selectedIndex].hidden = true;
        tabs[index].tabIndex = 0;
        tabs[index].setAttribute("aria-selected", "true");
        panels[index].hidden = false;
        selectedIndex = index;
    }

    tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => selectPreview(index));
        tab.addEventListener("keydown", event => {
            let nextIndex;
            switch (event.key) {
                case "ArrowRight": nextIndex = (index + 1) % tabs.length; break;
                case "ArrowLeft": nextIndex = (index + tabs.length - 1) % tabs.length; break;
                case "Home": nextIndex = 0; break;
                case "End": nextIndex = tabs.length - 1; break;
                default: return;
            }
            event.preventDefault();
            selectPreview(nextIndex);
            tabs[nextIndex].focus();
        });
    });
    previewTabs.hidden = false;
}

const landingClueForm = document.getElementById("landingClueForm");
const landingClueFeedback = document.getElementById("landingClueFeedback");
const clueExplanations = {
    pattern: "The pattern describes how the pot looks. Try finding a clue that names the place.",
    "field-note": "That’s right. A field note records the find’s location and connects the pot to its setting.",
    color: "The photo shows the clay’s color. Look for a clue that records where the pot was found."
};

landingClueForm?.addEventListener("submit", event => {
    event.preventDefault();
    const answer = new FormData(landingClueForm).get("clue");
    landingClueFeedback.dataset.outcome = answer === "field-note" ? "correct" : "hint";
    landingClueFeedback.textContent = clueExplanations[answer];
});
landingClueForm?.addEventListener("change", () => {
    landingClueFeedback.textContent = "";
});
if (landingClueForm) landingClueForm.hidden = false;

const topicDialog = document.getElementById("landingTopicDialog");
if (typeof topicDialog?.showModal === "function") {
    const title = document.getElementById("landingTopicDialogTitle");
    const detail = document.getElementById("landingTopicDialogDetail");
    const question = document.getElementById("landingTopicDialogQuestion");
    const art = topicDialog.querySelector(".landing-topic-dialog-art");
    let activeTrigger;
    for (const trigger of document.querySelectorAll(".landing-topic-open")) {
        trigger.addEventListener("click", () => {
            const card = trigger.closest("li");
            title.textContent = card.querySelector("h3").textContent;
            detail.textContent = trigger.dataset.topicDetail;
            question.textContent = trigger.dataset.topicQuestion;
            art.src = card.querySelector("img").src;
            activeTrigger = trigger;
            topicDialog.showModal();
        });
        trigger.hidden = false;
    }
    topicDialog.addEventListener("close", () => activeTrigger?.focus({ preventScroll: true }));
}

const landingGallery = document.querySelector("[data-landing-gallery]");
if (landingGallery) {
    const picker = landingGallery.querySelector(".landing-exhibit-picker");
    const choices = picker.querySelectorAll("[data-exhibit-choice]");
    const exhibits = landingGallery.querySelectorAll("[data-landing-exhibit]");
    for (const choice of choices) {
        choice.addEventListener("click", () => {
            for (const option of choices) option.setAttribute("aria-pressed", String(option === choice));
            for (const exhibit of exhibits) exhibit.hidden = exhibit.dataset.landingExhibit !== choice.dataset.exhibitChoice;
        });
    }
    picker.hidden = false;
}

const landingSections = Array.from(navLinks.querySelectorAll('a[href^="#"]'), link => ({
    link,
    section: document.getElementById(link.hash.slice(1))
})).filter(entry => entry.section);
let activeLandingLink;
function updateLandingNavigation() {
    const readingLine = landingHeader.offsetHeight + 26;
    const inView = landingSections.find(({ section }) => {
        const { top, bottom } = section.getBoundingClientRect();
        return top <= readingLine && bottom > readingLine;
    });
    const active = inView?.link;
    landingHeader.classList.toggle("is-scrolled", window.scrollY > 20);
    if (active === activeLandingLink) return;
    activeLandingLink?.removeAttribute("aria-current");
    active?.setAttribute("aria-current", "location");
    activeLandingLink = active;
}

let landingNavigationFrame = 0;
function scheduleLandingNavigation() {
    if (landingNavigationFrame) return;
    landingNavigationFrame = requestAnimationFrame(() => {
        landingNavigationFrame = 0;
        updateLandingNavigation();
    });
}
window.addEventListener("scroll", scheduleLandingNavigation, { passive: true });
window.addEventListener("resize", scheduleLandingNavigation);
updateLandingNavigation();

// Fetch sign-in code on intent; modulepreload never executes authentication code.
let loginWarmed = false;
function warmLogin(event) {
    if (loginWarmed) return;
    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!link || !new URL(link.href).pathname.endsWith("/login.html")) return;
    loginWarmed = true;
    for (const href of [
        new URL("../js/auth-ui.js", link.href).href,
        "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js",
        "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js",
        "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js"
    ]) {
        const preload = document.createElement("link");
        preload.rel = "modulepreload";
        preload.href = href;
        preload.crossOrigin = "anonymous";
        document.head.append(preload);
    }
}
document.addEventListener("pointerover", warmLogin, { passive: true });
document.addEventListener("focusin", warmLogin);
