import {createChapterBadgeArtwork} from './chapter-artwork.js';
import {studentLoadMessage} from './student-status.js';
import {createDiscoveryPinControl} from './discovery-pins.js';
import {openMuseumExhibit,closeMuseumExhibit,createArtifactArtwork,historicalObjectFor,artifactDisplayName} from './museum-exhibits.js';
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
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || document.body.classList.contains('lakbay-reduce-motion');
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
    view.status.className = "lp-status-panel";
    view.status.setAttribute("role", "status"); view.status.setAttribute("aria-live", "polite");
    view.status.setAttribute('aria-atomic','true');
    view.retry = document.createElement("button"); view.retry.type = "button"; view.retry.className = "text-button";
    view.retry.id = retryId; view.retry.textContent = "Retry Loading " + (kind === "badge" ? "Badges" : "Artifacts"); view.retry.hidden = true;
    view.grid.before(view.status, view.retry);
    view.retry.addEventListener("click", () => loadCollection(auth.currentUser, view));
    return view;
}
const badgeView = collectionView({kind:"badge", ownership:"studentBadges", catalog:"badges", key:"badgeId", count:"earnedBadgeCount", grid:"badgeCollection", loading:"achievementLoading", empty:"achievementEmpty", statusId:"achievementStatus", retryId:"retryAchievements"});
const artifactView = collectionView({kind:"artifact", ownership:"studentArtifacts", catalog:"artifacts", key:"artifactId", count:"artifactCount", grid:"artifactGrid", loading:"artifactLoading", empty:"artifactEmpty", statusId:"artifactStatus", retryId:"retryArtifacts"});
let sessionGeneration = 0;
const chapterExhibits = document.createElement('section');
chapterExhibits.className = 'achievement-section chapter-exhibits';
chapterExhibits.hidden = true;
document.getElementById('collectionSelectionHint')?.after(chapterExhibits);
const exhibitItems = new Map();
function renderChapterExhibits(userId) {
    chapterExhibits.replaceChildren();
    chapterExhibits.hidden = true;
    const badges = exhibitItems.get('badge');
    const artifacts = exhibitItems.get('artifact');
    if (!badges || !artifacts || auth.currentUser?.uid !== userId) return;
    const heading = document.createElement('h2');
    heading.textContent = 'Chapter exhibits';
    chapterExhibits.append(heading);
    const seen = new Set();
    for (const badge of badges) {
        if (!badge.chapterId || seen.has(badge.chapterId)) continue;
        seen.add(badge.chapterId);
        const items = artifacts.filter(artifact => artifact.chapterId === badge.chapterId);
        const shelf = document.createElement('article');
        shelf.className = 'chapter-exhibit-shelf';
        const title = document.createElement('h3');
        title.textContent = badge.name || 'Chapter milestone';
        shelf.append(createChapterBadgeArtwork(badge.chapterId), title);
        const description = document.createElement('p');
        description.textContent = badge.description || 'Your chapter milestone and the keepsakes you earned along the way.';
        shelf.append(description);
        if (items.length) {
            const display = document.createElement('div');
            display.className = 'chapter-exhibit-objects';
            for (const artifact of items) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'discovery-choice';
                button.append(createArtifactArtwork(artifact, 'chapter-exhibit-object-art'),
                    artifactDisplayName(artifact));
                button.addEventListener('click', () => {
                    if (auth.currentUser?.uid === userId && shelf.isConnected) {
                        openMuseumExhibit(artifact, {trigger:button,isCurrent: () => auth.currentUser?.uid === userId && shelf.isConnected});
                    }
                });
                display.append(button);
            }
            shelf.append(display);
        }
        chapterExhibits.append(shelf);
    }
    chapterExhibits.hidden = !seen.size;
}
function resetCollection(view) {
    view.grid.setAttribute('aria-busy','false');
    view.count.textContent = "\u2014"; view.grid.replaceChildren(); view.empty.hidden = true;
    view.loading.hidden = true; view.status.textContent = ""; view.retry.hidden = true;
    delete view.status.dataset.state;
}
const requestedExhibit = new URLSearchParams(window.location.search).get('exhibit');
const requestedBadge = new URLSearchParams(window.location.search).get('badge');
let requestedExhibitOpened = false;
let requestedBadgeShown = false;
function loadAchievements(user) { return loadCollection(user, badgeView); }
function loadArtifacts(user) { return loadCollection(user, artifactView); }
async function loadCollection(user, view) {
    if (!user || auth.currentUser?.uid !== user.uid) return;
    const session = sessionGeneration, request = ++view.request;
    const initialSelection = collectionMotionGeneration;
    const current = () => session === sessionGeneration && request === view.request && auth.currentUser?.uid === user.uid;
    const plural = view.kind === "badge" ? "badges" : "artifacts";
    exhibitItems.delete(view.kind);
    renderChapterExhibits(user.uid);
    resetCollection(view); view.loading.hidden = false;
    view.grid.setAttribute('aria-busy','true');
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
        exhibitItems.set(view.kind, items);
        renderChapterExhibits(user.uid);
        let exhibitTrigger;
        let badgeTarget;
        for (const item of items) {
            const card = view.kind === 'badge' ? createBadgeCard(item) : createArtifactCard(item);
            view.grid.append(card);
            if (view.kind === 'artifact' && item.id === requestedExhibit) {
                exhibitTrigger = card.querySelector('.artifact-view-button');
            }
            if (view.kind === 'badge' && item.id === requestedBadge) badgeTarget = card;
        }
        if (exhibitTrigger && !requestedExhibitOpened) {
            requestedExhibitOpened = true;
            void showCollection('artifacts', false);
            exhibitTrigger.focus();
            exhibitTrigger.click();
        }
        if (badgeTarget && !requestedBadgeShown) {
            requestedBadgeShown = true;
            void showCollection('badges', false);
            badgeTarget.tabIndex = -1;
            badgeTarget.classList.add('museum-requested-reward');
            badgeTarget.focus({preventScroll:true});
            badgeTarget.scrollIntoView({block:'center',behavior:'instant'});
        }
        if (items.length < ownerships.size || invalid) {
            view.status.dataset.state = "unconfirmed";
            view.status.textContent = items.length ? "Some earned " + (view.kind === "badge" ? "badge" : "artifact") + " details are unavailable. Your earned " + plural + " are still saved."
                : "Your earned " + plural + " are saved, but their details are currently unavailable.";
            view.retry.hidden = false;
        } else if (!ownerships.size) view.empty.hidden = false;
        if (view.kind === 'artifact' && requestedExhibit && !requestedExhibitOpened && !ownerships.has(requestedExhibit)) {
            const notice = 'This exhibit is not in your collection. You can browse the artifacts you have earned.';
            view.status.textContent = [notice, view.status.textContent].filter(Boolean).join(' ');
        }
        if (view.kind === 'badge' && requestedBadge && !requestedBadgeShown && !ownerships.has(requestedBadge)) {
            view.status.textContent = 'This badge is unavailable in your collection. You can browse the badges you have earned.';
        }
    } catch (error) {
        if (!current()) return;
        console.error("Unable to load " + plural + ":", error);
        view.count.textContent = "Unavailable";
        view.status.dataset.state = "error";
        view.status.textContent = studentLoadMessage(error,"We could not load your " + plural + ". Use Retry Loading to try again.");
        view.retry.hidden = false;
    } finally {
        if (current()) {
            view.loading.hidden = true;
            view.grid.setAttribute('aria-busy','false');
            if (initialSelection === collectionMotionGeneration && !visibleCollection &&
                !requestedExhibit && !requestedBadge && !badgeView.empty.hidden && !artifactView.empty.hidden) {
                void showCollection('artifacts', false);
            }
        }
    }
}

const supportedBadgeRarities = new Set(["common", "uncommon", "rare", "epic", "legendary", "special"]);
function createBadgeCard(badge) {
    const card = document.createElement("article"); card.className = "achievement-badge-card";
    card.setAttribute('aria-label','Earned badge: '+(badge.name||'Achievement Badge'));
    const icon = document.createElement("div"); icon.className = "achievement-badge-icon"; icon.append(createChapterBadgeArtwork(badge.chapterId));
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
    const object = historicalObjectFor(artifact);
    const displayName = artifactDisplayName(artifact);
    const card = document.createElement("article"); card.className = "achievement-artifact-card artifact-card";
    card.setAttribute('aria-label','Collected artifact: '+displayName);
    const icon = createArtifactArtwork(artifact, "achievement-artifact-icon");
    const content = document.createElement("div"); content.className = "achievement-badge-content";
    const label = document.createElement("span"); label.className = "achievement-artifact-label"; label.textContent = "COLLECTED";
    const name = document.createElement("h3"); name.textContent = displayName;
    const description = document.createElement("p"); description.textContent = object?.description || artifact.description || "";
    content.append(label, name, description);
    const date = formatEarnedDate(artifact.earnedAt);
    if (date) { const earned = document.createElement("small"); earned.className = "achievement-earned-date"; earned.textContent = "Collected " + date; content.append(earned); }
    const userId=auth.currentUser?.uid;
    const actions=document.createElement('div');actions.className='artifact-card-actions';
    if(userId){const open=document.createElement('button');open.type='button';open.className='text-button artifact-view-button';open.textContent='View Exhibit';open.addEventListener('click',()=>openMuseumExhibit(artifact,{trigger:open,isCurrent:()=>auth.currentUser?.uid===userId&&card.isConnected}));actions.append(open);}
    if(userId&&typeof artifact.id==='string')actions.append(createDiscoveryPinControl({userId,kind:'artifact',id:artifact.id,showWallLink:false,isCurrent:()=>auth.currentUser?.uid===userId&&card.isConnected}));
    content.append(actions);
    card.append(icon, content); return card;
}

function formatEarnedDate(timestamp) {
    if (!timestamp || typeof timestamp.toDate !== "function") return "";
    const date = timestamp.toDate();
    return Number.isFinite(date.getTime()) ? date.toLocaleDateString('en-PH', {timeZone:'Asia/Manila', year:"numeric", month:"short", day:"numeric"}) : "";
}

onAuthStateChanged(auth, user => {
    closeMuseumExhibit();
    sessionGeneration++;
    requestedBadgeShown = false;
    exhibitItems.clear();
    chapterExhibits.replaceChildren();
    chapterExhibits.hidden = true;
    showCollection(user && requestedExhibit && !requestedExhibitOpened ? 'artifacts' :
        user && (requestedBadge || window.location.hash === '#badges') ? 'badges' : null, false);
    for (const view of [badgeView, artifactView]) { view.request++; resetCollection(view); }
    if (user) { loadAchievements(user); loadArtifacts(user); }
});
window.addEventListener('pageshow',event=>{
    if(event.persisted&&auth.currentUser){
        loadAchievements(auth.currentUser);
        loadArtifacts(auth.currentUser);
    }
});
