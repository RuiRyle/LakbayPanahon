# Teacher navigation and roster context

Dashboard links now consistently open the teacher-wide overview. Explicit class-card links can still open a class-specific dashboard. Other workspace destinations retain class context.

Student Progress search and page parameters are restored from the URL with input bounds and fresh authorized name reads. Pagination is bounded to the available matched memberships. Returning from a report retains the list context. Switching classes clears unrelated report and roster parameters. No student learning records or private notes are placed in browser storage.

Teacher workflow browser regression passes at 390px and 1280px. Real-document navigation tests pass at both widths, including Dashboard routing, report search restoration, invalid page-index bounding and Back to Student List retaining the filtered roster. Generated-page consistency and syntax checks pass. These local tests use synthetic mocked Firebase records. Website changes remain unpublished; no rules/schema changes were needed.
