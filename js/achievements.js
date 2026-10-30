import {studentLoadMessage} from './student-status.js';
﻿import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { collection, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

let visibleCollection = null;
const collectionToggles = [
    {id:"badges", button:document.getElementById("toggleBadges"), panel:document.getElementById("badges")},
    {id:"artifacts", button:document.getElementById("toggleArtifacts"), panel:document.getElementById("artifacts")}
];
let collectionMotionGeneration = 0;
const collectionAnimations = new Set();
function animateCollection(element, frames, options) {
    const animation = element.animate(frames, options);
    collectionAnimations.add(animation);
    animation.finished.catch(() => {}).finally(() => collectionAnimations.delete(animation));
    return animation;
}
async function showCollection(id, withMotion = true) {
    visibleCollection = id;
    const generation = ++collectionMotionGeneration;
    for (const animation of collectionAnimations) animation.cancel();
    collectionAnimations.clear();
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const animate = withMotion && !reduced && typeof document.documentElement.animate === "function";
    for (const view of collectionToggles) view.button.setAttribute("aria-expanded", String(view.id === id));
    const outgoing = collectionToggles.find(view => !view.panel.hidden && view.id !== id);
    if (outgoing && animate) {
        const panel = outgoing.panel, style = getComputedStyle(panel);
        panel.inert = true;
        const exit = animateCollection(panel, [
            {height:panel.getBoundingClientRect().height+"px", opacity:1, transform:"translateY(0)", paddingTop:style.paddingTop, paddingBottom:style.paddingBottom, marginBottom:style.marginBottom},
            {height:"0px", opacity:0, transform:"translateY(-6px)", paddingTop:"0px", paddingBottom:"0px", marginBottom:"0px"}
        ], {duration:170, easing:"cubic-bezier(.4,0,1,1)", fill:"forwards"});
        await exit.finished.catch(() => {});
        if (generation !== collectionMotionGeneration) return;
        panel.hidden = true;
        exit.cancel();
    }
    if (generation !== collectionMotionGeneration) return;
    for (const view of collectionToggles) {
        view.panel.hidden = view.id !== id;
        view.panel.inert = false;
    }
    document.getElementById("collectionSelectionHint").hidden = id !== null;
    const incoming = collectionToggles.find(view => view.id === id);
    if (incoming && animate) {
        const panel = incoming.panel, style = getComputedStyle(panel);
        animateCollection(panel, [
            {height:"0px", opacity:0, transform:"translateY(10px)", paddingTop:"0px", paddingBottom:"0px", marginBottom:"0px"},
            {height:panel.getBoundingClientRect().height+"px", opacity:1, transform:"translateY(0)", paddingTop:style.paddingTop, paddingBottom:style.paddingBottom, marginBottom:style.marginBottom}
        ], {duration:300, easing:"cubic-bezier(.22,1,.36,1)"});
        panel.querySelectorAll(".achievement-badge-card, .achievement-artifact-card").forEach((card,index) => {
            animateCollection(card, [{opacity:0, transform:"translateY(8px)"}, {opacity:1, transform:"translateY(0)"}],
                {duration:240, delay:70+Math.min(index*35,175), easing:"cubic-bezier(.22,1,.36,1)", fill:"backwards"});
        });
    }
}

for (const view of collectionToggles) {
    view.button.addEventListener("click", () => showCollection(visibleCollection === view.id ? null : view.id));
}

// Each collection has its own loading, empty, retry and request state.
function collectionView({kind, ownership, catalog, key, count, grid, loading, empty, statusId, retryId}) {
    const view = {kind, ownership, catalog, key, count:document.getElementById(count), grid:document.getElementById(grid), loading:document.getElementById(loading), empty:document.getElementById(empty), request:0};
    view.status = document.createElement("p"); view.status.id = statusId;
    view.status.setAttribute("role", "status"); view.status.setAttribute("aria-live", "polite");
    view.retry = document.createElement("button"); view.retry.type = "button"; view.retry.className = "text-button";
    view.retry.id = retryId; view.retry.textContent = "Retry Loading " + (kind === "badge" ? "Badges" : "Artifacts"); view.retry.hidden = true;
    view.grid.before(view.status, view.retry);
    view.retry.addEventListener("click", () => loadCollection(auth.currentUser, view));
    return view;
}
const badgeView = collectionView({kind:"badge", ownership:"studentBadges", catalog:"badges", key:"badgeId", count:"earnedBadgeCount", grid:"badgeCollection", loading:"achievementLoading", empty:"achievementEmpty", statusId:"achievementStatus", retryId:"retryAchievements"});
const artifactView = collectionView({kind:"artifact", ownership:"studentArtifacts", catalog:"artifacts", key:"artifactId", count:"artifactCount", grid:"artifactGrid", loading:"artifactLoading", empty:"artifactEmpty", statusId:"artifactStatus", retryId:"retryArtifacts"});
let sessionGeneration = 0;
function resetCollection(view) {
    view.count.textContent = "\u2014"; view.grid.replaceChildren(); view.empty.hidden = true;
    view.loading.hidden = true; view.status.textContent = ""; view.retry.hidden = true;
}
function loadAchievements(user) { return loadCollection(user, badgeView); }
function loadArtifacts(user) { return loadCollection(user, artifactView); }
async function loadCollection(user, view) {
    if (!user || auth.currentUser?.uid !== user.uid) return;
    const session = sessionGeneration, request = ++view.request;
    const current = () => session === sessionGeneration && request === view.request && auth.currentUser?.uid === user.uid;
    const plural = view.kind === "badge" ? "badges" : "artifacts";
    resetCollection(view); view.loading.hidden = false;
    try {
        const snapshot = await getDocs(query(collection(db, view.ownership), where("userId", "==", user.uid)));
        if (!current()) return;
        const ownerships = new Map(); let invalid = false;
        snapshot.forEach(row => {
            const ownership = row.data(); if (ownership.userId !== user.uid) return;
            const id = ownership[view.key];
            if (typeof id !== "string" || !id || id.includes("/")) { invalid = true; return; }
            if (!ownerships.has(id)) ownerships.set(id, ownership);
        });
        // Counts reflect ownership even when a catalog detail cannot load.
        view.count.textContent = String(ownerships.size);
        const results = await Promise.all([...ownerships].map(async ([id, ownership]) => {
            try {
                const detail = await getDoc(doc(db, view.catalog, id));
                if (!detail.exists()) return null;
                const item = detail.data();
                if (view.kind === "badge" ? item.status !== "active" : item.status && item.status !== "active") return null;
                return {...item, id, chapterId:ownership.chapterId, missionId:ownership.missionId || item.missionId, earnedAt:ownership.earnedAt || ownership.collectedAt || null};
            } catch { return null; }
        }));
        if (!current()) return;
        const items = results.filter(Boolean).sort((a,b) => (Number(a.order)||0)-(Number(b.order)||0) || a.id.localeCompare(b.id));
        for (const item of items) view.grid.append(view.kind === "badge" ? createBadgeCard(item) : createArtifactCard(item));
        if (items.length < ownerships.size || invalid) {
            view.status.textContent = items.length ? "Some earned " + (view.kind === "badge" ? "badge" : "artifact") + " details are unavailable. Your earned " + plural + " are still saved."
                : "Your earned " + plural + " are saved, but their details are currently unavailable.";
            view.retry.hidden = false;
        } else if (!ownerships.size) view.empty.hidden = false;
    } catch (error) {
        if (!current()) return;
        console.error("Unable to load " + plural + ":", error);
        view.count.textContent = "Unavailable"; view.status.textContent = studentLoadMessage(error,"We could not load your " + plural + ". Use Retry Loading to try again.");
        view.retry.hidden = false;
    } finally { if (current()) view.loading.hidden = true; }
}

const supportedBadgeRarities = new Set(["common", "uncommon", "rare", "epic", "legendary", "special"]);
function createBadgeCard(badge) {
    const card = document.createElement("article"); card.className = "achievement-badge-card";
    const icon = document.createElement("div"); icon.className = "achievement-badge-icon"; icon.textContent = badge.icon || "🏅";
    const content = document.createElement("div"); content.className = "achievement-badge-content";
    const rarity = document.createElement("span"); rarity.className = "achievement-badge-rarity";
    const rarityValue = String(badge.rarity || "achievement").trim().toLowerCase();
    rarity.dataset.rarity = supportedBadgeRarities.has(rarityValue) ? rarityValue : "achievement";
    rarity.textContent = String(badge.rarity || "achievement").toUpperCase();
    const name = document.createElement("h3"); name.textContent = badge.name || "Achievement Badge";
    const description = document.createElement("p"); description.textContent = badge.description || "";
    content.append(rarity, name, description);
    const earnedDate = formatEarnedDate(badge.earnedAt);
    if (earnedDate) {
        const date = document.createElement("small"); date.className = "achievement-earned-date"; date.textContent = `Earned ${earnedDate}`; content.append(date);
    }
    card.append(icon, content);
    return card;
}

function createArtifactCard(artifact) {
    const card = document.createElement("article"); card.className = "achievement-artifact-card artifact-card";
    const icon = document.createElement("div"); icon.className = "achievement-artifact-icon"; icon.textContent = artifact.icon || artifact.emoji || "\u{1F3FA}";
    const content = document.createElement("div"); content.className = "achievement-badge-content";
    const label = document.createElement("span"); label.className = "achievement-artifact-label"; label.textContent = "COLLECTED";
    const name = document.createElement("h3"); name.textContent = artifact.name || artifact.title || "Historical Artifact";
    const description = document.createElement("p"); description.textContent = artifact.description || "";
    content.append(label, name, description);
    const date = formatEarnedDate(artifact.earnedAt);
    if (date) { const earned = document.createElement("small"); earned.className = "achievement-earned-date"; earned.textContent = "Collected " + date; content.append(earned); }
    const learning=artifact.learningDetails;
    if(learning&&typeof learning==='object'){
        const details=document.createElement('details');details.className='artifact-learning-details';const summary=document.createElement('summary');summary.textContent='Explore This Discovery';details.append(summary);
        const body=document.createElement('div');body.className='artifact-learning-body';
        function section(title,value){if(typeof value!=='string'||!value.trim())return;const heading=document.createElement('h4');heading.textContent=title;const copy=document.createElement('p');copy.textContent=value;body.append(heading,copy);}
        section('What this represents',learning.represents);section('Connect it to your lesson',learning.lessonConnection);section('Think about it',learning.reflectionQuestion);section('About this collectible',learning.collectibleNote);
        if(typeof artifact.chapterId==='string'&&artifact.chapterId&&typeof artifact.missionId==='string'&&artifact.missionId){const lesson=document.createElement('a');lesson.className='artifact-lesson-link';lesson.textContent='Revisit the Lesson';lesson.href='story.html?'+new URLSearchParams({chapter:artifact.chapterId,mission:artifact.missionId});body.append(lesson);}
        details.append(body);content.append(details);
    }
    card.append(icon, content); return card;
}

function formatEarnedDate(timestamp) {
    if (!timestamp || typeof timestamp.toDate !== "function") return "";
    const date = timestamp.toDate();
    return Number.isFinite(date.getTime()) ? date.toLocaleDateString(undefined, {year:"numeric", month:"short", day:"numeric"}) : "";
}

onAuthStateChanged(auth, user => {
    sessionGeneration++;
    showCollection(null, false);
    for (const view of [badgeView, artifactView]) { view.request++; resetCollection(view); }
    if (user) { loadAchievements(user); loadArtifacts(user); }
});
window.addEventListener('pageshow',event=>{
    if(event.persisted&&auth.currentUser){
        loadAchievements(auth.currentUser);
        loadArtifacts(auth.currentUser);
    }
});
