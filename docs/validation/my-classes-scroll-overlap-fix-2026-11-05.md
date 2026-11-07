# My Classes scroll overlap fix — 5 November 2026

Removed the obsolete desktop sticky positioning, viewport height cap and nested overflow from the classroom collection rule. That rule belonged to the previous sidebar layout and continued to override the simplified normal-flow collection at wide viewports, allowing it to pin above the selected workspace while scrolling. The collection now stays in normal document flow. The top navigation retains its existing positioning.

The real local-browser suite passes 32 checks. New regression checks assert static collection positioning and non-overlapping collection/workspace rectangles at desktop scroll offsets 220, 500 and 850 with settings/archive panels expanded, plus a mobile scroll check at 390px width. Existing controls, filters, class-context links, mobile fit and reduced-motion checks remain passing. Temporary fixtures are cleaned up, preserving user-created classes. The staged website build validates source references.

The local preview was updated in place. No schema, data, permissions or production deployment changes were performed.
