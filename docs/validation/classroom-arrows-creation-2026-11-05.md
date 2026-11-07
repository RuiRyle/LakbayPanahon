# Classroom arrows and creation interface — 5 November 2026

Separated the active-class count from the collection disclosure chevron. Card navigation uses clear CSS chevrons; selected cards use a distinct checkmark. Whole-card selection and keyboard access remain unchanged.

Create a new classroom now has a plus-icon trigger, brief description, explanatory form introduction, example class name, optional-description help, a clear submit action and a close action that preserves unsent text. After successful creation from My Classes, the page stays on the new selected classroom and exposes its existing invitation panel instead of navigating to the dashboard. The form resets/collapses only on success. Existing validation, ownership rules and manual invitation generation remain unchanged.

Validation: 36 actual local-browser checks pass, including preserving the draft on close, creating a real temporary local class through the form and remaining in the selected workspace. Existing scrolling, mobile, selection, dashboard, invitation and reduced-motion checks remain passing. Test classes are removed and user-created classes retained. JavaScript syntax and staged website build pass. No schema, permissions, production data or deployment changes were performed.
