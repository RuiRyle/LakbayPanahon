# Classroom keyboard accessibility pass

6 November 2026. Local changes; not deployed.

## Fixed

Opening a teacher student report now focuses its learning heading rather than leaving keyboard focus on a replaced report button. The heading is programmatically focusable with tabindex=-1, not an extra normal Tab stop. Returning to the list restores the original student's report button when present; otherwise search remains the fallback. Reduced-motion preference is respected for the return scroll.

Roster pagination focuses its new page description after the asynchronous load/render. The removed Next/Previous button no longer leaves the keyboard user's position undefined. Programmatic heading/page-description focus has a visible outline.

Student classroom tabs retain role=tab, aria-selected, tabpanel relationships and roving tabindex/arrow keys. Removed redundant aria-pressed, which described toggle buttons rather than the selected tab pattern.

## Validation and scope

teacher-student-progress-design.cjs passed mobile/desktop fixtures including three new focus assertions; student-classroom-hub-design.cjs passed with a new tab-semantics assertion and its existing arrow-key/focus checks. Parallel iframe fixtures track local focus events for asynchronous moves to avoid one frame's activation overriding the other's activeElement observation.

This is a targeted keyboard/semantics pass, not whole-site WCAG conformance or screen-reader certification. Existing skip links, labelled dialog controls, live status regions, keyboard settings and reduced-motion behavior were inspected; not every form, authentication state or page has been exhaustively audited here. No database, grading or reward changes.
