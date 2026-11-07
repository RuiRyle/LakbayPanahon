# Student web system runbook

**Current all-role release:** [Open the verified seven-day preview](https://lakbaypanahon-1797e--release-review-crwbjyeo.web.app), expiring 7 November 2026 at 23:55 Philippine time. [Release handoff](website-release-current.md): `build/student-web-yI6aWc/public`, 27 pages/558 files. Teacher qualification applications now require verified email and a recorded PRC/endorsement/affiliation review. Existing teacher accounts must complete that review before classroom access. Main-channel release remains separate; old packages/counts below retain their dated scope.

**Review fixes (31 October):** Testing-era registration/finale wording is corrected. Settings has an owner-scoped learning-data download; deletion remains explicitly pending a support process. Regression: 394 checks across 64 suites and all 17 browser fixtures, plus the final six focused download checks. Latest local package: `build/student-web-nosSZU/public` (26 pages, 543 files). [Scope, verification and limits](validation/student-review-fixes-2026-10-31.md). No deployment or learning-record changes.

**Student-flow decision (31 October):** The user explicitly retired exploration/testing mode. All student pages now use the original prerequisites and saved progression on every host, including localhost. The old mode setting is cleared and no testing bar or toggle is rendered. The latest reviewed local package is `build/student-web-QbDl12/public` (26 pages, 541 files). No website deployment.

Updated 31 October 2026. This project is a complete web system developed as a capstone for a potential buyer. The school, buyer and operator are not yet decided. Local preview is a development tool for the actual system; it does not replace completion or release acceptance.

## Open the project

Latest local package: `build/student-web-JCQKW3/public`, including the all-mission learning companions and the Achievements layout fixes. The no-argument launcher below selects it automatically. [Learning changes and verified database publication](validation/all-mission-learning-2026-10-31.md); [Achievements checks](validation/achievements-layout-2026-10-31.md).

From the project terminal:

```powershell
node tools/serve-student-web.cjs
```

Open the localhost address printed in the terminal. Keep the terminal running; use Ctrl+C to stop it. This serves the reviewed website package, including the playground, without exposing server code, documentation or secrets. It does not deploy anything. Firebase sign-in and lesson data still require internet access and the existing project configuration.

After changing website files, rebuild with `node functions/build-web-release-local.cjs --build`. Run the launcher with the new folder printed by that command, or omit its folder argument to select the newest package.

## Student workflow verification

All-mission learning: each mission/story has **Your Big Question** and why it matters. After a full lesson, open **Try a new example with Bayani (optional)**; all 66 missions have distinct authored applications and answer explanations. The recap also offers **Words and ideas to remember**. [Curriculum map](all-mission-learning-map.md) and [implementation/publication limits](validation/all-mission-learning-2026-10-31.md). The map is provisional, not DepEd certification. All 66 mission guides and all eight Chapter 3 and Chapter 4 deeper scene/question revisions are published and verified. See the [Chapter 4 review](validation/chapter4-learning-clarity-2026-10-31.md); The first Chapter 5 mission is now also [published and verified](validation/chapter5-mission1-learning-2026-10-31.md). All four Chapter 5 missions are now [published and verified](validation/chapter5-learning-2026-10-31.md). Historical normal-progression and recovery-tail evidence is linked there; the current wording has rendering and publication verification, not a new full signed-in learner run. Chapter 6 is next. The shared frontend needs no additional database permissions; ordinary sign-in and lesson access still use Firestore.

New discovery features: open Chapter 1's Life in the Barangay or Trade and Livelihood mission, then **Try a History Detective Case (optional)**. Chapter 3's Seafaring and the Balangay also has a case. Each includes clue investigation, Then and Now comparisons and Explain It to Bayani. In My Journey expand **Build Your Learning Community**; in Achievements open Artifacts and **Step Inside This Exhibit** on an earned collectible. [Feature scope and verification](validation/discovery-experiences-2026-10-31.md). These optional activities add no official progress or XP.

1. Register a test account or sign in. Show Home and its next learning action.
2. Open the first prologue mission. Explain its learning goal, read a short section, inspect a clue and complete its activity. Show Back/Continue and the centered enlarged image.
3. Refresh to demonstrate saved lesson progress. Finish the lesson and show its summary and quiz route.
4. Show a failed quiz, relevant lesson review and targeted practice. Retry and show the passing result, saved XP and next destination. Some questions may repeat when the adaptive difficulty bank has no unused equivalent.
5. Open My Journey, the journal/collections, profile and Settings. Explain narration and effects controls. Show the History Detective Lab as optional practice; it does not award mission progress.
6. Explain that saved recordings cover only part of the lessons. Other passages use device speech. Do not promise that the optional AI tutor will work without testing its current signed-in service separately.

Use the original saved-progression route. Exploration/testing mode is retired, including on localhost; old tab settings cannot reopen it. Existing live acceptance evidence used normal locks in an isolated account.

## Evidence and remaining review

The [real-account report](validation/student-capstone-flow-live-2026-10-31.json) passes the first prologue mission, failure/review/practice/retry, reload recovery and actual network reconnect. It confirms saved results and a next destination, not completion of every mission or chapter. Its temporary Auth account and nine owned records were removed. Exact 390px and 1440px checks found no horizontal overflow at the lesson recap and passing result. These are bounded automated checks, not a student usability study.

Before describing learning effectiveness in the capstone, ask an independent teacher/history reviewer to check factual accuracy, source use, vocabulary, objectives and assessment alignment. In a supervised session arranged through your adviser/school, ask intended learners to find the next action, explain one lesson in their own words and recover from a wrong answer without coaching. Record observed confusion, task completion and revisions; do not invent participant results or collect unnecessary identifying data.

Open limitations: teacher/content review and learner comprehension, partial recorded voice coverage, optional AI response/suitability, browser-based grading, and teacher-created class integration. Operator/contact/retention and actual hosted acceptance belong to a later public rollout decision. Keep these decisions pending without inventing a school, contact or retention policy. Resolve them before public rollout; continue completing and testing the actual system now.

The [full prologue follow-up](validation/student-full-chapter-2026-10-31.md) now also verifies all four missions, final challenge, reward replay protection, Chapter 1 continuation destination and logout/login persistence. It does not claim later-chapter completion.

New scope features: Sidebar ? Historical Timeline; My Class ? Class Announcements (published class messages only); My Journey ? review topic ? Practise with Bayani. Generated review depends on the existing AI service and is optional, ungraded practice. See [implementation and limits](validation/student-scope-features-2026-10-31.md).

Level rewards: Home ? View Level Rewards, or My Profile ? Make your progress yours. Titles advance automatically at milestone levels; earned frames can be equipped and are saved to the account. See [verification and milestones](validation/level-rewards-2026-10-31.md).

Lesson narration now uses the Bayani character control labeled Hear the story; tap again to stop. This applies to real mission reading scenes and the separate playground. It uses the existing recordings/device speech, not an AI chat request.

Era and mission pages now lead with a clear chapter choice or Start Lesson action, with extra descriptions/goals available on demand. See [simplification and verification](validation/simple-era-mission-2026-10-31.md).

Journey ending: open **My Journey → View My Journey Goal**, **Achievements → View My Journey Goal**, or **Open Journey Finale** after the last chapter challenge. The current finish line requires all 16 selected chapters and 66 missions. Before completion it shows remaining progress; afterward it offers Bayani's closing message, the Journey Complete badge, a discovery recap, optional local reflection, and a downloadable completion card. Replay never adds XP. See [the implementation and bounded verification](validation/journey-finale-2026-10-31.md). The finale is also reachable directly at `pages/journey-finale.html` after sign-in; direct access still checks saved progress.
