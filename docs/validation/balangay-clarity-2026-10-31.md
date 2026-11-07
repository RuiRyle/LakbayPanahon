# First mission content-quality revision — 31 October 2026

**Publication follow-up:** This revision is now published through the aggregate 206-document update and verified by [readback](all-mission-learning-publication-2026-10-31.json). The initial quota-blocked preparation and standalone handoff below are historical; use the current aggregate publisher for comparisons.

**Original preparation note:** The fresh read-only curriculum audit succeeded. The subsequent live comparison was blocked by Firestore HTTP 429 RESOURCE_EXHAUSTED, “Quota exceeded.” A single diagnostic read confirmed that response. No commit was attempted, no curriculum/learner records changed, and billing was not changed. Do not describe the revised text as visible in the main mission yet.

## Audit across the current curriculum

The published snapshot contains 66 active missions, 388 scenes, 1,320 main question records and 687 practice records. The editorial triage flagged 650 generic question stems, 1,554 records with identical feedback for all three wrong options, and 162 paragraphs exceeding 70 words. No quiz-blueprint topic lacks a scene topic label. These counts locate material for review; they do not prove that every flagged item is poor or that a mapped topic is adequately taught. They are not reading-age or learning-outcome measures.

The audit reads the current published snapshot directly, rather than silently combining older authoring drafts. `learning-clarity-published-2026-10-31.json` is the before report; `learning-clarity-candidate-2026-10-31.json` adds only this reviewed candidate.

The fresh source is retained separately as `learning-content-snapshot-2026-10-31.json`. The historical `learning-content-snapshot.json` remains unchanged for existing migration/test fixtures. The new builder, validator and audit use the fresh dated source explicitly.

## First revised mission: Seafaring and the Balangay

Chapter 3, Mission 1 is the first complete example, as proposed in the conversation. Its five existing topics remain in place. The revision updates **36 existing records**: one mission, five scenes, twenty main questions and ten practice questions.

- One guiding question: **What can boat evidence tell us about life and travel?**
- Three clear objectives connect waterways/conditions, construction/evidence, and heritage care.
- Each scene opens with a question, explains a small idea, defines necessary terms, gives an example and states a limit.
- Main reading decreases from 655 to 428 words across the five scenes. Revised scene bodies contain 80–89 words, in paragraphs of at most 40 words. Clues and optional help remain separate from these counts.
- All thirty question prompts are distinct within their topic variants. Concrete scenarios replace generic “Which choice best matches the lesson's main idea?” prompts. Distractors address identifiable misunderstandings.
- Every answer option has its own feedback. For example, confusing a binding with a dowel receives feedback about those different roles rather than a repeated paragraph about boatbuilding.
- Easy practice begins with identifying a term or observation; harder practice asks students to interpret a new example and recognise limits. Existing difficulty labels and progression policy remain unchanged; editorial difficulty is not empirically calibrated.
- The recap explicitly answers what was discovered, why it matters, and how evidence supports the explanation.

## Lesson–assessment alignment

| Topic | Teaching focus | Transfer/check | Existing coverage preserved |
| --- | --- | --- | --- |
| island-waterways | Routes can connect inland, coastal and island places | Explain a new inland-to-coast example without inventing a foreign destination | 4 main variants, 2 practice |
| balangay-evidence | Original remains differ from a modern model | Limit a claim when passenger names are absent | 4 main variants, 2 practice |
| boatbuilding-skills | A: dowelled plank edges; B: frame bound to a lug | Recognise that a new find must be examined rather than forced to match a model | 4 main variants, 2 practice |
| seafaring-knowledge | Conditions and boat suitability affect planning | Reconsider a familiar route when conditions change | 4 main variants, 2 practice |
| protecting-boat-heritage | A find's context and specialist care matter | Explain why a photograph does not justify moving a possible find | 4 main variants, 2 practice |

The existing route activity, scene decisions, topic mappings, question IDs, correct-answer letters, passing rules, reward values, review-evidence policies and learner completion records are not edited. Existing draft versioning may restart affected unfinished lessons/quizzes after publication because their teaching/question text changes. Previously saved achievements are unaffected. No new recorded narration was generated; changed passages use existing text-matching voice fallback rather than playing an unrelated recording.

## Source basis

Checked the National Museum's [heritage/Butuan fieldwork account](https://www.nationalmuseum.gov.ph/2022/10/24/preserving-our-heritage-towards-the-future-of-our-museums/) and [maritime evidence account](https://www.nationalmuseum.gov.ph/2022/09/20/the-9th-to-10th-century-archaeological-evidence-of-maritime-relations-between-the-philippines-and-the-islands-of-southeast-asia/). Technical joining distinctions were cross-checked against Lacsina's primary archaeological study, [The Butuan Boats of the Philippines](https://www.aima-underwater.org.au/app/download/files/get/aima39.pdf). Teaching diagrams are simplified examples, not original artifacts, full reconstructions or real-world boatbuilding/travel instructions. Two older references returned unavailable responses during this review; the revision cites the accessible supporting sources instead. This is authored editorial review, not independent historical or teacher approval.

## Checks and publication handoff

Five new tests cover the publication allowlist, rejection of reward/grading/route changes, stale baseline rejection, idempotent readback, short teaching chunks, vocabulary, distinct questions, option-specific feedback and retained topic coverage. The real story UI fixture also checks all five candidate scenes, their worked examples, vocabulary and existing decision answers using simulated data.

Offline checks:

```powershell
node functions/apply-balangay-clarity.cjs --check-local
node --test --test-isolation=none tests/balangay-clarity.test.cjs
```

After Firestore access is available again, compare first:

```powershell
node functions/apply-balangay-clarity.cjs --dry-run-live
```

Only if the guarded comparison succeeds, `node functions/apply-balangay-clarity.cjs --apply` performs one atomic, field-scoped commit with update-time preconditions, a complete backup and exact readback. A changed baseline stops publication for review. No paid upgrade or website deployment is part of this step.

## Next review, one mission at a time

Continue with Chapter 3 Mission 2 (Trade Networks with Neighboring Asian Societies), then the remaining Chapter 3 missions before moving to the next chapter. Use the same questions: what should the student explain, where is it taught, which example supports it, what misconception does feedback address, and can the student apply it to a different example? Do not bulk-rewrite historical claims from generic templates.

Independent teacher/history review and supervised student explanation/application checks remain necessary. Record actual observations; do not infer learning effectiveness from these automated passes.

Final local regression: **323 checks across 52 suites, zero failures/skips; all 15 browser fixtures pass**. The focused story rendering check also passes after the final fixture edits. No frontend assets were changed, so the previous website package remains valid; new curriculum text is awaiting its separate Firestore publication. [Readable candidate lesson and feedback](../balangay-clarity-review.md).
