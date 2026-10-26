import { auth, db } from "./firebase-config.js";
import { doc, onSnapshot, updateDoc, serverTimestamp }
    from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

export const studentAvatars = [
    { id: "initials", name: "My initial", icon: null },
    { id: "compass", name: "Explorer", icon: "\u{1F9ED}" },
    { id: "book", name: "Bookworm", icon: "\u{1F4DA}" },
    { id: "sun", name: "Sunshine", icon: "\u{1F31E}" },
    { id: "star", name: "Star", icon: "\u2B50" },
    { id: "turtle", name: "Turtle", icon: "\u{1F422}" },
    { id: "eagle", name: "Eagle", icon: "\u{1F985}" },
    { id: "cat", name: "Cat", icon: "\u{1F431}" },
    { id: "rocket", name: "Rocket", icon: "\u{1F680}" }
];

export function profileChanges(values) {
    const changes = {};
    for (const field of ["firstName", "middleName", "lastName"]) {
        changes[field] = String(values[field] || "").trim();
        if (changes[field].length > 100) throw new Error("Names must be 100 characters or fewer.");
    }
    if (!changes.firstName || !changes.lastName) throw new Error("Enter your first and last name.");
    if (!studentAvatars.some(avatar => avatar.id === values.avatarId)) throw new Error("Choose an avatar from the list.");
    changes.avatarId = values.avatarId;
    return changes;
}

export function renderStudentIdentity(profile) {
    const firstName = String(profile.firstName || profile.name || "Student");
    const avatar = studentAvatars.find(item => item.id === profile.avatarId);
    for (const id of ["topStudentName", "studentFirstName"]) {
        const element = document.getElementById(id);
        if (element) element.textContent = firstName;
    }
    document.querySelectorAll("#profileAvatar, [data-student-avatar]").forEach(element => {
        element.textContent = avatar?.icon || Array.from(firstName)[0].toUpperCase();
    });
}

let mounted = false;
export function mountStudentProfile(initialProfile) {
    if (mounted || document.body.dataset.role !== "student" || !auth.currentUser) return;
    mounted = true;
    const uid = auth.currentUser.uid;
    let profile = initialProfile;
    let saving = false;
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
            <fieldset class="student-avatar-picker"><legend>Choose your avatar</legend><div class="student-avatar-grid"></div></fieldset>
            <p id="studentProfileStatus" class="student-profile-status" role="status" aria-live="polite"></p>
            <div class="student-profile-actions">
                <button type="button" class="student-profile-cancel">Cancel</button>
                <button type="submit" class="begin-mission-button">Save Profile</button>
            </div>
        </form>`;
    document.body.append(dialog);
    const form = dialog.querySelector("form");
    const status = dialog.querySelector("#studentProfileStatus");
    const grid = dialog.querySelector(".student-avatar-grid");
    const preview = dialog.querySelector(".student-profile-preview");
    for (const avatar of studentAvatars) {
        const label = document.createElement("label");
        label.className = "student-avatar-choice";
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "avatarId";
        radio.value = avatar.id;
        radio.required = true;
        const icon = document.createElement("span");
        icon.className = "student-avatar-symbol";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = avatar.icon || "A";
        const name = document.createElement("span");
        name.textContent = avatar.name;
        label.append(radio, icon, name);
        grid.append(label);
    }
    function updatePreview() {
        const avatar = studentAvatars.find(item => item.id === form.elements.avatarId.value);
        preview.textContent = avatar?.icon || Array.from(form.elements.firstName.value.trim() || "Student")[0].toUpperCase();
    }
    function openProfile() {
        if (dialog.open) return;
        if (saving) { dialog.showModal(); return; }
        for (const name of ["firstName", "middleName", "lastName", "email"]) form.elements[name].value = profile[name] || "";
        form.elements.avatarId.value = studentAvatars.some(item => item.id === profile.avatarId) ? profile.avatarId : "initials";
        status.textContent = "";
        updatePreview();
        dialog.showModal();
    }
    form.addEventListener("input", updatePreview);
    dialog.querySelectorAll(".student-profile-close, .student-profile-cancel").forEach(button => {
        button.addEventListener("click", () => dialog.close());
    });
    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (saving || !form.reportValidity()) return;
        if (auth.currentUser?.uid !== uid) { status.textContent = "Please sign in again before saving."; return; }
        let changes;
        try {
            changes = profileChanges(Object.fromEntries(new FormData(form)));
        } catch (error) { status.textContent = error.message; return; }
        saving = true;
        dialog.querySelectorAll("fieldset, button[type=submit]").forEach(element => { element.disabled = true; });
        status.textContent = "Saving your profile...";
        try {
            await updateDoc(doc(db, "users", uid), { ...changes, updatedAt: serverTimestamp() });
            profile = { ...profile, ...changes };
            renderStudentIdentity(profile);
            status.textContent = "Profile saved! You can continue your journey.";
        } catch (error) {
            console.error("Unable to save student profile:", error);
            status.textContent = error.code === "permission-denied"
                ? "Your profile could not be saved. Please ask for help and try again."
                : "We could not save your changes. Check your connection and try again.";
        } finally {
            saving = false;
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
    const sidebar = document.querySelector(".sidebar-nav");
    if (sidebar) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "nav-link student-profile-nav";
        button.textContent = "My Profile";
        button.addEventListener("click", openProfile);
        sidebar.append(button);
    }
    renderStudentIdentity(profile);
    const stop = onSnapshot(doc(db, "users", uid), snapshot => {
        if (!snapshot.exists() || auth.currentUser?.uid !== uid) return;
        profile = snapshot.data();
        // Keep an open form's draft intact while refreshing saved identity.
        renderStudentIdentity(profile);
        if (dialog.open) updatePreview();
    }, error => { console.warn("Student profile refresh unavailable:", error); });
    window.addEventListener("pagehide", event => { if (!event.persisted) stop(); });
}
