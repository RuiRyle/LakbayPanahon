# Teacher workflow implementation

**Qualification update:** [Teacher applications](teacher-qualification-workflow.md) now require verified email and the appropriate PRC/endorsement and affiliation review before classroom access. Existing active teacher accounts must complete this review too. Applications/evidence are private; no class or student progress is erased.

Entry page: `pages/teacher-dashboard.html`. Sign in with an administrator-approved teacher account. Registration remains pending until approval; students can continue learning independently without a class.

## Page structure

### Consistent request feedback

The shared teacher controller marks loading, information, success, error and idle states consistently. Pending requests disable conflicting actions and display the shared busy indicator. Errors expose Reload Workspace as a recovery action; it honors unsaved-change confirmation and never automatically replays a write. Known connection, quota, permission and session errors use contextual recovery messages instead of raw service details. Successful requests clear prior recovery controls. Sign-out/account changes reset status and protected UI. Existing section-level empty and unavailable states continue distinguishing missing records from failed reads.

### Report information hierarchy

Student reports begin with Back to Student List, the student heading, a learning snapshot (completed missions, saved attempts and missions with current review signals), and suggested teaching follow-up. Secondary controls are grouped into collapsed Send guidance to the student, Private teacher follow-up, Learning history and score details, and Print or download learning records sections. Existing private-note permissions, feedback behavior, exports and unsaved-edit protection remain unchanged. Historical topic counts remain separate from current review signals. The snapshot does not claim mastery or a percentage of the whole curriculum completed.

### Navigation and roster context

The sidebar Dashboard destination always opens the teacher-wide overview without a selected-class parameter. Class cards still provide explicit links to an individual class dashboard. Other sidebar destinations retain the current class where appropriate.

Student Progress stores its active search and zero-based roster page in the current URL (`search`, `rosterPage`). Loading a report link or refreshing that page restores the search and bounds the page index to the available matches. Class changes reset unrelated student/assignment and roster-filter parameters. Back to Student List closes the report and keeps the loaded class/search/page context. Restoring a name search uses fresh authorized roster-name reads; no student report data is persisted in browser storage. URL parameters never grant access.

### Assignment receiving class

Assigned Missions keeps its editor available before a class exists or is selected. Teachers can choose a mission, write instructions, set an optional due date and choose draft/publication visibility. Receiving class is required only at save time. Changing the recipient preserves these fields and updates the audience preview. Missing-recipient saves keep the draft in the current page. Existing saved assignments lock their original class while editing; cancel returns to a new composer. Archived classes are excluded.

Successful saves use the selected active receiving class and refresh its saved assignments. Ownership, active class and mission publication checks remain enforced by the existing client/rules. Unsent instructions are current-page state protected by discard prompts, not server-stored drafts before a receiving class is chosen. No new database fields or permissions are introduced by this selector.

### Compose announcements before choosing a class

The Announcements editor is available before class creation or selection. Write the title and message, then choose Receiving class before saving a draft or publishing. Recipient changes retain the composed text and update the preview. Only active owned classes are offered; no-recipient saves show guidance and preserve the draft. With no active class, teachers can compose but must create or restore one before saving. Unsent text is held in the current page and protected by existing leave/discard prompts, not stored as an account-wide draft.

Saved announcements remain attached to their original class when edited; the recipient is locked for that edit. Cancel Edit restores the composer. Successful saves open the receiving class context and its saved messages. Class archival refreshes recipient options so an archived class is not offered. Server ownership/publication checks remain unchanged, and no new collection or rules are needed for recipient selection.

### Browse lessons before class creation

Assigned Missions includes Browse history lessons for approved teachers even without an owned class. Search mission titles, chapter titles or learning objectives, filter by chapter, and browse groups of eight lessons. Cards show supplied learning goals and discussion prompts; absent goals are labelled rather than invented. Browsing does not assign work or grant student progress.

With a selected active class, Prepare Assignment fills the existing mission editor after unsaved-change confirmation. Without a selected active class, Choose a Receiving Class offers owned active destinations carrying both class and mission identifiers. If no class exists, Create a Class is offered while browsing stays available. Publishing still requires an active owned class and the existing mission checks. The catalog uses the already authorized mission metadata and introduces no new database schema or rules.

### Teacher-wide starting point

Student Progress now provides All active classes / specific class selection directly on its page. Without a selected class, active class cards load joined students on request in groups of 20. Each report link carries class and student identifiers, and the destination performs fresh membership checks. Students enrolled in more than one class appear in each membership context; displayed rows are not a unique-student total. Choosing one class restores its searchable roster, reports and membership controls. Archived classes can be selected for their restoration explanation but do not load private student reporting.

Opening teacher-dashboard.html without a class parameter presents All your classes when owned classes exist. Cards show active/archived status and direct links to Student Progress, Assigned Missions, Announcements and the selected class dashboard. The teacher does not need to select a class in a toolbar before opening these destinations. A Load Class Summary action reads that class's saved membership and publication counts; failures remain unavailable. No cross-class student counts or quiz averages are invented from partial data. The selected class dashboard includes All Classes to return to this overview.

No-class accounts retain Create Your First Class and the existing empty dashboard. Other destinations still have class-specific views; teacher-wide reporting filters, pre-class lesson browsing and choosing the receiving class in publication forms are subsequent refinements, not yet implemented by this step.

Teacher navigation uses separate HTML documents, matching the student destinations:

| Destination | File |
| --- | --- |
| Dashboard | `pages/teacher-dashboard.html` |
| My Classes | `pages/teacher-classes.html` |
| Student Progress | `pages/teacher-students.html` |
| Announcements | `pages/teacher-announcements.html` |
| Assigned Missions | `pages/teacher-assignments.html` |

Sidebar items are normal links. `page-transition.js` supplies the same full-page compass transition as student navigation; each destination runs its own access checks and loading screen. The selected class travels in the `class` URL parameter and is checked against owned classes before loading. Assignment and student report links also carry their record identifiers; a URL does not grant access.

The pages share `js/teacher-workspace.js`, `css/teacher-workspace.css`, and `css/workspace-loading.css`. The dashboard HTML is the common shell source: run `node tools/build-teacher-pages.cjs` after shell edits, or use `--check` to verify the four generated destinations are consistent. The shared shell includes the controller's form mount points; only the current destination's section is presented.

`tests/teacher-pages-browser.cjs` serves these actual HTML documents over local HTTP and tests full navigation with real transition/controller code and mocked Firebase records. It covers each destination at 390px and 1280px, class context, primary actions, assignment progress links and student reports. `tests/teacher-workspace-browser.cjs` continues exercising classroom operations in place. Neither test deploys the website.

## Implemented

1. Fresh teacher access checks, approval/status explanation, offline retry, session restoration and role separation.
2. Owned class creation, description/name editing, archive and restore. Archived classes cannot admit students, publish activities or open student reports. Archiving never deletes progress.
3. Random 12-character invitation codes, seven-day expiry, copy, replacement and revocation. Rotation is atomic; existing memberships survive. Restoring an archived class requires a new code.
4. Active student roster with names, loaded in pages of 20. A profile lookup failure is labelled unavailable. Reports show saved mission completions, best scores, quiz attempts and recorded topics to revisit. Browser grading is disclosed; these are not tamper-proof exam results.
5. Announcement drafts, publication, editing and withdrawal to draft. Only joined students can read published items.
6. Existing-mission assignments, optional instructions, optional Philippine-time due dates, draft/publication/edit/withdrawal. Assignments preserve student prerequisites, previous independent completion and original rewards. No new submission or grade system is added. The editor supports setting, editing and removing deadlines; dated writes require the revised assignment rules to be published before hosted use. Completion views filter each loaded group by completed, not yet completed, or unavailable, and explain deadline timing separately from completion. The saved-item list filters published items, drafts and published items whose due date has passed.
7. Mission-specific feedback from a joined student's learning report. The approved owning teacher sends up to 1500 characters of student-visible guidance. Students read it in My Class and explicitly mark it as read. Teacher updates replace the current message for that class/student/mission, increment revision, preserve createdAt, and clear readAt. This is guidance and an acknowledgement, not grading or proof of understanding. Private support notes are not part of this record.

## Learning reports and export

Open Student Progress → View Learning Report. Reports show saved mission completions, best scores, all quiz attempts, comparisons by mission, and recorded review-topic frequency. Topic counts include historical attempts; they do not establish current unresolved difficulty. The latest-result check-in remains separate.

**Download CSV** and **Print Learning Report** each reload the selected student's learning records through the existing owned-class and active-membership checks. If reads fail, no stale export is produced. Exports contain student name, class name, generation time, mission progress and quiz attempts. Record timestamps use explicitly labelled UTC in exports. Missing dates and scores remain unavailable.

Private follow-up notes, teacher feedback messages, contact information and credential data are excluded. CSV fields are quoted and spreadsheet formulas are neutralized. Printing uses a separate text-rendered document containing learning records only; expanded forms and private panels in the workspace are not printed. The print frame is removed after printing, on timeout or when the workspace clears. Browser controls determine saving a PDF or choosing a printer; actual printer output is not automatically tested.

These changes are local, with no new collection or rules requirement for export. Current hosted teacher reporting permissions still apply. Browser tests cover fresh-read exports, failure behavior and excluded content; unit tests cover CSV escaping/formula safety, missing values and the empty-record case.

## Private follow-up tracking

In Student Progress, open a joined student's report and expand **Private teacher follow-up**. Choose a mission, select **Follow-up planned** or **Discussed with student**, and save a private note. **Edit Follow-up** restores that mission's saved note. **Reload Private Follow-ups** reloads newer records after a concurrent-edit conflict; unsaved changes require confirmation before discarding.

Notes are stored in `teacherSupportNotes`, separately from student-visible `classFeedback`. Only the approved owning teacher can read or write them while the class and membership are active. Students and other teachers cannot read or query notes. Archiving or leaving revokes teacher report access; records are retained without deleting the student's learning progress.

Each note retains one current revision. Stale revisions are rejected. `statusAt` records when the status was first set or changed; ordinary note edits preserve it. Reopening a discussed follow-up as planned starts a new boundary. The report shows up to three recent dated quiz attempts after this boundary, with an explicit unknown state for missing, future or ambiguous dates. Reopen the report to load later quiz records. A discussed status does not clear review signals or establish understanding, and later results do not establish that a discussion caused learning gains.

Private notes do not change student-visible feedback, scores, completion, XP or rewards. The expanded note form participates in unsaved-edit protection. Failed loads keep the report available and offer retry. Browser checks pass at 390px and 1280px; the local rules suite passes 114 integration/permission checks. The support-note rules and website remain local and must be published before hosted use.

## Student-visible mission feedback — November 5, 2026

Open Student Progress, choose a joined student and use Give [student] a next step. Choose an existing mission and send short guidance. Sent feedback shows whether the latest revision was marked read. The latest message per mission is retained; previous message versions are replaced, not presented as an immutable conversation history. Unsent feedback participates in the existing discard/leave-page protection.

Students see Feedback from your teacher before the assignment list in My Class. Feedback does not require a separate class assignment for that mission. Its My Journey link preserves the normal prerequisite flow. A feedback outage leaves lessons and assignments available and offers retry. Acknowledgement is transactional: if the teacher changed the revision since the student loaded it, the student must refresh and read the new guidance first.

The `classFeedback` rules permit only the owning approved teacher to send for an active member of an active class. Students may read only their own class feedback and may change only readAt to the server timestamp. Leaving revokes feedback access for both teacher and student. No private teacher note, score, XP or completion field is accepted. Student acknowledgements can remain available for a retained membership in an archived class; teachers must restore the class before sending or reading feedback reports.

Local browser tests cover teacher sending/updates, safe text rendering, unsent drafts, student acknowledgement, stale revisions, outage isolation and existing class/learning paths. The local Firestore suite passes 98 checks including cross-account denial and leave/archive behavior. The website and updated rules have not been deployed; production feedback needs the revised rules before use.

## Classroom workspace refinement — November 4, 2026

The local teacher interface retains the student visual identity, shared loading shell, motion preferences and page transitions. Its dashboard now prioritizes daily classroom work:

1. Choose the class once in the class selector. The dashboard's context counts describe only that class: joined students and published missions. Two further cards show quiz average and seven-day quiz participation for the loaded student group.
2. Use the primary **Write Announcement** action to open the announcement editor. Assigned Missions remains available in navigation and current mission cards. New or archived classes receive contextual setup or restoration guidance; established classes do not repeat that guidance.
3. Load **Student check-ins** before routine updates. Reads are limited to groups of 20 students; actionable review signals appear first, while other results and unavailable records are expandable. Counts describe the loaded group, not the entire class. Missing quiz attempts are neutral; uncertain dates do not produce a latest-result claim.
4. Load a current mission's completion summary on the dashboard, or open **View Mission Progress** to inspect that mission in Assigned Missions. Dashboard reads cover up to 20 students and label that scope when the class is larger. Unavailable records are excluded from the available-record completion denominator; failed requests remain unavailable. Earlier independent completion counts. This is mission progress, not an assignment-submission grade.
5. Open a student report for follow-up, then use **Back to Student List** to close the report and return to the roster.

The dashboard uses fewer nested panels and a smaller heading while retaining the student colors, sidebar and interaction treatment. Browser coverage exercises these paths at 390px and 1280px using the actual modules with mocked Firebase records. These interface changes are local and have not been deployed; classroom usability review remains a separate validation step.

## Permission contract

`teacherStudentLinks/{teacherUid}_{studentUid}` is a teacher-created report lookup containing only `teacherId`, `userId` and `classId`. Its creation requires an active teacher, owned active class and active membership. Every subsequent profile, mission progress and quiz-attempt read rechecks the link, ownership, account status and membership. A retained link grants nothing after membership is removed, the class is archived, or teacher approval is revoked. It is not a progress copy.

Teacher queries are scoped to owned classes or one joined student. Teachers cannot enumerate users, read unrelated student collections, edit curriculum, alter grades/rewards, transfer ownership, promote themselves or edit membership identities/status. Approved owners can delete an active class membership through the confirmed removal action. Student-owner write rules and the optional-class learning flow remain intact.

The teacher can read the joined student's profile document to resolve their name; the UI displays the name, not email/contact details. Firestore grants document access, not field-level access. Private administrative notes must not be stored in student-visible profile documents. Classroom reports contain existing saved client-graded data; they do not assert verified learning gains.

## Validation and activation

The [November 5 integrated review](validation/teacher-student-final-cycle-2026-11-05.md) covers the expanded local workflow, including recipient-aware publishing, deadlines, feedback/read acknowledgement, private follow-up, reports/exports, topic insights and membership removal. It records 20 focused unit tests, desktop/mobile teacher and student-browser regressions, separate-page navigation, and 129 local Firestore integration/permission checks. A roster-search draft-loss issue was fixed. Earlier publication notes below describe earlier releases, not deployment of these recent features; the revised website/rules still require release preparation and hosted acceptance.

- Local Firestore emulator: 57 actual REST/permission/query/lifecycle checks. Synthetic identities only; no cloud credentials, accounts or learner data.
- Local Chrome: class creation/edit/archive/restore, invitations, names/reports, drafts/publishing/editing, text injection defence, approval dialog, error recovery and sign-out cleanup at 390px and 1280px.
- Focused auth/policy checks: 32 passed. Existing student regression report records its own current results.
- Offline rules comparison: matches the last publication's recorded hash, confines changes to the named teacher/class/report scopes, and preserves unrelated write checks. See [reviewable rule changes](teacher-rules-review.md).
- [Real-SDK teacher/student acceptance](validation/teacher-workflow-live-2026-10-31.json): 18 checks pass against the published rules. Temporary accounts create a class, join through My Class, publish/read an announcement, view reports, preserve assignment prerequisites, rotate codes, leave without losing progress, deny further teacher access, deny other teachers, and archive the class. Learning records in this check are deliberately seeded synthetic fixtures, not earned quiz results. Temporary accounts and owned records were removed.

The reviewed teacher permission changes were **published and read back on 31 October 2026**, following explicit user approval. [Publication evidence](validation/teacher-rules-publication-2026-10-31.json) records the source hash, previous release and backup. The earlier automatic-review block on uploading rules was resolved by that approval; local emulator validation supplied the prepublication checks. No Hosting or Functions deployment is included.

The guarded publisher is `functions/publish-teacher-rules.cjs`; its successful publication is already recorded. Do not replay older publishers over the new rules. Isolated real-SDK acceptance and its cleanup are recorded separately. Local pages with live Firebase, browser mocks and emulator tests do not replace hosted acceptance or actual teacher usability review.

The [administrator workflow](admin-workflow.md) now provides teacher verification and student/teacher account-status management, with paired immutable audit records. Its rules are published and verified. No existing account was approved or modified during implementation; the live checks used and removed isolated temporary identities.

The dashboard heading is compact. Needs attention distinguishes not checked, loading, review suggested, missing quiz evidence, uncertain dates, no clear review signal, and unavailable records. Recent announcements are limited to two previews with a Write Announcement action; announcement totals are not a headline statistic.

## Reference dashboard refinement

The supplied reference informs the compact heading, gold-outlined four-card summary, wide Recent learning activity panel, and narrower Needs attention panel. The main heading action opens announcement writing. The student sidebar, loading shell and separate teacher pages remain shared with the established visual system.

The same dashboard structure is visible before a class is selected. With no classes, the dashboard shows zero joined students and published missions, unknown quiz metrics, empty activity/support panels, and Create Your First Class actions. If classes exist but none is selected, metrics remain unknown and the action is Choose a Class. The old classroom-welcome panel no longer hides the redesigned layout. Classroom data is still loaded only after owned-class selection.

Class insights load the first group of up to 20 joined students on initial dashboard entry. Refresh and group navigation reuse those reads for support signals, recent activity and derived metrics. Quiz average is the unweighted mean of each available student/mission pair's latest unambiguous dated score; it is not an official class grade. Quiz activity counts students with a dated saved quiz in the last seven days, not general login or reading activity. Missing, future and ambiguous dates do not create activity or score claims. The activity feed shows at most six dated quiz submissions or mission completions. Loaded-group scope is visible, and unavailable results remain unknown.

## Quiz topic insights

Dashboard Quiz review topics uses the same loaded student group as activity and check-ins. Current signals count students whose latest clearly dated attempt for that mission records a topic. All recorded topics includes historical attempt counts and repeated retries. Duplicate topic labels within an attempt count once; the same ID in different missions remains separate.

Missing, nonpositive, future or tied-latest timestamps exclude the student/mission history from current counts while retaining labelled historical records. Failed reads are unavailable. Group and class sizes are shown; changing groups replaces the insights. Topic names are formatted saved IDs, not per-question error rates or verified mastery. Open Student Progress to inspect an individual report before planning support. No new collection or rules are required. Unit, desktop/mobile and separate-page navigation checks pass; the UI remains local.

## Class management and removal — November 5, 2026

My Classes includes a class overview with description, joined-student count, published activities and a Manage Students action. Student Progress → Class membership → Remove from Class requires confirmation describing the scope. The client transaction rechecks the exact active membership; rules permit removal only by the approved owner of its active class. The roster refreshes and any opened report is cleared.

Removal deletes only classMembers/{userId}_{classId}. It does not delete the account, learning progress, attempts, XP, rewards, feedback or private follow-up records. Membership-based reads are revoked immediately on the server. Existing records can become accessible again if the student rejoins. A current invitation allows rejoining; teachers can rotate or revoke codes in My Classes. Removal is not an account suspension or permanent ban.

Validation: 122 local emulator checks pass, including owner/other-teacher/archive permissions, access revocation, retained progress and rejoining. Desktop/mobile tests cover canceled and confirmed removal, roster/report cleanup and preservation of account/learning records. The revised membership-delete rules and website remain local and are not deployed.
