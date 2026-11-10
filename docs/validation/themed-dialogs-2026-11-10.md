# Shared themed dialogs — 10 November 2026

All 27 runtime JavaScript alert/confirmation calls now use `appAlert`/`appConfirm` from `js/app-dialog.js`. The centered native HTML dialog is styled in `css/app-dialog.css` with navy surfaces, gold primary action, readable text, dimmed backdrop and reduced-motion support. Confirmation dialogs have Cancel and OK, with Cancel initially focused. Notices have OK only. Escape cancels, focus returns to the initiating control, duplicate requests are rejected, and page exit or protected-page session loss cancels pending actions. Text is rendered with textContent.

The call sites cover student class join/leave, learning restart, quiz answer resets/errors, practice notices, Bayani New Chat, logout failure, teacher application review, teacher editing/removal/publication and administrator decisions. Asynchronous confirmation results are awaited before guarded actions proceed. Teacher/admin document navigation prevents its native action before awaiting a discard decision. Browser-owned beforeunload warnings remain native because they cannot be replaced or restyled reliably.

The stylesheet is linked from the page entry points. Frontend changes are local; Hosting was not deployed and no database/rule/provider changes occurred.

Verification:

- Actual shared-dialog Chrome fixture passes: centered geometry, plain-text rendering, Cancel/OK, Escape, duplicate prevention, focus restoration, session loss and page exit.
- My Class browser regression passes.
- Mission Quiz, adaptive practice/review and Bayani browser regressions pass. These fixtures stub the shared confirmation answer and test the surrounding application behavior; the separate dialog fixture exercises the real dialog.
- All runtime JavaScript parses; AST scan finds no native alert/confirm/prompt calls remaining.
- Public inventory: 37 pages, 610 files, zero missing/rejected references.
- Broad teacher/admin fixtures were attempted but do not pass end to end: the teacher fixture stops at its dashboard formation assertion and the administrator fixture at a quick-action geometry assertion after asynchronous view switching. These are unresolved regression evidence, not a passing release claim. Their full regression remains required before hosted release.

Current full application acceptance is not declared complete by this change. Refresh the local page to load the new dialog code and stylesheet.
