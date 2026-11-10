# Administrator separate-page navigation

9 November 2026. Administrator navigation now opens separate HTML documents for Overview, Teacher Applications, Accounts, Decision Records and Administration. Each page reuses the existing administrator controller, permission checks and shared compass page transition.

Overview review links carry the selected account into the destination page. Accounts retain role/status filters when navigating from another section. Cancelling navigation with an unsaved review reason keeps the current document and draft. Background tasks cannot start on the departing page while navigation is pending. Modified-click navigation retains normal browser behavior.

Validation: the local HTTP browser navigation harness passed 42 checks at desktop and mobile widths, including new-document navigation, active sidebar destinations, compass transitions, applicant links and cancelled unsaved navigation. Firebase is mocked in this navigation harness; this is not a fresh emulator security acceptance run. The existing administrator component browser harness passed 182 checks. The local web release build passed with 37 pages, 607 files and no missing or rejected dependencies. Scoped whitespace checks passed.

No deployment, billing activation, production request or educational logic changes were made. Final visual acceptance in the user's normal local browser remains appropriate.
