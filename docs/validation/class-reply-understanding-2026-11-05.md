# Classroom replies and understanding — 5 November 2026

Local changes only; no production deployment.

- Contextual reply indicator opens the correct assignment's help panel.
- Students choose “I understand” or “I still need help” privately after a teacher reply.
- Student acknowledgement transactions validate request revision and reply timestamp; only the understanding fields may change.
- Teacher inbox loads up to 100 requests once when the selected class roster renders. Unanswered and unresolved requests appear first, and the heading shows the number needing a response in that loaded group. Refresh is explicit; no background polling runs.
- A teacher may give another explanation after a `needs-help` response. New guidance clears the student response and updates the waiting count without discarding drafts in other reply forms.
- Teacher updates indicates unread feedback from its existing read acknowledgement and new announcements using a browser-local content fingerprint. Announcement viewing is not synced across devices.
- These signals do not change quiz grades, mission completion, or XP and are not proof of understanding.

Validation: 16 local help/understanding rules checks; existing 22 policy/evidence checks, 10 targeted-review privacy checks, and 8 classmate checks remain passing. The real-browser local workflow covers student reply navigation and the unresolved teacher inbox in addition to the earlier class-goal/review checks. It uses disposable fixtures and synthetic scores; user-created classes are retained. Dictionary audit and staged website build pass.

Known boundary: the indicators update on page/class refresh and acknowledgement actions; there is no live listener, push notification or email delivery. An inbox with 100 records explicitly notes its limit. Opening teacher help on the Students page remains scoped to the selected class.

The emulator-only Firestore initialization now forces long polling after repeated local browser runs exposed a stalled streaming connection on teacher-page navigation. Production still uses its existing `getFirestore` initialization. The three environment tests verify default production routing, isolated emulator routing with the transport option, and fail-closed host/project checks. The browser check also covers another teacher explanation resetting the student's response and updating the pending count.
