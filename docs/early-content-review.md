# Early chapters and supplementary migration review

Offline review, 2026-10-28. Baseline: curriculum snapshot from 2026-10-27 at 21:06 Manila time. This is not current Firestore state. No authentication, network calls, migration execution or deployment occurred.

The snapshot contains the prologue and Chapters 1-4: 17 missions, 90 scenes and one quiz per mission, plus one challenge per chapter including the prologue. All blueprint topics checked have mapped lesson scenes. Scene count is not a measure of educational completeness: five scenes may be appropriate, and additional scenes alone do not establish curriculum coverage.

Image findings: 59 scene image paths in this dated snapshot do not exist locally. Forty-four have at least one newer authored image replacement that exists. Those candidates are listed without assuming any migration has been applied. Fifteen have no existing replacement in the inspected migration inputs:

- chapter3-mission1-scene4
- chapter3-mission2-scene3
- chapter3-mission2-scene4
- chapter3-mission3-scene1
- chapter3-mission3-scene3
- chapter3-mission4-scene3
- chapter3-mission4-scene4
- chapter4-mission1-scene1
- chapter4-mission1-scene4
- chapter4-mission2-scene3
- chapter4-mission2-scene4
- chapter4-mission3-scene2
- chapter4-mission3-scene3
- chapter4-mission4-scene2
- chapter4-mission4-scene4

These are local image gaps against a dated baseline, not verified production failures. The old story-image-manifest.json also lists absent files and is not a source of ready image assets. Runtime story code uses the scene imageUrl and has recovery handling; that does not supply an educational replacement image. Next visual work should inspect these 15 scenes and author appropriate teaching diagrams or a deliberate content decision, with guarded data changes. Do not attach arbitrary illustrations or silently substitute unrelated images.

Supplementary migration comparison found 32 curriculum-bearing inputs and 176 documents whose fields are touched by multiple inputs. Overlap is not automatically an error: older wording, feedback, enrichment and later lesson redesigns can intentionally touch the same fields. The machine-readable report identifies each field and owner. It compares each file independently with the dated snapshot; alphabetical input order is not publication order.

Examples requiring reconciliation before execution:

- roadmap-chapter34-migration.json mostly matches this snapshot but also contains creates absent from it and one create whose desired fields differ. Artifact and badge collections were not captured, so absence is not proof a create is safe.
- mission-quiz-flow-migration.json contains older creates and unguarded updates that do not all match the baseline. Do not replay it blindly over newer content.
- question-feedback-migration.json has 30 differing guards alongside 20 already matching writes; old feedback must not overwrite later wording.
- archaeology-pilot-migration.json and livelihood-learning-migration.json expect content different from this snapshot. They may depend on intermediate revisions; this comparison does not declare those plans invalid or safe to force.
- Scenario quiz inputs without local guards need their actual apply-script safeguards and later replacements reviewed. File names alone do not identify the current canonical revision.

Run node functions/audit-early-content-local.cjs to regenerate docs/validation/early-content-local.json. It checks field-level desired/expected comparisons, expected-absent fields, single-document pilot guards, overlaps, lesson mappings and local image candidates without applying edits. All 354 non-emulator checks passed, including deliberately stale guards and overlapping pilot tests. Passing tests means the audit behaves as checked, not that the reported gaps are resolved.

Scope limits: no badges/artifacts existed in the saved snapshot collections; current security rules, authenticated progression, rewards and live publication state are unverified. No historical or pedagogical certification is implied. Existing progression tests cover separate cases, but this report does not claim a complete live Chapters 1-14 walkthrough.

Next priorities:

1. Inspect and resolve the 15 remaining image gaps with scene-specific content.
2. Reconcile overlapping supplementary revisions into explicit per-document intended final fields and dependencies. Preserve existing guards and backups; do not overwrite or delete older inputs merely because they differ.
3. Complete teacher/curriculum review, especially repetition and concrete knowledge versus source-limit questions.
4. When Firestore is available, perform bounded live preflight to establish the actual next unpublished batch. Then use the guarded publication sequence and authenticated end-to-end verification.


## Follow-up: local image coverage (2026-10-28)

The 15 gaps listed above now have scene-specific local SVG teaching diagrams and a metadata-only guarded migration. The refreshed machine-readable report finds authored candidates for all 59 absent snapshot paths. The original findings remain a dated baseline; this does not establish production publication. See [image repairs](early-scene-image-repairs.md). Overlapping migration reconciliation remains pending.
