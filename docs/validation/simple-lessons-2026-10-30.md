# Simplified learning flow

The real mission player now presents one activity at a time with Back and Continue. Reading uses the same Continue control for each authored paragraph. Exploration, explanations, terms, insights, authored activities and checks follow in a linear sequence. Required activities keep Continue disabled until the existing story evaluator accepts completion. Back lets learners reread earlier information. Starting or reviewing a scene resets the presentation to reading.

The activity tabs, numbered scene trail and duplicate story action row are removed from the enhanced view. The header is compact. Restart and reading preferences live under Lesson options; journal saving is an optional disclosure during exploration. Bayani provides one small instruction. Authored content, Firestore progress, lesson prerequisites, quiz rules and reward handling retain their existing implementation. Presentation state itself is temporary.

The standalone playground also uses a single column, small guide and simple progress indicator. The duplicate island controls are hidden during clue reading; the instructions direct children to the clue cards.

Validation: updated story browser fixture passes one-activity visibility, reading-to-clues navigation, clue gating, back navigation, decision gating, scene progression, completion, recovery, narrow layout and safety checks. It includes all six archaeology scenes. The playground browser fixture passes at 1440 and 600 pixels, including reading state and existing activity checks. JavaScript syntax checks passed. Screenshots in `build/mission-simple-review` and `build/story-playground-review` are local fixture previews. A signed-in walkthrough and feedback from children remain unverified for this revision.
