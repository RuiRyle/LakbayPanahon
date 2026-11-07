# Simpler era and mission pages — 31 October 2026

Simplified the existing pages so their purpose and next action are immediately understandable. No curriculum, learning-access rule, assessment policy, reward or learner data changed.

## Era: choose a chapter in this time period

- One introduction replaces the repeated arrival/overview presentation. The authored title and period remain visible, with a short explanation that chapters contain missions and a final challenge.
- Open next chapter is the primary action; its destination is named below it. Completed chapters offer Review a chapter. Existing eligibility still determines the destination.
- The authored historical description and learning-goal list remain accessible through native, keyboard-operable disclosures.
- Chapter cards form a straightforward list with their title, state and action. Mobile buttons wrap below the description. The redundant state legend and nested hero panel were removed; each card still states its own availability.
- Progress and prerequisite/recovery messages remain, with shorter instructions and no extra arrival step.

## Mission: start the next short lesson

- The chapter title is now the page's main heading. A short sentence explains what a chapter/mission means, while About this chapter preserves the authored description.
- The selected mission shows its title, introduction, first learning goal and Start Lesson action. Additional learning goals remain in a disclosure; they are not deleted or changed.
- The start action appears before optional How does a mission work? instructions. The three-step explanation covers the story, activities and quiz. XP copy explicitly says it is earned once by passing.
- The mission list is labeled Missions in this chapter, with simpler rows and fewer repeated badges. Completion/locked messages, accessible selected state, keyboard activation, review, final challenge and existing routing remain.

## Verification

- Full local baseline after the main changes: **304 unit checks in 48 suites and all 14 mocked browser fixtures pass**. Final cosmetic cleanup was followed by the expanded exact-viewport fixture and focused era/mission checks.
- Exact 390px/1440px mission/era checks pass along with the other feature screens: visible start action, expandable extra objectives, instructions following the action, chapter states, decoded narration artwork and no horizontal overflow.
- Era overview, chapter catalog and mission journey Chrome fixtures pass live-code behavior with simulated data: prerequisites, next chapter, completion/review, preview, progress, safe authored text, encoded routes, retry and sign-out. The old fixture expectation Revisit was updated to the intended Review a chapter label; its routing assertions remain.
- Mission mobile and era desktop captures were inspected. These are local fixtures, not new real-account, hosted or learner-comprehension acceptance.
- Final staged package: `build/student-web-M6kgCk/public`, 25 pages, 523 hash-verified files, zero missing/rejected references. No website deployment, backend/configuration publication, paid generation or learner writes occurred.

Open the normal Explore Chapters → era → chapter route to see the simplified pages.
