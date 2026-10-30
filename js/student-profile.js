import { auth, db } from "./firebase-config.js";
import { collection, getDocs, getDocsFromServer, getDocFromServer, doc, onSnapshot, updateDoc, serverTimestamp, query, where }
    from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

export let studentAvatars = [];
let catalogPromise = null;
export function normalizeAvatarCatalog(documents) {
    return documents.filter(avatar => typeof avatar.id === "string" && avatar.id && !avatar.id.includes("/") &&
        typeof avatar.name === "string" && avatar.name.trim() &&
        ["active", "inactive"].includes(avatar.status) &&
        (avatar.kind === "initials" || avatar.kind === "emoji" && typeof avatar.icon === "string" && avatar.icon.trim()))
        .map(avatar => ({...avatar, name: avatar.name.trim()}))
        .sort((a,b) => (Number(a.order) || 0) - (Number(b.order) || 0) || a.id.localeCompare(b.id));
}
export function loadAvatarCatalog(retry = false) {
    if (!catalogPromise || retry) {
        catalogPromise = getDocsFromServer(collection(db, "avatars")).then(snapshot => {
            studentAvatars = normalizeAvatarCatalog(snapshot.docs.map(item => ({...item.data(), id:item.id})));
            return studentAvatars;
        });
    }
    return catalogPromise;
}


export function profileChanges(values, currentProfile = {}) {
    const changes = {};
    for (const field of ["firstName", "middleName", "lastName"]) {
        changes[field] = String(values[field] || "").trim();
        if (changes[field].length > 100) throw new Error("Names must be 100 characters or fewer.");
    }
    if (!changes.firstName || !changes.lastName) throw new Error("Enter your first and last name.");
    const selected = values.avatarId || currentProfile.avatarId;
    if (selected && selected !== currentProfile.avatarId) {
        if (!studentAvatars.some(avatar => avatar.id === selected && avatar.status === "active")) throw new Error("Choose an available avatar from the list.");
        changes.avatarId = selected;
    }
    return changes;
}

let latestIdentity = null;
let profileXpPerLevel = null;

function renderProfileLearningStats(profile) {
    if (!document.getElementById("profileLearningStats")) return;
    const xp = Number.isSafeInteger(profile.xp) && profile.xp >= 0 ? profile.xp : 0;
    const derivedLevel = profileXpPerLevel ? Math.floor(xp / profileXpPerLevel) + 1 : 1;
    const level = Number.isSafeInteger(profile.level) && profile.level > 0 ? profile.level : derivedLevel;
    const streak = Number.isSafeInteger(profile.learningStreak) && profile.learningStreak > 0 ? profile.learningStreak : 0;
    const xpValue = document.getElementById("profilePageXp");
    const levelValue = document.getElementById("profilePageLevel");
    const streakValue = document.getElementById("profilePageStreak");
    const label = document.getElementById("profileLevelProgressLabel");
    const fill = document.getElementById("profileLevelProgressFill");
    const track = fill?.parentElement;
    if (xpValue) xpValue.textContent = xp.toLocaleString();
    if (levelValue) levelValue.textContent = String(level);
    if (streakValue) streakValue.textContent = String(streak);
    if (profileXpPerLevel && label && fill && track) {
        const insideLevel = xp % profileXpPerLevel;
        const percent = Math.round(insideLevel / profileXpPerLevel * 100);
        label.textContent = `${insideLevel.toLocaleString()} / ${profileXpPerLevel.toLocaleString()} XP toward the next level`;
        fill.style.width = `${percent}%`;
        track.setAttribute("aria-valuenow", String(percent));
    } else if (label) {
        label.textContent = "Your experience is building with every completed mission.";
    }
}

async function loadProfileLearningStats(uid) {
    const status = document.getElementById("profileStatsStatus");
    if (!document.getElementById("profileLearningStats")) return;
    const [progressResult, policyResult] = await Promise.allSettled([
        getDocs(query(collection(db, "studentProgress"), where("userId", "==", uid))),
        getDocFromServer(doc(db, "learningSettings", "progression"))
    ]);
    if (auth.currentUser?.uid !== uid) return;
    if (policyResult.status === "fulfilled" && policyResult.value.exists()) {
        const perLevel = policyResult.value.data().xpPerLevel;
        profileXpPerLevel = Number.isSafeInteger(perLevel) && perLevel > 0 ? perLevel : null;
    }
    if (progressResult.status === "fulfilled") {
        const count = progressResult.value.docs.filter(item => item.data().completed === true).length;
        const missions = document.getElementById("profilePageMissions");
        if (missions) missions.textContent = count.toLocaleString();
    }
    if (latestIdentity) renderProfileLearningStats(latestIdentity);
    if (status) status.textContent = progressResult.status === "fulfilled"
        ? "Your learning snapshot is up to date."
        : "Your profile is available, but mission progress could not load right now.";
}

function applyStudentIdentity(profile) {
    const firstName = String(profile.firstName || profile.name || "Student");
    const avatar = studentAvatars.find(item => item.id === profile.avatarId);
    const createdAt = profile.createdAt?.toDate?.();
    const memberSince = createdAt && Number.isFinite(createdAt.getTime())
        ? createdAt.toLocaleDateString("en-PH", {month:"long", year:"numeric"}) : "Not available";
    const pageFields={profilePageName:[profile.firstName||profile.name,profile.middleName,profile.lastName].filter(Boolean).join(' ')||'Student',profilePageFirstName:profile.firstName||'Not provided',profilePageMiddleName:profile.middleName||'Not provided',profilePageLastName:profile.lastName||'Not provided',profilePageEmail:profile.email||'Not available',profilePageMemberSince:memberSince};
    for(const [id,value] of Object.entries(pageFields)){const element=document.getElementById(id);if(element)element.textContent=value||'Not provided';}
    renderProfileLearningStats(profile);
    for (const id of ["topStudentName", "studentFirstName"]) {
        const element = document.getElementById(id);
        if (element) element.textContent = firstName;
    }
    const xp = Number(profile.xp);
    const topXp = document.getElementById("topXp");
    if (topXp && Number.isSafeInteger(xp) && xp >= 0) {
        topXp.textContent = `${xp.toLocaleString()} XP`;
    }
    const level = Number(profile.level);
    const topLevel = document.getElementById("topStudentLevel");
    if (topLevel && Number.isSafeInteger(level) && level > 0) {
        topLevel.textContent = `Level ${level}`;
    }
    document.querySelectorAll("#profileAvatar, [data-student-avatar]:not(.student-profile-preview)").forEach(element => {
        element.textContent = avatar?.kind === "emoji" ? avatar.icon : Array.from(firstName)[0].toUpperCase();
    });
}

export async function renderStudentIdentity(profile) {
    latestIdentity = profile;
    const uid = auth.currentUser?.uid;
    applyStudentIdentity(profile);
    try {
        await loadAvatarCatalog();
        if (auth.currentUser?.uid === uid) applyStudentIdentity(latestIdentity);
    } catch (error) { console.warn("Avatar catalog unavailable:", error.message); }
}

export function needsProfileSetup(profile) {
    return !profile.profileSetupCompletedAt && !profile.profileSetupDismissedAt;
}

const studentPageTitles = {
    "student-dashboard.html": "Student Dashboard",
    "my-journey.html": "My Journey",
    "chapters.html": "Explore Chapters",
    "era.html": "Era Overview",
    "mission.html": "Mission",
    "story.html": "Story Mission",
    "quiz.html": "Mission Trial",
    "practice.html": "Adaptive Practice",
    "chapter-challenge.html": "Chapter Challenge",
    "my-class.html": "My Class",
    "achievements.html": "Achievements",
    "my-profile.html": "My Profile",
    "bayani-ai.html": "Bayani AI",
    "settings.html": "Settings"
};

const studentNavigationTargets = {
    "student-dashboard.html": "student-dashboard.html",
    "my-journey.html": "my-journey.html",
    "chapters.html": "chapters.html",
    "era.html": "chapters.html",
    "mission.html": "chapters.html",
    "story.html": "chapters.html",
    "quiz.html": "chapters.html",
    "practice.html": "my-journey.html",
    "chapter-challenge.html": "chapters.html",
    "my-class.html": "my-class.html",
    "achievements.html": "achievements.html",
    "my-profile.html": "my-profile.html",
    "bayani-ai.html": "bayani-ai.html",
    "settings.html": "settings.html"
};

const studentNavigationIcons = {
    "student-dashboard.html": '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1Z"/>',
    "my-journey.html": '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5Z"/><path d="M4 5.5v13A2.5 2.5 0 0 1 6.5 16H20M8 7h8M8 10h6"/>',
    "chapters.html": '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9Z"/>',
    "my-class.html": '<path d="M3 20h18M5 20V8l7-4 7 4v12M9 20v-6h6v6M8 10h.01M12 10h.01M16 10h.01"/>',
    "bayani-ai.html": '<path d="M12 3 9.5 10.5 4 13l5.5 2.5L12 21l2.5-5.5L20 13l-5.5-2.5Z"/><path d="m19 3 .8 2.2L22 6l-2.2.8L19 9l-.8-2.2L16 6l2.2-.8Z"/>',
    "achievements.html": '<path d="M8 4h8v5a4 4 0 0 1-8 0ZM12 13v5m-4 3h8m-4-3a4 4 0 0 0 4 3M8 6H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4"/>',
    "my-profile.html": '<circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
    "settings.html": '<path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/><path d="m19.4 13.5 1.1.8-1.1 1.9-1.3-.5a7.8 7.8 0 0 1-1.5.9l-.2 1.4h-2.2l-.3-1.4a7.8 7.8 0 0 1-1.7 0l-.8 1.2-1.9-1.1.5-1.3a7.8 7.8 0 0 1-.9-1.5l-1.4-.2v-2.2l1.4-.3a7.8 7.8 0 0 1 0-1.7L7.9 8.7 9 6.8l1.3.5a7.8 7.8 0 0 1 1.5-.9l.2-1.4h2.2l.3 1.4a7.8 7.8 0 0 1 1.7 0l.8-1.2 1.9 1.1-.5 1.3a7.8 7.8 0 0 1 .9 1.5l1.4.2v2.2l-1.4.3a7.8 7.8 0 0 1 0 1.7Z"/>',
    logout: '<path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/>'
};

function renderStudentNavIcon(element, path) {
    if (!element || !path) return;
    element.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
    element.setAttribute("aria-hidden", "true");
}

function makeStudentXpPill() {
    const pill = document.createElement("div");
    pill.className = "xp-pill student-xp-pill";
    pill.setAttribute("role", "group");
    pill.setAttribute("aria-label", "Total experience points");

    const icon = document.createElement("span");
    icon.className = "student-xp-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = '<svg viewBox="0 0 24 24"><path d="m12 2.8 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3L2.9 9.4l6.3-.9L12 2.8Z"/></svg>';

    const copy = document.createElement("span");
    copy.className = "student-xp-copy";
    const label = document.createElement("small");
    label.textContent = "TOTAL EXPERIENCE";
    const value = document.createElement("strong");
    value.id = "topXp";
    value.textContent = "0 XP";
    copy.append(label, value);
    pill.append(icon, copy);
    return pill;
}

function makeStudentProfileButton() {
    const button = document.createElement("button");
    button.type = "button";
    button.id = "profileButton";
    button.className = "profile-button student-topbar-profile";

    const avatar = document.createElement("span");
    avatar.className = "profile-avatar";
    avatar.id = "profileAvatar";
    avatar.textContent = "S";

    const info = document.createElement("span");
    info.className = "profile-info";
    info.innerHTML = '<strong id="topStudentName">Student</strong><span id="topStudentLevel">Level 1</span>';

    const indicator = document.createElement("span");
    indicator.className = "student-profile-indicator";
    indicator.setAttribute("aria-hidden", "true");
    indicator.textContent = "⌄";
    button.append(avatar, info, indicator);
    return button;
}

function normalizeStudentTopbar(profile) {
    const topbar = document.querySelector(".topbar");
    if (!topbar) return;

    const page = window.location.pathname.split("/").pop();
    const pageTitle = studentPageTitles[page];
    const title = topbar.querySelector(".topbar-title");
    if (title && pageTitle) {
        const icon = document.createElement("span");
        icon.className = "student-page-title-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 5.5v16M8 7h8M8 11h7"/></svg>';
        const titleCopy = document.createElement("span");
        titleCopy.className = "student-page-title-copy";
        const kicker = document.createElement("small");
        kicker.textContent = "LEARNING SPACE";
        const heading = document.createElement("strong");
        heading.textContent = pageTitle;
        titleCopy.append(kicker, heading);
        title.replaceChildren(icon, titleCopy);
        title.classList.add("student-page-title");
    }

    let actions = topbar.querySelector(".topbar-actions");
    if (!actions) {
        actions = document.createElement("div");
        actions.className = "topbar-actions";
        topbar.append(actions);
    }
    const homeAction = Array.from(topbar.children).find(element =>
        element.matches('a.text-button[href="student-dashboard.html"]')
    );
    if (homeAction) actions.prepend(homeAction);

    let xpPill = actions.querySelector(".xp-pill");
    if (!xpPill) {
        xpPill = makeStudentXpPill();
        actions.prepend(xpPill);
    } else {
        const replacement = makeStudentXpPill();
        xpPill.replaceWith(replacement);
        xpPill = replacement;
    }
    xpPill.classList.add("student-xp-pill");
    xpPill.setAttribute("role", "group");
    xpPill.setAttribute("aria-label", "Total experience points");
    if (homeAction) xpPill.before(homeAction);

    const xpValue = xpPill.querySelector("#topXp");
    const xp = Number(profile?.xp);
    if (xpValue && Number.isSafeInteger(xp) && xp >= 0) {
        xpValue.textContent = `${xp.toLocaleString()} XP`;
    }

    let profileButton = topbar.querySelector("#profileButton");
    if (!profileButton) {
        profileButton = makeStudentProfileButton();
        actions.append(profileButton);
    } else if (!actions.contains(profileButton)) {
        actions.append(profileButton);
    }
    profileButton.classList.add("student-topbar-profile");
    profileButton.setAttribute("aria-haspopup", "dialog");
    profileButton.setAttribute("aria-label", "Edit my profile and avatar");

    let avatar = profileButton.querySelector("#profileAvatar");
    if (!avatar) {
        avatar = document.createElement("span");
        avatar.className = "profile-avatar";
        avatar.id = "profileAvatar";
        avatar.textContent = "S";
        profileButton.prepend(avatar);
    }
    let info = profileButton.querySelector(".profile-info");
    if (!info) {
        info = document.createElement("span");
        info.className = "profile-info";
        profileButton.append(info);
    }
    if (!info.querySelector("#topStudentName")) {
        const name = info.querySelector("strong") || document.createElement("strong");
        name.id = "topStudentName";
        if (!name.textContent.trim()) name.textContent = "Student";
        info.prepend(name);
    }
    if (!info.querySelector("#topStudentLevel")) {
        const level = info.querySelector("span") || document.createElement("span");
        level.id = "topStudentLevel";
        if (!level.textContent.trim()) level.textContent = "Level 1";
        info.append(level);
    }
    if (!profileButton.querySelector(".student-profile-indicator")) {
        const indicator = document.createElement("span");
        indicator.className = "student-profile-indicator";
        indicator.setAttribute("aria-hidden", "true");
        indicator.textContent = "⌄";
        profileButton.append(indicator);
    }
}

function normalizeStudentNavigation() {
    const sidebar = document.querySelector(".sidebar-nav");
    if (!sidebar) return;
    sidebar.setAttribute("aria-label", "Student navigation");

    let profileEntry = sidebar.querySelector(".student-profile-nav");
    if (!profileEntry) {
        profileEntry = document.createElement("a");
        profileEntry.href = "my-profile.html";
        profileEntry.className = "nav-link student-profile-nav";
        const icon = document.createElement("span");
        icon.className = "nav-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg>';
        const label = document.createElement("span");
        label.textContent = "My Profile";
        profileEntry.append(icon, label);
    }

    const achievements = sidebar.querySelector('a[href="achievements.html"]');
    const settings = sidebar.querySelector('a[href="settings.html"]');
    if (achievements) achievements.after(profileEntry);
    else if (settings) sidebar.insertBefore(profileEntry, settings);
    else sidebar.append(profileEntry);

    const currentPage = window.location.pathname.split("/").pop();
    const activeTarget = studentNavigationTargets[currentPage];
    for (const link of sidebar.querySelectorAll("a.nav-link[href]")) {
        const target = new URL(link.href, window.location.href).pathname.split("/").pop();
        const isCurrent = target === activeTarget;
        renderStudentNavIcon(link.querySelector(".nav-icon"), studentNavigationIcons[target]);
        link.classList.toggle("active", isCurrent);
        if (isCurrent) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
    }
    renderStudentNavIcon(sidebar.querySelector(".logout-button .nav-icon"), studentNavigationIcons.logout);

}

let mounted = false;
export function mountStudentProfile(initialProfile) {
    if (mounted || document.body.dataset.role !== "student" || !auth.currentUser) return;
    mounted = true;
    const uid = auth.currentUser.uid;
    let profile = initialProfile;
    normalizeStudentTopbar(profile);
    normalizeStudentNavigation();
    if (document.getElementById("profileLearningStats")) loadProfileLearningStats(uid);
    let saving = false;
    let dismissing = false;
    const setupPrompt = document.getElementById("studentProfileSetup");
    const setupStatus = document.getElementById("studentSetupStatus");
    const dismissSetup = document.getElementById("dismissStudentSetup");
    function refreshSetupPrompt() {
        if (setupPrompt) setupPrompt.hidden = !needsProfileSetup(profile);
    }
    refreshSetupPrompt();
    const dialog = document.createElement("dialog");
    dialog.className = "student-profile-dialog";
    dialog.setAttribute("aria-labelledby", "studentProfileTitle");
    dialog.innerHTML = `
        <form id="studentProfileForm">
            <div class="student-profile-heading">
                <div><p class="eyebrow">YOUR LEARNING JOURNEY</p><h2 id="studentProfileTitle">My Profile</h2></div>
                <button type="button" class="student-profile-close" aria-label="Close profile">&times;</button>
            </div>
            <div class="student-profile-preview" data-student-avatar aria-hidden="true"></div>
            <p class="student-profile-intro">Choose your explorer and tell us what to call you.</p>
            <fieldset class="student-profile-fields">
                <legend class="student-profile-sr-only">Profile details</legend>
                <label>First name<input name="firstName" autocomplete="given-name" maxlength="100" required autofocus></label>
                <label><span>Middle name <small>(optional)</small></span><input name="middleName" autocomplete="additional-name" maxlength="100"></label>
                <label>Last name<input name="lastName" autocomplete="family-name" maxlength="100" required></label>
                <label>Email<input name="email" type="email" readonly aria-describedby="profileEmailNote"></label>
                <p id="profileEmailNote">Your sign-in email stays the same.</p>
            </fieldset>
            <fieldset class="student-avatar-picker"><legend>Choose your avatar</legend><div class="student-avatar-grid"></div><p id="avatarCatalogStatus" aria-live="polite"></p><button type="button" id="retryAvatarCatalog" hidden>Retry Loading Avatars</button></fieldset>
            <p id="studentProfileStatus" class="student-profile-status" role="status" aria-live="polite"></p>
            <div class="student-profile-actions">
                <button type="button" class="student-profile-cancel">Cancel</button>
                <button type="submit" class="begin-mission-button">Save Profile</button>
            </div>
        </form>`;
    document.body.append(dialog);
    const savedDialog = document.createElement("dialog");
    savedDialog.className = "student-profile-saved-dialog";
    savedDialog.setAttribute("aria-labelledby", "studentProfileSavedTitle");
    savedDialog.innerHTML = `
        <div class="student-profile-saved-content" role="status" aria-live="polite">
            <span class="student-profile-saved-icon" aria-hidden="true">&#10003;</span>
            <p class="eyebrow">PROFILE UPDATED</p>
            <h2 id="studentProfileSavedTitle">Changes saved</h2>
            <p>Your profile and avatar are up to date. You are ready to continue your learning journey.</p>
            <button type="button" class="begin-mission-button">Continue</button>
        </div>`;
    document.body.append(savedDialog);
    const savedDone = savedDialog.querySelector("button");
    const form = dialog.querySelector("form");
    const status = dialog.querySelector("#studentProfileStatus");
    const grid = dialog.querySelector(".student-avatar-grid");
    const preview = dialog.querySelector(".student-profile-preview");
    const catalogStatus = dialog.querySelector("#avatarCatalogStatus");
    const retryCatalog = dialog.querySelector("#retryAvatarCatalog");
    let catalogReady = false;
    function selectedAvatarId() {
        return form.querySelector('input[name="avatarId"]:checked')?.value || profile.avatarId || "";
    }
    function refreshAvatarChoices() {
        const selection = selectedAvatarId();
        const active = studentAvatars.filter(avatar => avatar.status === "active");
        const current = studentAvatars.find(avatar => avatar.id === profile.avatarId);
        const choices = [...active];
        if (profile.avatarId && !active.some(avatar => avatar.id === profile.avatarId)) {
            choices.push(current || {id:profile.avatarId, name:"Current avatar", kind:"initials"});
        }
        grid.replaceChildren();
        const defaultAvatar = active.find(avatar => avatar.isDefault === true);
        const selected = selection ? choices.some(avatar => avatar.id === selection) ? selection : profile.avatarId : defaultAvatar?.id;
        for (const avatar of choices) {
            const label = document.createElement("label");
            label.className = "student-avatar-choice";
            const radio = document.createElement("input");
            radio.type = "radio"; radio.name = "avatarId"; radio.value = avatar.id;
            radio.checked = avatar.id === selected;
            const icon = document.createElement("span");
            icon.className = "student-avatar-symbol"; icon.setAttribute("aria-hidden", "true");
            icon.textContent = avatar.kind === "emoji" ? avatar.icon : Array.from(profile.firstName || "Student")[0].toUpperCase();
            const name = document.createElement("span"); name.textContent = avatar.name;
            label.append(radio,icon,name); grid.append(label);
        }
        updatePreview();
    }
    async function refreshCatalog(retry = false) {
        catalogStatus.textContent = "Loading avatars...";
        retryCatalog.hidden = true;
        try {
            await loadAvatarCatalog(retry);
            if (auth.currentUser?.uid !== uid) return;
            catalogReady = true;
            refreshAvatarChoices();
            await renderStudentIdentity(profile);
            if (dialog.open) updatePreview();
            catalogStatus.textContent = studentAvatars.some(avatar => avatar.status === "active")
                ? "" : "No avatars are available. You can still update your name.";
        } catch (error) {
            catalogStatus.textContent = "Avatars could not load. You can still update your name.";
            retryCatalog.hidden = false;
        }
    }
    retryCatalog.addEventListener("click", () => refreshCatalog(true));
    refreshCatalog();
    function updatePreview() {
        const avatar = studentAvatars.find(item => item.id === selectedAvatarId());
        preview.textContent = avatar?.kind === "emoji" ? avatar.icon : Array.from(form.elements.firstName.value.trim() || "Student")[0].toUpperCase();
    }
    let profileOpener = null;
    let confirmingSave = false;
    function restoreProfileFocus() {
        if (!dialog.open && auth.currentUser?.uid === uid && profileOpener?.isConnected) profileOpener.focus({preventScroll:true});
    }
    dialog.addEventListener('close', () => { if (!confirmingSave) restoreProfileFocus(); });
    savedDone.addEventListener("click", () => savedDialog.close());
    savedDialog.addEventListener("close", () => {
        confirmingSave = false;
        restoreProfileFocus();
    });
    function openProfile(event) {
        if (dialog.open) return;
        profileOpener = event?.currentTarget || document.activeElement;
        if (saving) { dialog.showModal(); return; }
        for (const name of ["firstName", "middleName", "lastName", "email"]) form.elements[name].value = profile[name] || "";
        if (catalogReady) {
            grid.querySelectorAll("input").forEach(input => { input.checked = false; });
            refreshAvatarChoices();
        }
        status.textContent = "";
        updatePreview();
        dialog.showModal();
    }
    document.getElementById("openStudentSetup")?.addEventListener("click", openProfile);
    document.querySelectorAll("[data-edit-profile]").forEach(button => button.addEventListener("click", openProfile));
    dismissSetup?.addEventListener("click", async () => {
        if (dismissing || !needsProfileSetup(profile)) return;
        if (auth.currentUser?.uid !== uid) { setupStatus.textContent = "Sign in again to save this choice."; return; }
        dismissing = true; dismissSetup.disabled = true;
        setupStatus.textContent = "Saving your choice...";
        try {
            const timestamp = serverTimestamp();
            await updateDoc(doc(db,"users",uid), {profileSetupDismissedAt:timestamp,updatedAt:timestamp});
            profile = {...profile,profileSetupDismissedAt:timestamp};
            refreshSetupPrompt();
        } catch (error) {
            setupStatus.textContent = "We could not save this choice. Try again, or keep learning below.";
        } finally { dismissing = false; dismissSetup.disabled = false; }
    });
    form.addEventListener("input", updatePreview);
    dialog.querySelectorAll(".student-profile-close, .student-profile-cancel").forEach(button => {
        button.addEventListener("click", () => { dialog.close(); restoreProfileFocus(); });
    });
    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (saving || !form.reportValidity()) return;
        if (auth.currentUser?.uid !== uid) { status.textContent = "Please sign in again before saving."; return; }
        let changes;
        try {
            changes = profileChanges(Object.fromEntries(new FormData(form)), profile);
        } catch (error) { status.textContent = error.message; return; }
        saving = true;
        form.setAttribute('aria-busy','true');
        dialog.querySelectorAll("fieldset, button[type=submit]").forEach(element => { element.disabled = true; });
        status.textContent = "Saving your profile...";
        try {
            const timestamp = serverTimestamp();
            const setup = profile.profileSetupCompletedAt ? {} : {profileSetupCompletedAt:timestamp};
            await updateDoc(doc(db, "users", uid), { ...changes, ...setup, updatedAt: timestamp });
            if (auth.currentUser?.uid !== uid) return;
            profile = { ...profile, ...changes, ...setup };
            refreshSetupPrompt();
            renderStudentIdentity(profile);
            status.textContent = "";
            confirmingSave = true;
            dialog.close();
            savedDialog.showModal();
            savedDone.focus({ preventScroll: true });
        } catch (error) {
            if (auth.currentUser?.uid !== uid) return;
            console.error("Unable to save student profile:", error);
            status.textContent = error.code === "permission-denied"
                ? "Your profile could not be saved. Please ask for help and try again."
                : "We could not confirm that your changes were saved. Your edits are still here. Check your connection and try saving again.";
        } finally {
            saving = false;
            form.setAttribute('aria-busy','false');
            dialog.querySelectorAll("fieldset, button[type=submit]").forEach(element => { element.disabled = false; });
        }
    });
    let profileButton = document.getElementById("profileButton");
    if (!profileButton) {
        profileButton = document.createElement("button");
        profileButton.type = "button";
        profileButton.id = "profileButton";
        profileButton.className = "profile-button student-profile-entry";
        const avatar = document.createElement("span");
        avatar.className = "profile-avatar";
        avatar.dataset.studentAvatar = "";
        const text = document.createElement("span");
        text.textContent = "My Profile";
        profileButton.append(avatar, text);
        const container = document.querySelector(".topbar-actions, .topbar, .chapter-challenge-page");
        if (container) container.append(profileButton);
    }
    profileButton.setAttribute("aria-haspopup", "dialog");
    profileButton.setAttribute("aria-label", "Edit my profile and avatar");
    profileButton.addEventListener("click", openProfile);
    document.getElementById("editProfileButton")?.addEventListener("click",openProfile);
    renderStudentIdentity(profile);
    const stop = onSnapshot(doc(db, "users", uid), snapshot => {
        if (!snapshot.exists() || auth.currentUser?.uid !== uid) return;
        profile = snapshot.data();
        refreshSetupPrompt();
        // Keep an open form's draft intact while refreshing saved identity.
        renderStudentIdentity(profile);
        if (dialog.open) updatePreview();
    }, error => { console.warn("Student profile refresh unavailable:", error); });
    window.addEventListener("pagehide", event => { if (!event.persisted) stop(); });
}
