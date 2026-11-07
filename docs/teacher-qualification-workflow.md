# Teacher qualifications and account eligibility

The qualification workflow is implemented on `pages/teacher-application.html` and the administrator's **Review Submitted Applications** queue. The current preview uses the real application and original student progression. Independent student access does not require school/class membership.

## Applicant flow

1. Register/sign in as a teacher applicant. Registration grants no classroom access.
2. Send the verification email from the application page, open the inbox link, then choose **Check Email Status**. Checking email status preserves unsaved form entries. Firebase Auth's verified-email token is required to submit; a client-supplied boolean alone is rejected.
3. Provide a credential name, institution, locality, role and short teaching/support statement. Official institution website and work email are optional leads, not proof by themselves.
4. Choose **Licensed teacher**, with PRC registration number and declared current expiry, or **Student teacher / Learning facilitator**, with an endorsing supervisor and work contact. The latter routes are separately labelled and do not represent professional licensure.
5. Optionally provide one redacted JPG/PNG evidence image up to 250 KB when useful/requested: school ID, employment certification or signed endorsement. No student records, passwords or unnecessary government-ID details should be uploaded. The app does not automatically redact image content or metadata.
6. Acknowledge the stated qualification-data purpose, then submit. Drafts may be saved first. Follow the pending/revision/declined/approved status and applicant-facing reason. Correct and resubmit when needed.

Every saved revision advances a version number. Saving changes to an approved application pauses classroom access until that new revision is approved. Existing classes and learner progress remain saved. Previously active teacher accounts also need this qualification review; old `status: active` flags do not bypass it.

## Administrator review

Use **Review Submitted Applications** to include both new applicants and previously active teachers seeking verification. Inspect the submitted details and private evidence. The official [PRC verification service](https://verification.prc.gov.ph/Verification) supports credential checking; it is opened manually, not scraped or called by an automated approval service.

Approval requires recorded identity ownership and independent institutional-affiliation checks, plus the route-specific PRC or supervisor-endorsement check. Record the independently checked source/method and result. Applicant-provided websites, contacts, work email and documents are leads; do not treat them alone as independent confirmation. PRC registration supports professional qualification, not current employment or ownership of an account.

Administrators can approve, request changes or decline, with a reason visible to the applicant. Detailed verification references stay in administrator-only review records. A stale revision/profile cannot be approved. The application decision, account eligibility fields, immutable review record and account audit record are required together by rules. Evidence deletion is also part of that transaction.

This is a human qualification-review system. It does not certify documents as genuine, perform live PRC checks automatically, or claim DepEd accreditation.

## Privacy and evidence retention

- `teacherApplications/{uid}` is readable only by its applicant and active administrators. It is separate from student-facing profiles and class rosters.
- `teacherEvidence/{uid}` contains the private bounded image. There are no public Storage download tokens/URLs; the viewer uses a temporary local blob URL and clears it when closed or signed out.
- Rules deny evidence reads after 30 days, including administrator reads. Every review decision deletes the attached image. Applicants can remove/replace evidence, and expired evidence is deleted when the corresponding applicant/admin view encounters it.
- For unattended physical deletion of expired, never-reopened uploads, an operator must schedule `node functions/cleanup-teacher-evidence.cjs --purge-expired`. The default/`--inspect` mode is a metadata-only dry run. Purges are capped at 400, check expiry/document ownership, and use update-time preconditions; application/profile/review data are not deleted. **No background scheduler was configured or claimed.** Access expiry is enforced even before a maintenance run.
- Qualification text and immutable decision records have no invented legal retention period; their long-term handling belongs to the actual operator's account-data policy. That remains a rollout arrangement, not a claim of a finalized privacy policy. This implements purpose limitation, private access, bounded evidence and minimization measures rather than asserting legal compliance. See [NPC privacy principles](https://privacy.gov.ph/implementing-rules-regulations-data-privacy-act-of-2012/).

Evidence uses the existing private Firestore setup, with no new file-storage service, paid identity provider, billing upgrade or email-notification service. Verification emails are sent only when the applicant requests them.

## Validation and publication

- [46 rules checks](validation/teacher-qualification-rules-2026-10-31.json): verified-email enforcement, no self-approval, private evidence, expiry, file bounds, manual checkpoints, atomic review/profile/audit pairing, stale revisions, distinct endorsed roles and legacy-access denial.
- [57 teacher regressions](validation/qualification-teacher-regression-2026-10-31.json), [44 administrator regressions](validation/qualification-admin-regression-2026-10-31.json), and [416 student checks / 17 browser fixtures](validation/teacher-qualification-student-regression-2026-10-31.json) pass.
- [Applicant browser](validation/teacher-qualification-browser-2026-10-31.json): 16 checks each at 390px and 1280px; [admin browser](validation/admin-workspace-browser-2026-10-31.json): 21 checks at each width, including actual qualification review and submitted queue. Unit checks additionally cover input/review/file policy and registration/role guards.
- The [initial permission publication](validation/teacher-qualification-initial-publication-2026-10-31.json) adds the qualification scopes. The [final readback](validation/teacher-qualification-publication-2026-10-31.json) strengthens the single cross-record pairing helper. Both have source hashes and backups. No existing account document was changed by rule publication.
- [Hosted qualification acceptance](validation/teacher-qualification-live-2026-10-31.json) exercises the real form, revision request, resubmission, private image viewer, approval, deletion and classroom access with temporary identities. Email verification is set through trusted Auth administration **for those synthetic identities only**; no actual verification email is sent, and PRC/institution references are explicitly synthetic. Cleanup is recorded. Real-inbox delivery and actual human credential verification remain separate acceptance steps.

The latest reviewed package and preview publication are recorded in [current release status](website-release-current.md). Main-channel deployment and broad learner rollout remain separate decisions.

November 5 simplification candidate: `school_teacher` adds school-affiliation review without collecting PRC/endorsement details by default. Full name, institution and role are the three required profile fields; email verification and recorded administrator identity/affiliation checks remain mandatory. Location, statement and extra contact/evidence details are optional. Licensed/student-teacher/facilitator routes retain their route-specific checks. This update is prepared and tested but is not yet activated in real Firebase; see `teacher-application-simplification-2026-11-05.md` for status and exact validation.
