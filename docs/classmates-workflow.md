# Classmates directory

The student My Class page offers an optional shared display name for each class. Students open “Show classmates” to load names, search the loaded directory, save a name, or hide their name. Names are student-chosen nicknames, not verified identities. The count represents shared names, not total enrolment. Up to 100 entries load on demand; no polling runs.

Firestore path: `classes/{classId}/classmates/{studentId}`. Document ID is the Firebase user ID. The only attribute is `displayName` (string, required, 1–60 characters). Class and student relationships are encoded in the path. No email, score, feedback, invitation code, or private profile field is copied into this directory.

Active student accounts with membership in the class can read its directory and create/update only their own entry. The owning approved teacher can read and delete entries. Students may delete their own entry. Student leave and teacher removal delete the directory entry together with membership; rules require directory removal before membership deletion can succeed. Existing members appear only after sharing a name.

Rules have been applied to the local emulator only. Online publication requires the updated rules and all affected clients (`my-class.js`, `student-feedback.js`, `student-class-client.js`, `teacher-class-client.js`) together. Older leave/removal clients cannot remove a membership with a directory entry attached. Classmate rendering lives in the existing `student-feedback.js` module so an older running preview can load it without adding a new module URL to its fixed file list.

Validation: `node tests/classmates-emulator.cjs` checks member-only access, own-name writes, rejected extra fields, impersonation prevention, and departure cleanup against the local emulator using a temporary fixture class. It preserves user-created classes.
