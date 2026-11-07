# Review learning stages

Updated 6 November 2026.

Personal reviews show three independent steps: Practice result, Student explanation, and Teacher guidance. A fresh passing result completes the practice goal only. It does not claim that an explanation was shared, that guidance was sent, or that the student has mastered the topic.

Teachers see these stages in review outcomes and review reports, with a direct link to respond to a shared explanation. Students open Review learning steps to check their own explanation and guidance. Checks are on demand; no polling or automatic per-card reflection reads run. Failed explanation reads show unavailable while preserving the known practice result.

Revising a student explanation resets guidance to awaiting teacher guidance, because the previous response addressed the earlier explanation. Reviews without a configured explanation prompt label those steps Not requested. Closed and withdrawn activities retain their historical read-only behavior.

The stages are derived from existing attempt and reflection records. They add no stored attributes, XP, grades, unlock conditions, or teacher approval gate to independent learning. Student activity summaries explicitly describe practice/activity goals rather than claiming the entire review conversation is complete.

## Validation

- teacher-class-policy.test.cjs: independent stage derivation, revision, unavailable reads and legacy prompts.
- teacher-review-learning-stages.cjs: actual modules with mocked Firestore at mobile and desktop widths; report columns and response links.
- student-classroom-hub-design.cjs: student layout and saved-stage synchronization.
- class-review-emulator.cjs: explanation revision clears the previous teacher response under local rules.
- class-teaching-browser.cjs: actual local SDK teacher/student walkthrough, independent checks and teacher guidance.

These checks passed locally. No production deployment or production learner records were changed. The earlier activity-lifecycle frontend and rules changes still require coordinated publication.
