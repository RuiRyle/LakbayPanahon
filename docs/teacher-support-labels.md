# Evidence-based support labels

Updated 6 November 2026. Implemented locally.

Teacher quiz check-ins and individual report support summaries distinguish:

| Label | Evidence meaning | Next step |
| --- | --- | --- |
| Results unavailable | The read failed; no learning judgment is made | Refresh before deciding support |
| No quiz evidence yet | No saved quiz attempts; not automatically inactivity or difficulty | Help the student begin available learning |
| Evidence needs checking | Missing, tied or future quiz dates prevent a definite latest result | Check dates/history with the student |
| Review suggested | An unambiguous latest dated attempt is unsuccessful or records topics to revisit | Discuss the dated topic and ask for a supporting clue |
| No current quiz review signal | Available latest results do not flag a topic; not proof of mastery or attendance | Ask for an explanation or another example |

Quiz evidence dates appear in Philippine time. Per-mission review suggestions show their own evidence timestamp. The latest valid quiz record is explicitly not a last-attendance record. Mixed cases retain legitimate review signals for one mission while explaining uncertainty in another.

Awaiting follow-up remains an independent state in the intervention timeline: guidance sent without a later attempt is not a failed intervention. No inactivity threshold or inferred attendance status is added because absence of quiz records cannot establish absence from the website.

Teacher quiz signal selection now excludes future timestamps from definite latest results, matching the student-review date safeguards. These are derived labels, not stored assessment decisions. No new fields, requests, grades, alerts or automatic assignments are added.

Validation: teacher-support-policy.test.cjs passed five tests, including future/tied/missing evidence and mixed-mission signals. Responsive teacher-dashboard-design.cjs and teacher-student-progress-design.cjs passed. No production deployment. Older frontend/rules changes still require coordinated publication.
