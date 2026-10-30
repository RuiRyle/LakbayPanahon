export function mountLearningNavigation(container, activity, search = window.location.search) {
    if (!container) return;
    const chapter = new URLSearchParams(search).get("chapter");
    const nav = document.createElement("nav");
    nav.className = "learning-navigation";
    nav.setAttribute("aria-label", "Learning path");
    const list = document.createElement("ol");
    const add = (label, href) => {
        const item = document.createElement("li");
        const element = document.createElement(href ? "a" : "span");
        element.textContent = label;
        if (href) element.href = href;
        else element.setAttribute("aria-current", "page");
        item.append(element);list.append(item);
    };
    add("Chapters", "chapters.html");
    if (chapter) add("Mission Journey", "mission.html?" + new URLSearchParams({chapter}));
    add(activity);
    nav.append(list);
    container.prepend(nav);
}
