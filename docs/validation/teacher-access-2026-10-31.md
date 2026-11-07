# Teacher access: first implementation step

Teacher workspace access uses a fresh server profile. Only `role: teacher` with `status: active` releases the workspace. Pending, inactive, rejected and missing-status teacher profiles stay locked with an explanatory dialog and a Check Again action. Missing profiles are denied. Wrong-role accounts follow their own dashboard route.

Network failure keeps the signed-in session and offers retry; it does not grant access from cached profile data. The teacher shell is inert while verification is pending, including page restoration. The dialog is visible despite the dashboard's hidden-until-authenticated body.

Validation: `node --test --test-isolation=none tests/student-auth-guard.test.cjs` passed 29 checks, including teacher status/retry and existing student session/lifecycle cases. `node tests/student-auth-guard-browser.cjs` passed the existing real-Chrome student guard fixture. Teacher-specific dialog layout has not yet received browser or human acceptance.

Existing Firestore profile creation permits teacher self-registration only with pending status; permitted self-profile updates do not include role or status. No rules, live accounts, approvals or hosted deployment were changed in this step.

Next: owned class management and invitation codes, with tested ownership rules, followed by member-only reporting, announcements and mission assignments. The dashboard still contains its explicit unavailable-tool notices; this step does not claim those features are implemented.
