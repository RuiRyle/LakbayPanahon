# Secured chapter loading and progression — 11 November 2026

Confirmed and fixed production compatibility defect: chapter-challenge.js read chapterChallengeQuestions directly before trusted issuance, which conflicts with the published private-bank rules. It now renders backend-issued questions without a browser answer-bank read. Chapter pass/fail is determined from the trusted submission result; a local score cannot prevent a valid passing result from being submitted.

Matching public questions contain left items and independently sorted right choices, not correct pairings. Trade public questions contain the inventory/reward presentation fields but omit requiredQuantity. Pre-result scoring/positive answer sounds are not calculated in the secured browser path. Completed review can contain feedback. Retry after failure requests a new server attempt; save retry reuses the confirmed receipt when available.

Validation: secured chapter browser fixture denies direct private-bank reads, strips grading fields, and passes matching/trading/multiple-choice interactions, restart, save retry, badge-record uniqueness and session recovery. Legacy UI fixture and chapter continuation fixture pass. Nineteen focused backend/progression/reward tests pass, including a new playable-but-answer-free chapter issuance test. Mission browser/replay checks passed earlier in this session.

Limitations: browser fixture transports are synthetic, not a new signed-in hosted chapter acceptance. The matching Render deployment and frontend must both update before hosted game verification. No Firestore policy or student data changed in this step.
