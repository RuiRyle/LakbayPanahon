# Student next-step recovery

Implemented locally on 2026-10-28. No Firestore calls, data migration or deployment.

Home and My Journey share student-journey.js. After a failed quiz, their recommended next action now opens a diagnosed topic's lesson before practice. It chooses a topic without saved lesson-revisit evidence first. If the remaining topics have lesson-revisit evidence, the action opens targeted practice with the current chapter, mission and topic. Missing optional review data or legacy string diagnoses default to lesson review, not an assumption of readiness.

Existing saved quiz and practice resume actions retain precedence. An empty verified remaining-topic list still offers a quiz retry, and chapter challenge/navigation behavior stays unchanged. Practice and retry remain optional secondary actions; this is guidance rather than a new mandatory gate or mastery award. The review timestamp/evidence comes from existing saved state; no new reads were added.

Validation: 373 non-emulator local checks passed. New checks exercise unvisited-topic priority, reviewed-topic practice, legacy diagnosis and unavailable optional evidence. The mocked-data My Journey Chrome test passed personal path, prerequisites, diagnosed lesson link, review/resume, safe text, loading retry and session recovery. This verifies local behavior, not current Firestore state or an authenticated production walkthrough.

Pending: code deployment and authenticated verification alongside the separately authored easy-practice migration. Teacher review remains pending. Next priority is checking the complete lesson-review to practice to quiz-retry handoff, including refresh and unavailable optional guidance.
