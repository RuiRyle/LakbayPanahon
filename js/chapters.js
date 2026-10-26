
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


 // ==========================================
 // LOAD ERAS
 // ==========================================

 async function loadEras() {

     try {

         console.log(
             "Loading historical eras..."
         );

         const snapshot =
             await getDocs(
                 collection(db, "eras")
             );

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

                         <button
                             type="button"
                             class="era-button"
                         >
                             Explore Era →
                         </button>

                     </div>

                 `;

                 const button =
                     card.querySelector(
                         ".era-button"
                     );

                 button.addEventListener(
                     "click",
                     () => {

                         loadChapters(
                             era.id,
                             era.title
                         );

                     }
                 );

                 eraList.appendChild(
                     card
                 );

             }
         );

     } catch (error) {

         console.error(
             "Unable to load eras:",
             error
         );

         if (eraLoading) {
             eraLoading.hidden = true;
         }

         if (eraError) {
             eraError.hidden = false;
         }

     }

 }


 // ==========================================
 // LOAD STUDENT CHAPTER PROGRESS
 // ==========================================

 async function loadStudentChapterProgress() {

     const completedChapterIds =
         new Set();

     if (!currentUser) {
         return completedChapterIds;
     }

     const snapshot = await getDocs(
    query(
        collection(db, "studentChapterProgress"),
        where("userId", "==", currentUser.uid)
    )
);

     snapshot.forEach(
         (documentSnapshot) => {

             const progress =
                 documentSnapshot.data();

             if (
                 progress.userId === currentUser.uid &&
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
     eraTitle
 ) {

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
         // GET ALL CHAPTERS
         // ==================================

         const snapshot =
             await getDocs(
                 collection(db, "chapters")
             );

         console.log(
             "Total chapters found:",
             snapshot.size
         );

         if (snapshot.empty) {

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
             await loadStudentChapterProgress();


         if (chapterLoading) {
             chapterLoading.hidden = true;
         }


         // ==================================
         // DISPLAY CHAPTERS
         // ==================================

         matchingChapters.forEach(
             (chapter, index) => {

                 /*
                  * First active chapter in the era
                  * is always unlocked.
                  *
                  * Every later chapter requires
                  * the previous chapter to have
                  * been completed.
                  */

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
                         .filter(item => item.contentReady !== false)
                         .every(item => completedChapterIds.has(item.id));

                 }


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


                 // ==================================
                 // CARD CONTENT
                 // ==================================

                 card.innerHTML = `

                     <div class="chapter-number">

                         ${escapeHtml(
                             String(
                                 chapter.order || 1
                             )
                         )}

                     </div>


                     <div class="chapter-content">

                         <span class="chapter-label">
                             ${statusText}
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

                 chapterList.appendChild(
                     card
                 );

             }
         );


         // ==================================
         // SCROLL TO CHAPTERS
         // ==================================

         chapterSection.scrollIntoView({

             behavior: "smooth",

             block: "start"

         });

     } catch (error) {

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
 // MOBILE SIDEBAR
 // ==========================================

 const mobileMenuButton =
     document.getElementById(
         "mobileMenuButton"
     );

 const sidebar =
     document.querySelector(
         ".sidebar"
     );

 if (
     mobileMenuButton &&
     sidebar
 ) {

     mobileMenuButton.addEventListener(
         "click",
         () => {

             sidebar.classList.toggle(
                 "open"
             );

         }
     );

 }


 // ==========================================
 // START
 // ==========================================

 onAuthStateChanged(
     auth,
     (user) => {

         if (!user) {
             return;
         }

         currentUser =
             user;

         loadEras();

     }
 );
