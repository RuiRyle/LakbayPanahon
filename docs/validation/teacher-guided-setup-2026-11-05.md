# Guided teacher setup — November 5, 2026

Implemented locally, with the simplified school-affiliation policy still awaiting live activation.

Create account (step 1) -> verify email (step 2) -> complete teaching details (step 3) -> administrator review (step 4) -> classroom workspace after approval.

Registration now explains the next steps and offers Continue teacher setup after account creation. The setup page clearly says the account already exists, and pre-fills the registered name only for a new application; saved application values take precedence. Submitted/approved applications show status first and collapse the read-only details. Requests for changes reopen the saved form. Approved users can enter the workspace or deliberately revise their application, retaining the existing warning that revision pauses classroom access.

Returning teacher login checks the application's current approval/revision before choosing the workspace. Missing, submitted, changes-requested or stale approvals return to setup rather than briefly entering the dashboard. Students/admins keep their existing routes.

Validation: 26 authentication/application-policy unit checks pass, including four new returning-teacher cases. Application browser checks pass at 390px and 1280px (46 checks total), including registered-name reuse and the submitted review screen. Build passes. No real accounts or applications changed, no verification email sent, and no rules activated during this step. The production-connected preview remains on its compatible previous application version until the shorter verification policy is approved for activation.
