# Teacher dashboard overview

The default Teacher Dashboard is a teaching overview rather than the class-management directory. It uses the existing navy/gold shell, transitions and loader. Detailed student records remain under Student Progress and class-specific insights.

Visual polish: the default overview uses one primary page heading instead of repeating a second dashboard introduction. A compact teal/navy teaching desk leads into four numeric cards with matching SVG icons. Classroom activity uses a timeline-style left panel; the right follow-up panel has a saved pending-count pill. Class cards use initial emblems and distinguish primary actions from quieter links. Small entrance/hover effects respect reduced motion. Mobile puts student follow-ups before activity. Empty states include deliberate visual treatment without fabricated charts or statistics.

## Structure

- Teaching desk: date in Philippine time, plan-learning and announcement actions.
- Four metrics: active classes; unique students in the loaded classes; published shared class goals; unanswered help requests plus student explanations awaiting teacher guidance.
- Needs your response: oldest unresolved requests first, up to four links to the relevant class's follow-up tools. Shared classroom display names are shown where available; otherwise an account suffix identifies the student. No guessed names or scores are generated.
- Recent classroom activity: up to five dated class publications, help requests and understanding-check events. It is not a complete quiz-attempt feed. The feed does not label a published goal as evidence that a student learned it.

Classroom Pulse additionally filters that loaded activity into student check-ins or teaching updates, groups matching events by Philippine calendar day, and links directly to the relevant class tools. Explanation-feedback events use their saved teacher-response timestamp. Switching filters does not reload data.
- Classroom cards: current member, goal and personal-review counts plus links to students, learning activities and class insights. Management stays on My Classes.

## Loading and count scope

`loadTeacherDashboard` is read-only. It checks the approved teacher and class ownership, loads up to six active classes per overview group with at most two classes concurrently, and reads at most 101 records per source per class to detect a limit. Sources are memberships, goals, reviews, announcements, help requests, review reflections and optional classmate names. The first 100 records per source are used. No report-link writes, invitation reads, per-student quiz history scans, live listeners or polling run for the default overview.

The snapshot states its class-group scope and time. The active-class metric counts all active classes; other metrics cover the displayed group. Student count deduplicates memberships across those classes. Failed sources are shown as unavailable, not zero. Large sources display a limit notice and partial-count markers. Follow-ups are restricted to membership records in the loaded snapshot; truncated membership lists can omit additional eligible students. Use class-specific tools for full records.

The empty state preserves the same dashboard structure, with zero counts and a clear class-creation action. Archived classes are managed through My Classes. Existing `?class=` overview links remain class-specific insight pages.

## Verification and publication

`node tests/teacher-overview-browser.cjs` checks real local teacher login, automatic metrics and activity, genuine fixture follow-ups, class-context links, and a 390px viewport. Fixtures are deleted after the check, retaining user-created classes. Screenshots: `docs/validation/teacher-overview-desktop.png` and `teacher-overview-mobile.png`.

Local preview updated without resetting emulator data. Production hosting/rules were not published. No schema changes are required for this dashboard.

Current My Classes navigation (November 5, 2026): the classroom collection is a searchable, filtered directory with 12 cards per page. Each card links to `teacher-classroom.html?class={id}`. Classroom details and invitation controls are on that separate page, not an expanding directory card. The classroom page links back to My Classes and into the selected class's existing student, mission and announcement pages. See `validation/classroom-directory-pages-2026-11-05.md` for current validation.
