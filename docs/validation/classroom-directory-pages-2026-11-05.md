# Classroom directory and dedicated pages — 2026-11-05

This replaces the earlier expanding classroom-card interface.

- My Classes (`pages/teacher-classes.html`) lists owned classrooms with a search field, active/archived/all filter, and 12 matching cards per page. Cards are real links. No classroom management panel expands inside the directory.
- Classroom details (`pages/teacher-classroom.html?class={id}`) is an independently addressable teacher page using the shared navy/gold shell and page transitions. It shows only the selected classroom's summary, teaching shortcuts, details editing, archive/restore and classroom-specific invitation. Back to My Classes returns to the list.
- Creating a class navigates to that class's own page. Reloading a detail URL restores the same classroom. A missing/unowned class URL does not substitute another class and provides a return link.
- Student Progress, Announcements and Assigned Missions links retain the class ID. My Classes does not fetch roster profiles or build reports. The obsolete accordion animation/cache implementation was removed.
- The shared teacher-page generator and release inventory include the new page. No new database schema is required.

Local browser coverage uses fourteen classroom fixtures to verify pagination/search, active/archived separation, real card clicks, independent page navigation, invitation generation, edit cancellation, direct reload, creation, missing-class behavior, mobile width and dashboard follow-up routing. Fixtures are removed after validation. Staged website and local preview updated without resetting the running Auth/Firestore emulators. No production deployment.
