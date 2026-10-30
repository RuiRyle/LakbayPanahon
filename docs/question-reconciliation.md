# Thirty-question feedback reconciliation

Prepared offline on 2026-10-28. No Firestore requests, writes or deployment.

All thirty nonmatching older feedback entries now have complete review sets in data/question-reconciliation-review.json. Ten exactly match the later roadmap question revision. Twenty retain the simpler scenario wording in the dated curriculum snapshot. Their answer keys match the earlier scenario drafts; none were changed. Each set preserves the question, all options, correct answer, explanations, learning point and associated metadata together. The bundle marks the older partial-feedback replay as superseded for these paths rather than mixing it with newer wording.

This resolves local authoring dispositions, not live publication state. The bundle is deliberately non-executable, has no writes array and retains teacher-review-pending status. It must not be treated as an approved migration or proof of current database contents. Older files and guards remain intact for provenance.

Rebuild with node functions/build-question-reconciliation.cjs. All 364 non-emulator checks passed, including full-question equality with the saved baseline, complete per-answer explanations and unchanged scenario answer keys.

Next: align the retained question sets with their intended lesson scenes, mapped review topics and adaptive practice. Then review remaining supplementary overlaps as coherent documents. Teacher/curriculum review and a bounded current-database comparison are required before preparing guarded publication changes. Authenticated walkthrough and Hosting deployment remain pending.
