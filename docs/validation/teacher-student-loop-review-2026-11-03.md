# Teacher–student workflow verification

Verified locally on 3 November 2026. No hosted deployment, production learner writes, paid service calls or administrator workflow changes were made.

## Results

- Firestore emulator: **72 integration checks passed**, using the current repository rules and synthetic identities in `demo-lakbay-teacher`. See [machine-readable evidence](teacher-student-loop-emulator-2026-11-03.json).
- Teacher browser: **53 checks passed at each of 390 and 1280 pixels**, using the actual interface modules with mocked Firebase operations. Current output is in [teacher browser evidence](teacher-workspace-browser-2026-10-31.json); the filename is historical, and its `verifiedAt` and source hashes identify the run.
- Student My Class browser: passed join/leave, published assignments, existing completion, prerequisites, safe message rendering, read recovery and session isolation.
- Student class client: **6 tests passed**, covering invitation validation, duplicate membership, inactive membership and account-switch isolation.

## Verified interaction

1. An approved teacher creates a class and issues an invitation. Other teachers cannot manage it.
2. A student joins using an active code. Nonmembers cannot read the class materials.
3. Draft announcements and assigned missions remain hidden from students. Published items become readable by active members.
4. A synthetic student submits a new mission completion, quiz attempt and paired XP update under student authorization, rather than having this completion seeded through trusted access.
5. The teacher reads that student-written completion and attempt. The teacher cannot change the score.
6. A replay saves a new attempt with zero reward and leaves saved XP unchanged.
7. Archiving prevents reporting/publication. Leaving revokes teacher access to the student's progress/profile/attempts and revokes the student's access to class messages/assignments. The student retains their own learning progress.

## Interpretation and remaining limits

The browser checks and emulator checks are complementary; they are not one automated browser journey connected to a live Firebase backend. The emulator verifies access rules and write contracts, not historical correctness, server-verified grading or actual learner understanding. Existing browser grading remains in use.

Teacher assignment views show completed, not yet completed, or unavailable. They do not claim a mission is unlocked: the current teacher contract does not expose all era/prerequisite and chapter-progress records required for that conclusion. The student My Class route continues to enforce its normal prerequisites.

The refined teacher interface remains local. Hosted acceptance, real teacher/student usability review, and real-device checks remain separate tasks. No school/operator decisions are inferred from these tests.

Reproduce using a local Firestore emulator on port 8190 with the repository rules, then run:

```powershell
$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:8190'
node tests/teacher-workflow-emulator.cjs --refinement
node tests/teacher-workspace-browser.cjs
node tests/my-class-browser.cjs
node --test --test-isolation=none tests/student-class-client.test.cjs
```

The emulator test clears only its synthetic demonstration-project database at startup. Do not point it at a production service.
