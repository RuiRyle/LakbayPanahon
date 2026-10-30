# Completed journey on the student website

When a student has completed every available, accessible chapter, Home and My Journey show a learning continuation card. It counts that student's saved chapter and mission completions, identifies a recently completed chapter, and offers the collection and era explorer.

If the student's saved review evidence identifies an active topic in a completed chapter, the primary action opens that topic in its story lesson. The student can then use the existing targeted practice and quiz retry flow. Otherwise the primary action opens the latest completed era. Legacy chapters without an era still offer chapter browsing.

The card uses catalog and owned progress already loaded for the journey. It adds no Firestore reads or writes, rewards, or completion changes. The temporary localhost exploration preview remains in place. The website has not been deployed to Firebase Hosting.

My Journey expands the latest completed chapter by default once the path is finished. Each era heading links to that era's overview, so students can browse its background and chapters directly from the path. These links use the existing Firestore era IDs and preserve the normal access checks on destination pages.

Review cards now use saved review state for their main action: a new recommendation opens the mapped lesson scenes; after the lesson is revisited, it starts targeted practice; while practice is in progress, it offers continued practice. The lesson, targeted practice and mission quiz remain available from each card. This changes navigation only and uses the existing review evidence.

My Journey now loads practice-question banks only for mission IDs in the signed-in student's saved quiz attempts or practice sessions. A student with no such history triggers no practice-question bank read. If a scoped read fails, the page reports review evidence as unavailable while preserving the learning path. Catalog, progress and other existing reads are unchanged.

Review guidance also needs saved lesson-review events. If that read fails on Home, My Journey or the Home review panel, the site reports review guidance as unavailable and offers refresh instead of treating a revisited lesson as unseen. The next mission path remains available. No new read is introduced; this changes the handling of the existing event read.

Home now renders its journey card and review panel from the same authenticated load. The separate `student-review.js` page script is no longer loaded on Home, avoiding a second set of chapter, era, mission, owned-attempt, practice-history, review-event and relevant practice-question reads on initial page entry. Refresh Review reruns the combined Home journey/review load, so it also refreshes the next-action card. Sign-out clears both panels; stale loads cannot render after a session change. No Firestore data or rules changed.

The Home completed-mission counter and journey load now share their initial owner-scoped `studentProgress` snapshot. A counter retry still performs its own fresh query if that shared read fails. This removes one duplicate initial query without changing the saved count or unlocking logic.

When a browser restores Home from its back/forward cache, the page now reloads the whole authenticated dashboard. This refreshes XP, level, mission and badge counts, next action and review recommendations together after a student returns from learning. Ordinary page loads still use the existing authentication entry path.

The Home completed-mission total now counts distinct owned `missionId` values marked complete, matching the journey's progress-set logic. Duplicate completion documents cannot inflate the number; incomplete and other-user records are ignored. No saved records are changed.

The Home badge total now counts distinct owned `badgeId` values using the same ownership rule as Achievements. Duplicate, foreign or malformed ownership rows cannot make Home show more badges than the collection count. Catalog details may still be temporarily unavailable while earned ownership remains counted.

Achievements now refreshes badge and artifact ownership when the browser restores the page from its back/forward cache. The currently selected collection stays open. Session and request guards still prevent an older response from replacing a newer view. Ordinary page loads continue through the auth listener.

Explore Chapters and each era overview now refresh owned chapter progress when restored from the browser's back/forward cache. Explore keeps the selected era and reloads its chapter trail; if that era is no longer active, the old trail is hidden. Session and chapter request generations prevent earlier responses from restoring stale unlock labels. The temporary localhost exploration preview still controls testing access separately from saved progress.

Verification: `node tests/student-journey-action.test.cjs`, `node tests/student-dashboard-browser.cjs`, `node tests/my-journey-browser.cjs`, and the local unit suite passed on 2026-10-28. Live account acceptance and curriculum review remain separate work.
