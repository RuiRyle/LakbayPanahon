# Five discovery experiences — 31 October 2026

The five requested features are integrated into the existing student workflow. They use authored activities and existing saved progress; they add no paid AI/speech requests, currency, official assessment results or Firestore writes.

## 1. History Detective Cases

Open a supported mission and expand **Try a History Detective Case (optional)** below the lesson introduction. The same panel appears in that lesson's completion recap. Students inspect all three clues, choose a conclusion, and receive feedback that distinguishes evidence from overclaiming. Wrong answers allow another try. Reading remains the primary mission action.

Three specifically authored cases are available, rather than generic automatically generated questions for every lesson:

| Mission | Case |
| --- | --- |
| chapter-1 / mission-1: Life in the Barangay | More than a group of houses |
| chapter-1 / mission-2: Trade and Livelihood | How did goods connect people? |
| chapter-3 / chapter3-mission1: Seafaring and the Balangay | What can a boat part tell us? |

The new activity checks the existing mission access policy when opened, including the existing exploration preference. Unsupported/mismatched missions do not display an unrelated case. Access/read failures display a retry instruction. Selecting another mission, closing the panel, changing accounts or leaving disposes the activity. No official mission credit comes from finishing a case.

## 2. Then and Now

The second stage compares two original SVG teaching scenes of community life, goods and water travel. Students classify two features as changed or similar, receiving an explanation for each. Both must be understood before continuing. Labels and feedback explicitly distinguish examples from universal claims; modern wooden boats still exist, and early communities did not all look alike.

## 3. Bring Your Museum to Life

Achievements → Artifacts → an earned artifact → **Step Inside This Exhibit** opens a centred native modal with a large collectible symbol and three views: **The Story**, **Its Meaning**, and **My Discovery**. It reuses available artifact learning details and the authored cases where applicable. It does not invent missing provenance or historical-use information. A supplied historicalUse field is supported. Missing originating mission links have an honest fallback.

Exhibits include a return to the mission that earned them when ownership/catalog data supplies that link. Only owned artifacts are loaded into the collection. The dialog uses text-safe content, keyboard dismissal/focus restoration, and closes on account change/page exit. Existing inline learning details and personal Discovery Wall pinning remain available.

## 4. Build a Community

My Journey → **Build Your Learning Community** opens a progress illustration and five explorable places. They reveal after 1, 25%, 50%, 75%, and 100% of currently available ready missions are saved complete (rounded up). For the current 66-mission catalog, those thresholds are 1, 17, 33, 50 and 66. Each place explains its learning purpose and links back to a completed lesson.

The blueprint gains colour as places reveal. This is an imagined learning space inspired by community life, not a reconstruction of one village or a claim that all historical periods shared its architecture. Progress derives from unique available missions and matching chapter/mission completions owned by the signed-in student. Preview access, XP, quiz attempts, foreign-account rows and unfinished records do not build places. No extra reward documents are created. This visual follows the current catalog, whereas the separate Journey Finale uses its frozen versioned requirements.

## 5. Explain It to Bayani

In the third case stage, Bayani asks the student to choose the clue that best supports a specific claim. Feedback explains the connection and what the evidence cannot prove. It is explicitly labelled authored practice feedback, not a live AI conversation. Finishing celebrates the practice, with a return to the actual lesson and a resettable replay; official mission completion still comes from its existing quiz.

## Content basis and limits

The community case is grounded in the existing Life in the Barangay lesson and its explicitly fictional model. Maritime/contact claims were checked against the [National Museum's account of archaeological maritime evidence](https://www.nationalmuseum.gov.ph/2022/09/20/the-9th-to-10th-century-archaeological-evidence-of-maritime-relations-between-the-philippines-and-the-islands-of-southeast-asia/). The [Butuan archaeological site description](https://whc.unesco.org/en/tentativelists/2071/) provides further source context. Drawings are original teaching illustrations, not archaeological records. No new dates, exact reconstructions, or universal community practices were fabricated. Independent teacher/content review and Grade 5 comprehension testing remain pending.

## Verification

Four policy/content tests check mission mappings, complete authored activity content, answer types, matching owned progress, unchanged evidence, completed growth and unavailable catalog states. The dedicated isolated Chrome fixture exercises all three cases, wrong/correct conclusions, wrong/correct comparisons, supported/unsupported Bayani explanations, reset, denied access/retry, late access after sign-out, community growth, hostile artifact text, mission links and dialog focus. Exact 390px and 1440px layouts pass without horizontal overflow. Existing My Journey and collection fixtures also pass. Full-completion UI data in these fixtures is synthetic; no learner progress or curriculum documents were changed.

These features are locally packaged website changes, not a hosted deployment or evidence of learning effectiveness.

Final regression: **318 checks across 51 suites, zero failures/skips, and all 15 browser fixtures passed**. The fresh package at `build/student-web-eN1Qe6/public` contains 26 pages and 536 hash-verified files, with zero missing or rejected references. Restart an already running local preview with `node tools/serve-student-web.cjs` to select this latest package. The pre-existing whitespace-only finding in the unrelated Bayani-review link line of my-journey.js was left untouched.
