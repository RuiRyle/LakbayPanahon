# Student access and privacy audit

29 October 2026. Bounded source review and local mocked tests. This is not a complete security signoff, a current deployed-rules evaluation or legal approval. No live Firebase calls, emulator, rules changes, deployment, provider switch or billing change occurred in this work.

## Fixed in the local frontend

**Ignored Remember me control.** Login exposed the choice but did not apply Firebase persistence. `js/auth-ui.js` now awaits `setPersistence` before authentication: unchecked uses `browserSessionPersistence`, checked uses `browserLocalPersistence`. Student registration defaults to a tab session; the shared registration implementation also uses that safe default. A persistence failure stops authentication/account creation, preserves inputs and allows retry. Login now prevents a second submission while the persistence request is pending. Login and registration explain the shared-device choice.

Firebase documents the durable browser default and awaiting persistence changes before sign-in in its [authentication persistence guidance](https://firebase.google.com/docs/auth/web/auth-state-persistence). This change applies when the updated login/registration flow runs. It does not remotely revoke previously remembered sessions; explicit Log Out remains important on shared computers.

**Leftover tab-local state.** `js/logout.js` now removes the departing UID's quiz attempt keys, selected question IDs, exploration-preview drafts and instructional cache entries using `js/student-session-storage.js`. It also observes account changes so the previous account's keys are cleaned when that page sees an identity change. Saved Firestore progress/drafts/rewards, another account's keys, Firebase-managed authentication storage and browser sound/display preferences are not deleted by this helper. Storage failures do not prevent sign-out. Failed sign-out restores the original button contents and permits retry; a pending logout blocks duplicate submissions.

## Source review findings

| Area | Existing protection observed | Scope and limits |
| --- | --- | --- |
| Identity and roles | `users/{uid}` reads are owner-only; create/update fields and role/status transitions are constrained. | Browser guards are interface controls; the rules remain the data boundary. No role-escalation bypass found in this review. |
| Learning records, drafts and journal | Sensitive record queries require the owner; deterministic IDs and validated owner fields constrain writes. Journal entries are removable by their owner. | No cross-account bypass demonstrated. Arbitrary browser-submitted activity state is not proof of learning. |
| Rewards | Paired completion/profile writes, configured reward amounts and persistent completion records constrain duplicate XP. | Honest multi-question grading and complete prerequisite order cannot be established by the current browser-only assessment. Existing accepted limit remains. |
| Classes | Students read their own membership and member-accessible class information/published assignments. They cannot publish classes or assignments. | A class code is a join credential; there is no trusted invitation rate limiter in this implementation. Teacher workflow was not added or certified. |
| Practice and review evidence | Owner-only, append-only records; no practice XP award. | Review rules validate the first mapped scene, as already documented. Practice relationship/nested-result bounds could be tightened later. Neither is a demonstrated cross-account exposure. |
| Bayani | Local history clears on New Chat/account/page exit; the client sends the typed question and conversation, rather than automatically loading the profile and scores. | A child can still type personal information. Local clearing does not establish provider deletion. Current provider suitability remains unresolved. |

No Firestore rule mutation was justified by a confirmed cross-account or role-escalation exploit during this bounded review. This is not a claim that all attacks have been ruled out. Earlier deployed-rule/live ownership checks remain dated evidence; they were not rerun here.

## Remaining privacy work

Registration currently requires a checkbox naming Terms and Privacy Policy, but those documents are not linked or available as completed product pages. Do not treat the checkbox as proof that a child or guardian received a valid notice or supplied the appropriate authorization. Policy-version/acknowledgment fields are not stored. Do not add an invented acceptance version while the actual notice is unresolved.

There is no completed account-data assistance/deletion workflow in the inspected frontend. Deleting Firebase Authentication alone would leave linked Firestore records. The intended process must identify the account, cover its profile, results, attempts, practice, review events, drafts, journal entries and class memberships, and specify how requests are verified, handled and communicated. No account deletion or automatic purge was introduced here.

The operator name, real privacy/support contact, retention periods and school/guardian arrangements are not established by the code. On 30 October 2026 the user confirmed these are **undecided**; no values are assumed. The unpublished [privacy notice draft](drafts/student-privacy-notice.md) and [student use guide](drafts/student-use-guide.md) are review material, not public policy or an AI safety approval. Product links should point to finalized, accessible notices once the details are agreed.

The National Privacy Commission's [child-oriented transparency guidance](https://privacy.gov.ph/wp-content/uploads/2024/12/Advisory-2024.12.17-Guidelines-on-Child-Oriented-Transparency-w-SGD.pdf) informs the proposed readable summary and adult details. It does not establish this project's compliance. The operator must resolve the appropriate legal basis and review the intended processing arrangements before learner rollout.

## Local verification

- `node tests/student-auth-persistence.test.cjs`: five checks passed for persistence selection/order, pending-submit prevention, safe failures, retry and registration default.
- `node tests/student-session-storage.test.cjs`: five checks passed for owner-scoped cleanup, inaccessible storage, successful/failed/duplicate logout, button restoration and account changes.
- `node tests/student-registration-browser.cjs`: mocked Chrome check passed for registration/profile retry and lost-acknowledgment recovery after updating the SDK mock. No real account was created.
- Module syntax checks passed for the edited authentication/logout helpers.
- Release inventory: 20 entry pages, 423 files, zero missing or rejected static references. The older 412-file staging package remains stale.

These tests verify client behavior. They do not evaluate Firestore authorization or real Firebase persistence across browser restarts. Frontend changes require the normal website release process.

## Account & Data Help preparation — 30 October 2026

Settings now includes a factual help section with links to existing profile editing, the Evidence Journal, and My Class. Its expandable answers explain saved account/learning information, logout, and browser preference reset. Section shortcuts move focus and leave space below the sticky header. No new script, data collection, Firestore read, contact address or request-submission endpoint was added.

Account-copy and deletion requests are explicitly unavailable until a support contact and handling process are established. The page does not collect a request, imply that one has been sent, link the unpublished notices as policy, or promise deletion or retention periods. It suggests help from a parent/guardian and the adult who introduced the learner to the app. This help surface does not complete the privacy release item.

Local verification used an offline Chrome fixture with Firebase scripts removed and external content blocked. Section focus/scroll clearance, disclosure opening/closing and retained focus, local link/fragment targets, help-text contrast and horizontal overflow checks passed at 1440px and 1280px with extra-large reading text. Desktop, enlarged-text and Settings-header screenshots were inspected. These checks do not exercise live profile changes, class leaving, journal removal or account deletion; the links use their existing flows. No live Firebase calls or deployment occurred.
