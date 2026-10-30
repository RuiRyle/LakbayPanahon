import { instructionalSnapshot } from "./instructional-content.js";

 // ==========================================
 // LAKBAYPANAHON
 // HISTORICAL ERAS AND CHAPTERS
 // ==========================================

 import {
     auth,
     db
 } from "./firebase-config.js";

 import {
     onAuthStateChanged
 } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

 // ==========================================
 // ELEMENTS
 // ==========================================

 const isEraOverviewPage = document.body.classList.contains('era-detail-page');
 const requestedEraId = new URLSearchParams(window.location.search).get('era');
 let loadedEras = [];
 const eraList =
     document.getElementById("eraList");

 const eraLoading =
     document.getElementById("eraLoading");

 const eraError =
     document.getElementById("eraError");

 const chapterSection =
     document.getElementById("chapterSection");

 const chapterList =
     document.getElementById("chapterList");

 const chapterLoading =
     document.getElementById("chapterLoading");

 const selectedEraTitle =
     document.getElementById("selectedEraTitle");


 // ==========================================
 // STATE
 // ==========================================

 let currentUser = null;
 let mapSessionGeneration = 0;
 let chapterRequestGeneration = 0;
 let selectedEraId = null;


 // ==========================================
 // LOAD ERAS
 // ==========================================

 async function loadEras() {
     if (!currentUser) return;
     if (isEraOverviewPage) { resetEraOverview(); chapterSection.hidden = true; }
     eraLoading.hidden = false;
     eraError.hidden = true;
     eraList.replaceChildren();
     const generation = mapSessionGeneration;

     try {

         console.log(
             "Loading historical eras..."
         );

         const snapshot =
             await instructionalSnapshot("eras", () => getDocs(collection(db,"eras")));

         if (generation !== mapSessionGeneration) return;
         console.log(
             "Number of eras found:",
             snapshot.size
         );

         if (eraLoading) {
             eraLoading.hidden = true;
         }

         if (eraError) {
             eraError.hidden = true;
         }

         if (!eraList) {
             return;
         }

         eraList.innerHTML = "";

         if (snapshot.empty) {

             eraList.innerHTML = `
                 <div class="learning-message">
                     No historical eras are available yet.
                 </div>
             `;

             return;
         }

         const eras = [];

         snapshot.forEach(
             (documentSnapshot) => {

                 eras.push({
                     id: documentSnapshot.id,
                     ...documentSnapshot.data()
                 });

             }
         );


         // ==================================
         // ACTIVE ERAS ONLY
         // ==================================

         loadedEras = eras;
         const activeEras =
             eras

                 .filter(
                     (era) =>
                         era.status === "active"
                 )

                 .sort(
                     (a, b) =>
                         (Number(a.order) || 0) -
                         (Number(b.order) || 0)
                 );

         console.log(
             "Active eras found:",
             activeEras.length
         );

         if (activeEras.length === 0) {

             eraList.innerHTML = `
                 <div class="learning-message">
                     No active historical eras
                     are available yet.
                 </div>
             `;

             return;
         }


         // ==================================
         // DISPLAY ERAS
         // ==================================

         const eraProgress = isEraOverviewPage || activeEras.some(era=>era.requiredChapterIds!==undefined)
             ? await loadStudentChapterProgress() : new Set();
         if (generation !== mapSessionGeneration) return;
         activeEras.forEach(
             (era) => {

                 const card =
                     document.createElement(
                         "article"
                     );

                 card.className =
                     "era-card available";

                 card.innerHTML = `

                     <div class="era-image">
                         <span>🧭</span>
                     </div>

                     <div class="era-content">

                         <span class="era-status">
                             AVAILABLE
                         </span>

                         <h3>
                             ${escapeHtml(
                                 era.title
                             )}
                         </h3>

                         <p>
                             ${escapeHtml(
                                 era.description || ""
                             )}
                         </p>

                         <a class="era-button" href="era.html?era=${encodeURIComponent(era.id)}"
                         >
                             Explore Era →
                         </a>

                     </div>

                 `;

                 const visual=card.querySelector('.era-image');
                 visual.innerHTML='<svg class="era-expedition-art" viewBox="0 0 400 200" fill="none" aria-hidden="true"><path class="atlas-route" d="M-10 160C60 170 65 60 160 90S255 160 320 65S410 25 430 45"/><path class="atlas-island-shadow" d="M82 62l20-17 27 6 12 22-8 24 19 24-9 24-24-7-13-25-24-11-11-22zM222 123l28-12 24 10 10 24-21 20-34-5-17-18zM302 32l20-12 26 14-4 28-24 6-21-17z"/><path class="atlas-island" d="M78 55l20-17 27 6 12 22-8 24 19 24-9 24-24-7-13-25-24-11-11-22zM218 116l28-12 24 10 10 24-21 20-34-5-17-18zM298 25l20-12 26 14-4 28-24 6-21-17z"/><path class="atlas-topography" d="M92 62l13-10 17 13-8 24 17 26M231 128l14-9 20 14-10 13M310 32l10-6 13 12"/><g class="atlas-boat"><path d="M174 134h48l-10 12h-28z"/><path d="M196 91v41h-25zM200 102l19 28h-19z"/><path d="M165 149h64M170 155h54"/></g><circle cx="315" cy="93" r="12" class="atlas-marker"/><path d="M311 92l3 3 5-6" stroke="#fff8df" stroke-width="2"/><path d="M355 128v35m-17-17h34m-17-11 6 11-6 11-6-11z" class="atlas-compass"/></svg>';
                 card.dataset.theme=['sea','forest','sand'].includes(era.theme)?era.theme:'sea';
                 if(typeof era.dateRange==='string'&&era.dateRange.trim()){const dates=document.createElement('span');dates.className='era-date-range';dates.textContent=era.dateRange;card.querySelector('.era-content h3').after(dates);}
                 if(typeof era.imageUrl==='string'){try{const url=new URL(era.imageUrl);if(url.protocol==='https:'){const picture=document.createElement('img');picture.src=url.href;picture.alt='';picture.loading='lazy';picture.className='era-authored-art';visual.append(picture);}}catch{}}
                 card.dataset.eraId=era.id;
                 updateEraAccessCard(card,era,eraProgress);
                 eraList.appendChild(
                     card
                 );

             }
         );

         if (isEraOverviewPage) {
             const era = activeEras.find(row => row.id === requestedEraId);
             if (!era) {
                 eraError.textContent = 'This era is not available. Choose another destination from All eras.';
                 eraError.hidden = false;
                 return;
             }
             renderEraOverview(era);
             await loadChapters(era.id, era.title, eraProgress);
         } else if (selectedEraId) {
             const selected=activeEras.find(row=>row.id===selectedEraId);
             if(selected)await loadChapters(selected.id,selected.title,eraProgress);
             else {chapterSection.hidden=true;chapterList.replaceChildren();selectedEraId=null;}
         }

     } catch (error) {
         if (generation !== mapSessionGeneration) return;
         console.error(
             "Unable to load eras:",
             error
         );

         if (eraLoading) {
             eraLoading.hidden = true;
         }

         if (eraError) {
             eraError.textContent = "Unable to load historical eras. Check your connection and try again.";
             eraError.hidden = false;
             appendMapRetry(eraError,"Retry Loading Eras",loadEras);
         }

     }

 }


 // ==========================================
 // LOAD STUDENT CHAPTER PROGRESS
 // ==========================================

 function updateEraAccessCard(card,era,completed) {
     const requirements=era.requiredChapterIds===undefined?[]:era.requiredChapterIds;
     const unlocked=globalThis.__lakbayExplorationPreview===true||(Array.isArray(requirements)&&requirements.every(id=>typeof id==='string'&&id&&completed.has(id)));
     card.dataset.locked=String(!unlocked);
     card.querySelector('.era-status').textContent=unlocked?'AVAILABLE':'LOCKED — PREVIEW';
     card.querySelector('.era-button').textContent=unlocked?'Explore Era':'Preview Chapters';
     let note=card.querySelector('.era-unlock-note');
     if(!unlocked){
         if(!note){note=document.createElement('p');note.className='era-unlock-note';card.querySelector('.era-content').append(note);}
         note.textContent=era.unlockMessage||'Complete the required chapters in the previous era to unlock new lessons.';
     }else note?.remove();
 }

 async function loadStudentChapterProgress() {

     const completedChapterIds =
         new Set();

     if (!currentUser) {
         return completedChapterIds;
     }

     const userId=currentUser.uid;
     const snapshot = await getDocs(
    query(
        collection(db, "studentChapterProgress"),
        where("userId", "==", userId)
    )
);

     snapshot.forEach(
         (documentSnapshot) => {

             const progress =
                 documentSnapshot.data();

             if (
                 progress.userId === userId &&
                 progress.completed === true
             ) {

                 completedChapterIds.add(
                     progress.chapterId
                 );

             }

         }
     );

     return completedChapterIds;

 }


 // ==========================================
 // LOAD CHAPTERS
 // ==========================================

 async function loadChapters(
     eraId,
     eraTitle,
     knownProgress = null
 ) {
     if (!currentUser) return;
     if(!isEraOverviewPage)selectedEraId=eraId;
     const generation = mapSessionGeneration;
     const request = ++chapterRequestGeneration;
     if (isEraOverviewPage) {
         for(const id of ['eraContinue','eraDiscoveries','eraProgressPanel'])document.getElementById(id).hidden=true;
         document.getElementById('eraOverviewAccess').textContent='Loading your chapter trail...';
     }
     const isCurrent = () => generation === mapSessionGeneration && request === chapterRequestGeneration;

     console.log(
         "Loading chapters for era:",
         eraId
     );

     if (!chapterSection) {
         return;
     }

     chapterSection.hidden =
         false;

     if (chapterLoading) {
         chapterLoading.hidden = false;
     }

     if (chapterList) {
         chapterList.innerHTML = "";
     }

     if (selectedEraTitle) {

         selectedEraTitle.textContent =
             eraTitle;

     }

     try {

         // ==================================
         // GET CHAPTERS FOR THE SELECTED ERA
         // ==================================

         const snapshot =
             await instructionalSnapshot("chapters:"+eraId, () => getDocs(query(collection(db,"chapters"),where("eraId","==",eraId))));

         if (!isCurrent()) return;
         console.log(
             "Total chapters found:",
             snapshot.size
         );

         if (snapshot.empty) {
             if(isEraOverviewPage) document.getElementById('eraOverviewAccess').textContent='This destination is being prepared. Chapters will appear here when available.';

             if (chapterLoading) {
                 chapterLoading.hidden = true;
             }

             chapterList.innerHTML = `
                 <div class="learning-message">
                     No chapters are available yet.
                 </div>
             `;

             return;
         }


         // ==================================
         // CONVERT FIRESTORE DOCUMENTS
         // ==================================

         const chapters = [];

         snapshot.forEach(
             (documentSnapshot) => {

                 const chapter =
                     documentSnapshot.data();

                 chapters.push({
                     id:
                         documentSnapshot.id,
                     ...chapter
                 });

             }
         );


         // ==================================
         // FILTER + SORT CHAPTERS
         // ==================================

         const matchingChapters =
             chapters

                 .filter(
                     (chapter) =>

                         chapter.eraId === eraId &&

                         chapter.status === "active"
                 )

                 .sort(
                     (a, b) =>

                         (Number(a.order) || 0) -

                         (Number(b.order) || 0)
                 );


         console.log(
             "Matching chapters found:",
             matchingChapters.length
         );


         // ==================================
         // NO MATCHING CHAPTERS
         // ==================================

         if (
             matchingChapters.length === 0
         ) {

             if (chapterLoading) {
                 chapterLoading.hidden = true;
             }

             chapterList.innerHTML = `
                 <div class="learning-message">
                     No chapters are available
                     for this era yet.
                 </div>
             `;

             return;
         }


         // ==================================
         // LOAD STUDENT CHAPTER PROGRESS
         // ==================================

         const completedChapterIds =
             knownProgress || await loadStudentChapterProgress();
         if (!isCurrent()) return;
         const selectedEra=loadedEras.find(era=>era.id===eraId);
         if (!selectedEra) throw new Error('Reload the eras before selecting a chapter.');
         const requirements=selectedEra.requiredChapterIds===undefined?[]:selectedEra.requiredChapterIds;
         const eraUnlocked=globalThis.__lakbayExplorationPreview===true||(Array.isArray(requirements)&&requirements.every(id=>typeof id==='string'&&id&&completedChapterIds.has(id)));
         eraList.querySelectorAll('.era-card').forEach(card=>{
             const era=loadedEras.find(row=>row.id===card.dataset.eraId);
             if(era)updateEraAccessCard(card,era,completedChapterIds);
         });

         if (chapterLoading) {
             chapterLoading.hidden = true;
         }


         // ==================================
         // DISPLAY CHAPTERS
         // ==================================

         const overviewDestinations = [];
         matchingChapters.forEach(
             (chapter, index) => {

                 // Chapter order applies after the era's prerequisites are met.

                 let isUnlocked =
                     index === 0;

                 let previousChapter =
                     null;

                 if (index > 0) {

                     previousChapter =
                         matchingChapters[
                             index - 1
                         ];

                     isUnlocked = matchingChapters.slice(0, index)
                         .filter(item => item.contentReady !== false && item.requiredForProgression !== false)
                         .every(item => completedChapterIds.has(item.id));

                 }


                 isUnlocked = globalThis.__lakbayExplorationPreview===true || completedChapterIds.has(chapter.id) || (eraUnlocked && isUnlocked);

                 // A chapter can be listed without being playable yet.
                 // Missing contentReady is treated as true for legacy chapters.
                 const isContentReady = chapter.contentReady !== false;

                 // ==================================
                 // CURRENT CHAPTER COMPLETED?
                 // ==================================

                 const isCompleted =
                     completedChapterIds.has(
                         chapter.id
                     );


                 // ==================================
                 // CREATE CARD
                 // ==================================

                 const card =
                     document.createElement(
                         "article"
                     );

                 card.className =
                     "chapter-card";

                 if (!isContentReady) {

                     card.classList.add("locked");

                 } else if (isCompleted) {

                     card.classList.add(
                         "completed"
                     );

                 } else if (!isUnlocked) {

                     card.classList.add(
                         "locked"
                     );

                 }


                 // ==================================
                 // STATUS
                 // ==================================

                 let statusText =
                     "AVAILABLE";

                 if (!isContentReady) {

                     statusText = "COMING SOON";

                 } else if (isCompleted) {

                     statusText =
                         "✓ CHAPTER COMPLETE";

                 } else if (!isUnlocked) {

                     statusText =
                         "🔒 LOCKED";

                 }


                 // ==================================
                 // BUTTON
                 // ==================================

                 let buttonText =
                     "View Chapter →";

                 if (!isContentReady) {

                     buttonText = "Coming Soon";

                 } else if (isCompleted) {

                     buttonText =
                         "Review Chapter →";

                 } else if (!isUnlocked) {

                     buttonText =
                         "🔒 Complete Previous Chapter";

                 }


                 if (!eraUnlocked && !isCompleted && isContentReady) buttonText='Complete the previous era';

                 // ==================================
                 // CARD CONTENT
                 // ==================================

                 const displayLabel = String(chapter.displayLabel || "").trim();
                 const chapterMarker = displayLabel ? "\u{1F9ED}" : String(chapter.order ?? 1);

                 card.innerHTML = `

                     <div class="chapter-number" aria-hidden="true">

                         ${escapeHtml(
                             chapterMarker
                         )}

                     </div>


                     <div class="chapter-content">

                         <span class="chapter-label">
                             ${displayLabel ? escapeHtml(displayLabel) + " &middot; " : ""}${statusText}
                         </span>

                         <h3>

                             ${escapeHtml(
                                 chapter.title ||
                                 "Untitled Chapter"
                             )}

                         </h3>

                         <p>

                             ${escapeHtml(
                                 chapter.description ||
                                 ""
                             )}

                         </p>

                         <button
                             type="button"
                             class="chapter-button"
                             ${(!isUnlocked || !isContentReady)
                                 ? "disabled"
                                 : ""}
                         >
                             ${buttonText}
                         </button>

                     </div>

                 `;


                 // ==================================
                 // BUTTON BEHAVIOR
                 // ==================================

                 const button =
                     card.querySelector(
                         ".chapter-button"
                     );

                 if (isUnlocked && isContentReady) {

                     button.addEventListener(
                         "click",
                         () => {

                             window.location.href =
                                 `mission.html?chapter=${encodeURIComponent(
                                     chapter.id
                                 )}`;

                         }
                     );

                 }


                 // ==================================
                 // ADD CARD
                 // ==================================

                 overviewDestinations.push({chapter, isUnlocked, isContentReady, isCompleted});
                 chapterList.appendChild(
                     card
                 );

             }
         );


         // ==================================
         // SCROLL TO CHAPTERS
         // ==================================

         if (isEraOverviewPage) renderEraOverviewProgress(selectedEra, overviewDestinations, eraUnlocked);
         selectedEraTitle.tabIndex = -1;
         if (!isEraOverviewPage) selectedEraTitle.focus({preventScroll:true});
         if (!isEraOverviewPage) chapterSection.scrollIntoView({

             behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",

             block: "start"

         });

     } catch (error) {
         if (!isCurrent()) return;
         if(isEraOverviewPage) document.getElementById('eraOverviewAccess').textContent='Your trail could not load. Use Retry Loading Chapters below.';
         console.error(
             "Unable to load chapters:",
             error
         );

         if (chapterLoading) {
             chapterLoading.hidden = true;
         }

         if (chapterList) {

             chapterList.innerHTML = `
                 <div class="
                     learning-message
                     error-message
                 ">
                     Unable to load the chapters.
                 </div>
             `;
             appendMapRetry(chapterList,"Retry Loading Chapters",()=>loadChapters(eraId,eraTitle));

         }

     }

 }


 // ==========================================
 // ESCAPE HTML
 // ==========================================

 function escapeHtml(value) {

     const div =
         document.createElement("div");

     div.textContent =
         value ?? "";

     return div.innerHTML;

 }


 // ==========================================
 // START
 // ==========================================

 onAuthStateChanged(
     auth,
     (user) => {

         if (!user) {
             mapSessionGeneration++;
             chapterRequestGeneration++;
             currentUser = null;
             selectedEraId = null;
             eraList.replaceChildren();
             chapterList.replaceChildren();
             chapterSection.hidden = true;
             resetEraOverview();
             eraLoading.hidden = true;
             eraError.textContent = "Please sign in to view chapters.";
             eraError.hidden = false;
             return;
         }
         if (currentUser?.uid === user.uid) return;
         mapSessionGeneration++;
         chapterRequestGeneration++;

         currentUser =
             user;

         resetEraOverview();
         loadEras();

     }
 );
window.addEventListener('pageshow',event=>{
    if(!event.persisted||!auth.currentUser)return;
    mapSessionGeneration++;
    chapterRequestGeneration++;
    currentUser=auth.currentUser;
    if(!isEraOverviewPage&&selectedEraId){chapterSection.hidden=true;chapterList.replaceChildren();}
    loadEras();
});

function appendMapRetry(container,label,retry) {
    const button=document.createElement("button");
    button.type="button";button.className="text-button";button.textContent=label;
    button.addEventListener("click",async()=>{
        if(button.disabled || !currentUser)return;
        button.disabled=true;
        try { await retry(); } finally { button.disabled=false; }
    });
    container.append(button);
}

function resetEraOverview() {
    for (const id of ['eraOverview','eraDiscoveries','eraProgressPanel']) {
        const element=document.getElementById(id); if(element)element.hidden=true;
    }
    const action=document.getElementById('eraContinue');if(action){action.hidden=true;action.removeAttribute('href');}
}
function renderEraOverview(era) {
    const overview=document.getElementById('eraOverview');if(!overview)return;
    overview.hidden=false;
    overview.dataset.theme=['sea','forest','sand'].includes(era.theme)?era.theme:'sea';
    document.title=String(era.title||'Era Overview')+' | LakbayPanahon';
    document.getElementById('eraOverviewTitle').textContent=era.title||'Historical Era';
    document.getElementById('eraOverviewDescription').textContent=era.description||'';
    const period=document.getElementById('eraOverviewPeriod');period.textContent=typeof era.dateRange==='string'?era.dateRange:'';period.hidden=!period.textContent;
    const art=document.getElementById('eraOverviewArt');art.replaceChildren();
    const card=[...eraList.children].find(card=>card.dataset.eraId===era.id);
    const image=card?.querySelector('.era-image');if(image)art.append(...[...image.children].map(child=>child.cloneNode(true)));
    document.getElementById('eraOverviewAccess').textContent='Loading your chapter trail...';
}
function renderEraOverviewProgress(era,destinations,unlocked) {
    const panel=document.getElementById('eraProgressPanel');if(!panel)return;
    const completed=destinations.filter(row=>row.isCompleted).length;
    const total=destinations.length;
    document.getElementById('eraProgressText').textContent=completed+' of '+total+' chapters complete';
    document.getElementById('eraProgressHint').textContent='Chapter challenges mark your progress. You can revisit completed chapters.';
    const progress=document.getElementById('eraProgress');progress.max=Math.max(1,total);progress.value=completed;panel.hidden=false;
    const preview=globalThis.__lakbayExplorationPreview===true;
    document.getElementById('eraOverviewAccess').textContent=preview?'Exploration preview: lessons are open for testing. Quiz progress and rewards are not saved.':unlocked?'Your trail is open. Complete each chapter challenge to unlock the next step.':era.unlockMessage||'Complete the required chapters in the previous era to unlock new lessons. You can look around here first.';
    const next=destinations.find(row=>row.isUnlocked&&row.isContentReady&&!row.isCompleted)||destinations.find(row=>row.isUnlocked&&row.isContentReady&&row.isCompleted);
    const action=document.getElementById('eraContinue');action.hidden=!next;
    if(next){action.href='mission.html?'+new URLSearchParams({chapter:next.chapter.id});action.textContent=(next.isCompleted?'Revisit: ':'Explore: ')+(next.chapter.title||'Chapter');}else action.removeAttribute('href');
    const discoveries=document.getElementById('eraDiscoveryList');discoveries.replaceChildren();
    const goals=Array.isArray(era.learningObjectives)?era.learningObjectives.filter(goal=>typeof goal==='string'&&goal.trim()).slice(0,6):[];
    for(const text of goals.length?goals:destinations.slice(0,3).map(row=>row.chapter.title).filter(Boolean)){
        const li=document.createElement('li');li.textContent=text;discoveries.append(li);
    }
    document.getElementById('eraDiscoveries').hidden=!discoveries.children.length;
    document.getElementById('selectedEraTitle').textContent='Your chapter trail';
}
