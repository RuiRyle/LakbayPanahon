# Chapters 2–4 offline learning review — 30 October 2026

Reviewed the local candidate assembled from the dated snapshot and explicit curriculum overlays. No Firebase, emulator, credential access or publication. The candidate includes the unpublished Chapter 2 family/women-role drafts and the new help draft below; it is not a claim about current Firestore.

## Results

The trace covers **3 chapters, 11 missions, 58 scenes and 55 quiz topics**. Every topic has a mapped teaching scene, sufficient main/retry variants, practice questions, a correct-answer reason and wrong-answer support. Main/retry feedback and review URLs are recorded per topic in [the current report](validation/chapters234-learning-review-local.json). These are field/link checks, not automatic semantic or historical approval.

The [before-help report](validation/chapters234-learning-review-before-help-local.json) found four scenes with no worked-help panel. They concern community leadership, customs, beliefs about nature and ritual purpose. Existing Chapter 3/4 editorial reviews remain relevant: [Chapter 3](chapter3-learning-review.md), [Chapter 4](chapter4-learning-review.md). Previously reviewed distractor/vocabulary corrections were preserved rather than reauthored.

## Four prepared corrections — unpublished

| Scene | Added support |
| --- | --- |
| `chap2-mission1-scene1` | Hearing both families; a made-up classroom sharing example; a question about missing information. |
| `chap2-mission1-scene4` | Asking about the local custom; a made-up classroom turn-taking comparison; avoiding claims that every community followed the same custom. |
| `chap2-mission2-scene2` | Identifying whose belief/source is described; a made-up reading example; avoiding claims that one explanation represents everyone. |
| `chap2-mission2-scene3` | Distinguishing actions from a ritual's stated purpose; a made-up story example; asking participants what the gathering means. |

Each adds only `learningHelp`: a simpler explanation, explicitly fictional worked example, guiding question and vocabulary. No body text, historical answer, choice, image, topic mapping, score, reward or progression field changes. The examples illustrate reasoning already present in the authored lessons; this was not a new independent historical-source review. Teacher/history review and actual Grade 5 comprehension remain pending.

Authoring: `data/chapter2-scene-help.content.json`. Guarded draft: `data/chapter2-scene-help-migration.json`. `node functions/prepare-chapter2-scene-help-local.cjs --check` verifies the draft against exact local scene identity/body/topic guards. Newly authored help or stale content stops comparison; exact already-applied help is recognized only after identity/content guards match. The tool has **no network/publication mode**. A future live publication procedure must compare exact current sources, back up and read back the four help fields; no such publication is claimed here.

## Reviewer packet

Open [the local adult reviewer packet](../build/student-review-9AkJ3m/chapters234-review.html). It shows the lesson/help, main/retry questions, practice hints, answer explanations and review-route parameters side by side for all 55 topics. It includes answer keys for adult review and is excluded from the website package. Its HTML uses escaped text and does not load Firebase or remote images/scripts. It is not a student handout, live content viewer or an approval.

Regenerate with `node functions/review-chapters234-local.cjs`. The command writes a fresh Git-ignored reviewer folder and updates the report; it never applies a migration. `functions/student-content-candidate-local.cjs` now shares the existing candidate assembly between this trace and the overall content audit. Before adding the four help drafts, extraction preserved the existing audit report byte-for-byte (SHA-256 `7a3e04a1c97f36fbc59aba5b6a95f00cfeefad0d545cc614036439fbc8df2277`).

## Verification

- **34 focused checks passed**, covering the four-scene scope, refusal of body/reward/answer edits, stale and newly authored-help guards, idempotence, offline-only flags and existing Chapter 2/roadmap content constraints. An initial subprocess-based flag check was replaced with the pure CLI parser check after sandbox process creation was unavailable; no network permission was added to that test.
- The core Story Chrome fixture passed and opened/closed all four actual draft help objects, including explanations, examples, guiding questions and vocabulary.
- The Chapter 3/4 fixture passed all **40 scenes**, clue exploration, correct decisions, help and recovery. The fixture's stale retry-button/menu setup was updated to the current interfaces, with bootstrap error reporting. Its first captures stayed RUNNING; error reporting identified the stale stub. Including unrelated full music scheduling then timed out; the final fixture runs only the real shared-menu initializer and completes. These were fixture changes, not a reported production-app fix.
- The candidate trace now has **zero structural errors and zero defined help/feedback review flags** after the draft overlay. This does not mean there are no educational concerns.
- The overall candidate audit still reports 66 missions, 388 scenes, 330 topic slots, zero missing local images, zero structural topic gaps and zero scene-choice issues. It includes unpublished overlays and does not establish current live metadata, artwork accuracy or curriculum completeness.

Runtime educational content continues to come from Firestore. No production learner code or public package changed in this pass. Preserve exploration preview and the fixed acceptance checklist; the new help is visible in the reviewer packet/test fixtures until reviewed and published.
