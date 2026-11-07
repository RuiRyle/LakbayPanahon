# Teacher workflow publication procedure

Prepared November 5, 2026. This document is a procedure, not evidence of activation.

## Reviewed state

- Project/site: `lakbaypanahon-1797e`.
- Website package: `build/student-web-XA9sUT/public` (31 pages, 568 files).
- Candidate rules SHA-256: `77e38891c0b631d568ce08be7dfb017f32dc4c27ae8f2303d768f0132f211a4b`.
- The live GET-only comparison at 01:11 Philippine time on November 5 matched the recorded baseline exactly. See `validation/teacher-workflow-live-rules-check-2026-11-05.json`. The candidate is not yet active.
- Candidate is limited to optional assignment deadlines, student-visible feedback, private teacher follow-up and controlled owner removal of active class memberships. Local rules evidence: 129 checks.

## Revalidate before activation

```powershell
node functions/prepare-teacher-workflow-release.cjs build/student-web-XA9sUT
node functions/teacher-workflow-rules-release.cjs --inspect
```

Stop if source/package hashes differ or the live baseline does not match. Do not run older rules publishers. The new command refuses mismatched candidate, staged rules or permission evidence.

## Activate reviewed rules when publication is authorized

```powershell
node functions/teacher-workflow-rules-release.cjs --publish-reviewed
```

The command checks the live source again, saves a backup outside public Hosting, creates the exact candidate, checks for a concurrent release change, activates it and reads the source back. It changes rules only; no learner, account, curriculum, Hosting or Functions writes are performed. Publication evidence is written to `validation/teacher-workflow-rules-publication-2026-11-05.json` only after successful activation/readback. A failure after activation requires inspecting the live state before any retry.

## Publish the reviewed website preview

After rules activation/readback, revalidate the package and use the isolated Hosting configuration:

```powershell
firebase hosting:channel:deploy release-review --expires 7d --project lakbaypanahon-1797e --config build/student-web-XA9sUT/firebase.json
```

This uploads the reviewed website to the expiring preview channel. It does not replace the live channel or deploy Functions. Hosting preview publication can add its hostname to Firebase Auth authorized domains. Record the returned URL, version and expiry. Do not substitute a broad `firebase deploy` from the repository root.

## Hosted acceptance afterward

1. Verify all five teacher destinations, module/style/audio assets and security headers over HTTPS.
2. Check sign-in/approved role access, then create an isolated class and use a separate authorized student account.
3. Verify join, recipient-aware drafts/publication, deadlines, normal student prerequisites, completion/report reads, feedback/read acknowledgement and private-note denial for the student.
4. Confirm support/report/export flow, owner-only removal, membership access revocation, rejoining and archived-class behavior. Preserve personal progress.
5. Remove only records/accounts created specifically for acceptance. Never clean up the persistent owner teacher account or real learners.

Local mocks/emulator tests do not replace these hosted checks. Human teacher/student usability, actual print/PDF behavior and supported-device/audio review are still separate. No publication or hosted acceptance was executed while preparing this procedure.
