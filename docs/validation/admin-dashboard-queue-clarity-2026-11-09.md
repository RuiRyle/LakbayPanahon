# Dashboard application/account distinction

9 November 2026. Dashboard-only clarification; Accounts continues managing students and teachers.

The submitted-application metric now reads Submitted for review. The queue explicitly explains that it contains submitted qualifications rather than every pending teacher account. An empty queue explains the distinction and offers Find teacher accounts awaiting access. That action opens existing Accounts with role=teacher/status=pending, clears page search, and uses the existing authorized query. The main Accounts quick action now explicitly names both Student & Teacher Accounts.

No attempt is made to infer whether a teacher has a draft, missing application or approved qualification merely from account status. No pending profile is silently promoted into the submitted queue. Qualification approval and activation remain separate; no production records were inspected or modified.

Changed `js/admin-workspace.js`, `css/admin-workspace.css`, `tests/admin-workspace-browser.cjs`. Local real-module Chrome/mock-Firestore suite passed, including a new case with 26 pending teacher accounts and zero submitted applications: metric remains zero, explanation is present and its action opens the paginated pending teacher directory. Existing student management and review/recovery tests still pass. Three overview-query/authorization unit tests and the accepted Stage 0 validator also passed.

No new startup database query, permission, backend feature, grading/reward change, deployment, billing or Git push. No fresh screenshots or real-emulator acceptance run are claimed for this text/navigation refinement.
