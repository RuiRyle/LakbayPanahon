const menuButton = document.getElementById("menuButton");
const navLinks = document.getElementById("navLinks");

function setLandingMenu(open, restoreFocus = false) {
    if (!navLinks || !menuButton) return;
    navLinks.classList.toggle("active", open);
    menuButton.textContent = open ? "✕" : "☰";
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (restoreFocus) menuButton.focus();
}
menuButton?.addEventListener("click", () => setLandingMenu(!navLinks.classList.contains("active")));
navLinks?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => setLandingMenu(false)));
document.addEventListener("keydown", event => {
    if (event.key === "Escape" && navLinks?.classList.contains("active")) setLandingMenu(false, true);
});
document.addEventListener("click", event => {
    if (event.target instanceof Node && !navLinks?.contains(event.target) && !menuButton?.contains(event.target)) setLandingMenu(false);
});
window.matchMedia("(min-width: 951px)").addEventListener("change", event => {
    if (event.matches) setLandingMenu(false);
});

const journeyPreviews = {
    explore: ["Every island holds a story.", "Explore lessons and uncover the people, places, and ideas that shaped our nation."],
    experience: ["Step into the story.", "Follow story missions, look closely at historical clues, and put your knowledge into practice."],
    progress: ["Let every discovery count.", "Complete activities, earn XP, and collect artifacts as your understanding of history grows."]
};
const previewTitle = document.querySelector("[data-journey-title]");
const previewDescription = document.querySelector("[data-journey-description]");
const previewContent = document.querySelector(".illustration-content");
if (previewContent) {
    previewContent.setAttribute("aria-live", "polite");
    previewContent.setAttribute("aria-atomic", "true");
}
document.querySelectorAll("[data-journey-preview]").forEach(button => {
    button.addEventListener("click", () => {
        const key = button.dataset.journeyPreview;
        const preview = journeyPreviews[key];
        if (!preview || !previewTitle || !previewDescription) return;
        previewTitle.textContent = preview[0];
        previewDescription.textContent = preview[1];
        document.querySelectorAll("[data-journey-preview]").forEach(control => control.setAttribute("aria-pressed", String(control === button)));
        document.querySelector(".journey-map")?.setAttribute("data-stage", key);
    });
});

const landingHeader = document.querySelector(".landing-page .header");
function updateLandingHeader() { landingHeader?.classList.toggle("is-scrolled", window.scrollY > 20); }
window.addEventListener("scroll", updateLandingHeader, { passive: true });
updateLandingHeader();

if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
        });
    }, { threshold: .08 });
    document.querySelectorAll(".section-heading, .feature-card, .step, .about-badge, .about-content, .cta-content").forEach((element, index) => {
        element.dataset.reveal = "";
        element.style.setProperty("--reveal-delay", `${element.matches(".feature-card, .step") ? index % 3 * 65 : 0}ms`);
        revealObserver.observe(element);
    });
    const sectionObserver = new IntersectionObserver(entries => {
        const current = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!current) return;
        navLinks?.querySelectorAll('a[href^="#"]').forEach(link => {
            if (link.getAttribute("href") === `#${current.target.id}`) link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
        });
    }, { rootMargin: "-15% 0px -45% 0px", threshold: [0, .2, .5] });
    document.querySelectorAll("main > section[id]").forEach(section => sectionObserver.observe(section));
}
