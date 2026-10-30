# Mission 1 adaptive question bank draft

This was the initial Mission 1 pilot. Project-wide coverage and the other mission drafts are documented in [`adaptive-question-bank-project-review.md`](adaptive-question-bank-project-review.md).

## Purpose

Prepare additional difficulty variants for Mission 1's existing adaptive quiz. The local manifest remains a draft, but its ten question documents were published to Firestore with `status: active` on 2026-10-30 and can be selected by learners.

## Existing quiz structure

The content snapshot dated 2026-10-27 records a five-question quiz with one question in each of five topic slots: `datu-leadership`, `barangay-community`, `community-cooperation`, `social-organization`, and `community-customs`. The current bank has two medium variants for each topic. The quiz's existing question count, topic quotas, and passing score are unchanged.

## Proposed additions

The companion file [`mission1-adaptive-quiz-question-drafts.json`](../../data/mission1-adaptive-quiz-question-drafts.json) contains ten proposed items: one `easy` and one `hard` variant for each existing topic. Each item is marked `status: draft`, with four answer choices, an answer key, a general explanation, a short learning point, and choice-specific feedback.

The additional difficulty variants give the adaptive selector more choices for each topic. They do not lengthen an attempt or change the topic blueprint. The scenarios are fictional and should still receive an educator's content review.

## Teacher review before publication

Please review each draft for:

- age-appropriate Grade 5 reading level and clear wording;
- one defensible correct answer and plausible, fair distractors;
- alignment between its topic and difficulty tags and the skill it assesses;
- accurate, respectful wording about community variation and historical limits;
- explanations that help learners understand why each option is or is not supported.

The scenarios are explicitly fictional and are intended to assess the lesson concepts, not to assert details about a specific historical community. The lesson source material and local audit do not by themselves establish historical accuracy or classroom readiness.

## Publication gate

The local payload remains marked `draft` as the source manifest. Its active Firestore copies were included in the project-wide publication; the backup and verification record are linked from the project review.
