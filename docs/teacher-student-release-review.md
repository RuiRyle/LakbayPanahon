# Teacher/student workflow release review

Prepared 6 November 2026. **Local validation passed; not deployed.**

## Reviewable candidate

- Website: build/student-web-s3SJJb/public
- File inventory and hashes: build/student-web-s3SJJb/release-manifest.json
- Matching rules: build/student-web-s3SJJb/firestore.candidate.rules
- Test/source pairing: docs/validation/teacher-student-final-local-2026-11-06.json

The website contains 33 pages and 572 files, with zero missing/rejected references. Review materials, answer guides, source snapshots and data drafts are outside the public package.

## What passed

The actual SDK/browser emulator walkthrough passed 42 checks covering focused assignment, student review, explanation, private teacher guidance, later practice, qualified before/after comparison, history and account settings. Supporting checks cover lifecycle permissions and membership revocation, exact publication-state revisions, stale submissions, missing evidence, preserved drafts and ambiguous-write recovery. See the validation JSON for counts and scope.

The walkthrough uses synthetic saved quiz scores to exercise the relationship between records and screens. It does not test trusted answer grading or establish learning effectiveness. Expected browser ViewTransition cancellation diagnostics occurred; unexpected application exceptions are rejected by the walkthrough and none were found.

## Release sequence to review before publication

1. Verify the intended Firebase project and Hosting target. Confirm the candidate manifest/rules hashes still match the reviewed source. A later code change requires a new candidate and relevant validation.
2. Preserve the currently deployed frontend and rules for recovery. Do not delete classroom, review, reflection or progress records.
3. Publish the reviewed compatible rules before activating the new frontend, as one planned release. New student active/closed/withdrawn queries and publication-state writes require those rules. The added rules retain older published-activity access; this is not permission to leave old teacher clients in use indefinitely.
4. Activate the matching website and require a reload of older open teacher sessions. The publication revision coordinates updated clients; older/direct API clients can bypass that protocol.
5. Perform a small explicitly authorized live smoke test: verified approved teacher login; owned class access; unique invitation and intended-class membership; targeted review; private student explanation; teacher guidance; independent follow-up; visibility/access after ending or leaving. Use designated acceptance accounts and keep their results separate from research data.
6. Check page loading, read failures and saved status from both roles. Verify current production catalog mappings/content rather than assuming the dated offline snapshot is identical.

No commands in this document have been executed against production. The production project, current rules/Hosting state, live quota and live account availability have not been re-audited in this pass.

## Recovery considerations

If the frontend must be rolled back, preserve compatible rules while newer open clients may still query ended activity states or use publication-state records. Do not blindly restore older rules first; that can break active new clients. Review security implications of any rules rollback separately. No schema deletion is required to revert the UI; the coordination records contain no student score/content.

## Still separate

- Qualified-teacher content review and supervised student usability/learning evaluation.
- Validation of the draft three-concept retention/application pilot; it is not an all-mission instrument.
- Trusted backend grading before treating browser practice scores as dependable formal assessments.
- Live Firebase/Hosting acceptance and release approval. Local test success is not a claim that these have happened.

## Publication update - 6 November 2026

The reviewed build was published to https://lakbaypanahon-1797e.web.app with its matching rules at 2026-11-06T05:17:22.423Z. The earlier sections record the pre-release plan and local validation. Live rule hash and five page routes matched the candidate after publication. An isolated public login browser check passed with no sign-in or learner writes. Logged-in teacher/student acceptance and email delivery remain unverified. See validation/teacher-student-production-release-2026-11-06.json for the released ruleset and backup location.
