# Era overview experience

Implemented 28 October 2026. Open Explore Chapters and choose an era to visit
pages/era.html?era=DOCUMENT_ID. Real links support direct visits, refresh, Back and
new tabs. The page shares the existing protected student shell and chapter loader.

The full-width destination banner includes the era title, description, optional
period, artwork and access explanation. A field guide introduces discoveries,
a progress panel counts completed chapter records, and the chapter trail retains
existing completed/available/locked states. The primary action opens the first
available unfinished chapter, or a completed chapter for review. This uses chapter
progress, not an invented percentage of mission mastery. Chapter pages return to
their era using the loaded chapter's eraId.

## Firestore fields

No manual data entry or migration is required. Existing eras and chapter records
supply the content. The overview supports these existing/optional era fields:

- title, description: banner copy.
- dateRange: optional period text; omitted when absent.
- imageUrl: optional HTTPS banner image; otherwise the existing decorative atlas
  illustration is reused. It is decorative, not a historically accurate map.
- theme: sea, forest or sand presentation token; sea is the neutral fallback.
- learningObjectives: optional array of short student-facing strings. Up to six
  are shown. When absent or empty, the first three chapter titles introduce the
  trail. No curriculum goals or historical facts are invented in browser code.
- requiredChapterIds and unlockMessage: existing progression prerequisites/copy.

All learner copy is rendered as text. The page uses the same cached instructional
snapshots and era-scoped chapter query as Explore Chapters. It reuses the initial
owned chapter-progress result for the first overview render instead of reading
that result again. No mission, question, artifact or badge collections are loaded
for the overview, and no learner writes are introduced.

Locked eras are browsable previews with disabled chapter access; owned completed
chapters remain reviewable. The localhost exploration preview still opens lessons
and explains its unsaved quiz/reward behavior. Errors clear the primary action and
offer retry; sign-out clears learner-specific panels. Reduced-motion preference
disables the brief chapter entrance animation.

## Validation

407 local unit checks passed. The era overview browser test passed at desktop and
390px widths, covering direct links, authored/fallback content, locked access,
preview mode, next/review actions, progress, connection retry and sign-out. Both
layouts were visually inspected; a narrow flex sizing issue was corrected and a
bounding-box check added. Existing chapter and mission-journey browser checks pass.
These are mocked browser checks, not a live student account acceptance test.

No Firestore data changes or Hosting deployment were needed. Use Live Server and
refresh Explore Chapters to review the implementation.
