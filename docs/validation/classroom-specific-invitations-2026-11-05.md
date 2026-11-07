# Classroom-specific invitations — 2026-11-05

Each class invitation code is a unique 12-character document ID mapped to one immutable classId. Issuance checks collisions and changes the selected class pointer atomically; replacement revokes its prior code. Class rules now reject a currentJoinCode belonging to a different classroom. Student membership rules independently require the invitation classId and current code to match the requested classroom.

The selected classroom invitation heading explicitly names that classroom and explains that its code joins only that class. New code documents carry optional className/teacherName snapshots validated against the owning classroom at issue time. Existing codes remain compatible and show a generic class confirmation until replaced. Snapshots describe names when issued; later renaming does not rewrite them automatically.

Student joining asks for confirmation after validating the code and before writing membership. Cancel writes nothing. Final membership security rules still check expiration, status and current code, so a revoked/expired code cannot enroll a student after confirmation.

Validation: 7 student-class-client unit checks pass, including cancellation and separate code targets. Local invitation emulator test verifies valid generation, rejects cross-class code adoption, rejects wrong-class enrollment, and accepts matching-class enrollment. Temporary test classes and membership documents are removed. Browser regression checks cover the selected teacher invitation UI. No production rules deployment; current local emulator rules and preview are updated.
