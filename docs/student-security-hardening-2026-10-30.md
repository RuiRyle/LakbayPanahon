# Student security hardening — 30 October 2026

This pass addressed confirmed URL-access and saved-result weaknesses in the existing free-plan student website. It does not certify the application as cheat-proof or replace a broader independent security review.

## Fixed behavior

- The page guard authorizes against `getDocFromServer`. Cached active profiles cannot unlock pages while offline. Settings no longer reveals protected content when account verification fails. Failed sign-out, inactive/missing profiles, wrong roles, late auth notifications and competing reads stay locked.
- Page departure locks and makes protected content inert. A restored page checks the account again before revealing it. The browser fixture exercises synthetic lifecycle events; a real browser-history/bfcache round trip was not performed in this pass.
- Learning entry checks use fresh server documents and queries, validate URL identifiers, reject missing catalog rows or malformed ordering, and abort if the authenticated account changes during the checks. Owned progress and normal prerequisites still govern ordinary navigation. The user's temporary localhost exploration preview is preserved.
- Quiz replay no longer returns an arbitrary saved `response` map. It checks the saved outcome against freshly graded answers and matching completion evidence, then rebuilds display/reward/catalog output from current records. A forged failed-attempt response can no longer display a false pass and reward through that replay path. Changed question keys or inconsistent legacy responses require a fresh retry; earned records are not erased.
- Firestore attempt rules bind response score, correctness, pass status and review topics to the recorded attempt. First-completion reward claims require matching newly saved progress; reward amounts must match the mission catalog. This is consistency validation, not independent grading.
- Draft writes require active, ready parent content and an explicit owner match for updates. Practice writes require a matching active mission/chapter, a ready chapter, 1–200 results and bounded review topics. Rules do not independently grade every practice result.

The student shell's existing same-origin, same-directory page allowlist already rejected external URLs, unsupported pages and encoded path attacks. Adversarial tests were added without changing valid route normalization. Inspected profile, lesson, chapter, mission and Bayani render paths retained their escaping/text-node behavior; hostile-content regressions passed without a confirmed new DOM injection vulnerability.

## Verification and publication

- **92 local checks passed** across authorization, route restrictions, learning access/order, replay/rewards, draft recovery, profile field limits and public-release file boundaries. Command: `node --test --test-isolation=none tests/student-auth-guard.test.cjs tests/student-shell-route.test.cjs tests/exploration-preview.test.cjs tests/student-journey.test.cjs tests/era-progression.test.cjs tests/mission-flow.test.cjs tests/learning-draft.test.cjs tests/student-profile.test.cjs tests/web-release-boundary.test.cjs`.
- **Six offline Chrome fixtures passed**: guard, Bayani, profile, chapters, missions and story. Firebase was mocked. Hostile HTML, markdown, identifiers, route parameters and image schemes were included; this is bounded regression coverage.
- The actual Firebase Rules API compiled the candidate with **zero issues and 32 successful synthetic allow/deny cases**. Document-service functions had explicit/fallback mocks, so the cases did not access student documents. See [verification](validation/student-security-rules-2026-10-30.json) and `functions/verify-student-security-rules.cjs`.
- A read-only comparison confirmed live/local rules matched outside the three reviewed draft/attempt/practice blocks. These blocks were **published to the original project and read back**, with a backup of the previous ruleset. See [comparison](validation/student-security-rules-comparison-2026-10-30.json), [publication](validation/student-security-rules-publication-2026-10-30.json), and backup `backups/student-security-rules-1793327097428.json`. The guarded publisher refuses unrelated changes or a mismatched verification report.
- The bounded live attempt ran the role/XP-denial requests, then hit **HTTP 429 / RESOURCE_EXHAUSTED while reading the first mission**, before quiz submission. Its temporary student profile and Auth account were removed successfully. The live normal reward transaction/replay acceptance remains **pending quota recovery**. Do not count the partial run as a completed live flow. Rerun only the scoped `node tests/live-mission-flow.cjs --security-only` after quota is available.
- Frontend fixes are local and usable through Live Server. No Hosting build was deployed. Rules publication does not publish JavaScript.

## Remaining trust boundaries

Typing a URL is not an authorization mechanism. Public static HTML/JavaScript can be fetched; Firebase Authentication and Firestore Rules must authorize data operations independently. See Firebase's [rules conditions](https://firebase.google.com/docs/firestore/security/rules-conditions).

The accepted Spark design still grades in the browser, makes answer keys readable to active students, and enforces arbitrary chapter/era/mission sequences in client code. A modified client can fabricate a self-consistent passing result or submit completion writes directly. A completion is not now bound to a unique attempt ID. Practice mastery and lesson-review evidence are also student-submitted. Daily rules constrain the date and reward, but do not enforce the browser's particular daily-bank selection. The fixes above do not remove these limitations.

Stronger anti-cheating requires trusted backend grading, private answer keys, server-enforced progression and submission/rate limits. No billing change, Cloud Functions deployment or paid Bayani activation was introduced. App Check enforcement across all student services and public-host security headers still require separate compatibility review. Firebase notes that [App Check reduces abuse without eliminating it](https://firebase.google.com/docs/app-check).

Publish only the reviewed public staging directory. Keep backups, source authoring data, scripts, server configuration and credentials out of a public web root. The existing release allowlist remains in place; it cannot prevent an independently configured web server from serving the repository root.
