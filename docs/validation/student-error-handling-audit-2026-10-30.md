# Student error-handling and logic audit — 30 October 2026

Completed a local audit of student save/retry behavior, optional browser storage, session changes, class membership, instructional cache recovery and Bayani configuration. Also ran the fixed student acceptance suite across authentication, navigation, lessons, quiz/review, rewards, collections, profile, class and settings flows. This is scoped regression evidence, not a claim that every possible defect or security attack has been excluded.

## Confirmed defects and fixes

| Trigger | Previous outcome | Corrected behavior |
| --- | --- | --- |
| Browser denies session storage, or a storage operation throws | Quiz initialization/retry could fail; cleanup after a saved result could throw | Optional tab-storage operations safely fail. Quiz restoration passes the saved question set directly from the Firestore draft and validates it against the active bank. Loading, answer restoration, retry and reward replay pass with storage denied. |
| Practice write fails or its acknowledgement is lost | Any existing same-owner record could be accepted, including different results; the confirming read could use cache | Recovery reads from the server and compares chapter, mission, question results, counts and review topics. Cached/pending or mismatched records retain the retry state and answers. Matching acknowledged records recover without duplicate completion. |
| Class membership exists but is inactive or mismatched | Join reported already joined, despite the membership being unusable | Only matching active membership returns that result; otherwise the student gets an explanation directing them to their teacher. |
| Invite expiry has malformed data | TypeError or invalid date could escape validation | Invalid/expired expiry values produce a fixed unavailable-code message before a membership write. |
| Account changes while the membership transaction is reading | The callback could enqueue an old-account membership write | Identity is checked after the read and again after the transaction. The reproduction confirms no write is enqueued after the account switch. Firestore rules remain the server authority. |
| Cached catalog contains null/invalid rows | Cache validation could crash instead of loading content | Invalid rows are discarded and replaced by a fresh catalog read. Normal cache reuse and expiry remain tested. |
| Bayani enabled setting is the string `false` | Truthiness could initialize an enabled connection | Only the boolean `true` enables the connection. |
| Browser denies access to Bayani's optional debug preference | The preference lookup could block connection setup | Storage failure leaves debug opt-in off and proceeds to ordinary App Check. |

## Verification

- New negative cases reproduced the relevant failures before fixes.
- Final command: `node functions/verify-student-acceptance-local.cjs --browser`.
- **296 checks across 45 suites passed; 13 mocked Chrome fixtures passed; zero failures/skips.** Current source hashes and fixture outcomes are in [the acceptance report](student-acceptance-local.json).
- The quiz storage-denied fixture is now part of the fixed plan. The practice browser fixture exercises conflicting server data, offline confirmation, retained answers and a successful lost-acknowledgement retry.
- Every script in `js/` passed `node --check`; changed files passed whitespace validation.
- One older practice unit fixture initially failed because it still mocked the removed cache-capable confirmation API. It now supplies a server snapshot and uses the actual canonical comparison helper; final combined checks pass.

## Operational scope

No Firebase reads/writes, emulator, rules publication, billing change or Hosting deployment were used in this audit. Curriculum and authored settings remain in Firestore. Normal practice saves do not gain extra reads; only failed-save confirmation now requires the server. Browser caches remain optional and do not authorize access or award rewards.

The changes are available through the local website. Any previously staged public package predates these fixes and must be regenerated before deployment. Actual hosted/Auth/App Check behavior and real network-disconnect/reconnect acceptance remain pending. Browser grading still has its documented trust limits; the prepared trusted backend remains inactive. Preserve the user's exploration preview and the separate learning/privacy review gates.
