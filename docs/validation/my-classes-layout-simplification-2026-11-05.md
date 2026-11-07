# My Classes layout simplification — 5 November 2026

Replaced the expanding sidebar-plus-management layout with two clear levels: a compact classroom collection above, then one selected-class workspace. Creation remains a secondary expandable action below the cards. The selected workspace contains class information and invitations side by side on wide screens, stacked below 1100px. Edit details and archive/status controls are collapsed rows within that same workspace.

Reduced header height, duplicate labels, card padding and placeholder descriptions. Preserved whole-card selection, keyboard focus, selected-state indicators, invitation behavior, class links and reduced-motion settings. Corrected a detached-container lookup that otherwise left invitation controls outside the selected workspace during DOM reorganization. This supersedes the earlier sticky classroom-sidebar layout.

Validation: 27 actual local-browser checks pass across teacher overview and My Classes, including selected state, collection/workspace separation, invitation controls, edit/archive placement, mobile width and reduced motion. Desktop screenshot was visually inspected. JavaScript syntax and staged website build checked. Temporary fixtures are removed; existing user-created classes remain. No schema, permissions, production data or deployment changes were performed.
