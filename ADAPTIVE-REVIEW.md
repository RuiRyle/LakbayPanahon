# Student adaptive review

The dashboard's Topics to Review panel and the practice page use saved Firestore practice records. No Cloud Function, new collection, index, or security-rule change is required for this feature.

## Data used

Each active `practiceQuestions` document needs the existing `missionId`, question/options/answer fields, and:

| Field | Purpose |
| --- | --- |
| `topic` | Non-empty topic identifier or text; connects questions to a review topic |
| `topicLabel` | Optional student-friendly display name; falls back to `topic` |
| `difficulty` | Existing practice schema: `easy`, `medium`, or `hard` |
| `order` | Numeric order used as a stable tie-breaker and by regular practice |
| `status` | `active` for questions currently available |

Question content, topic identifiers, display labels and difficulty tags are loaded from the database. The existing difficulty-selection algorithm remains code. No historical topics or questions were added as hardcoded content, and no live content was edited.

The interface only recommends questions with a current, non-empty topic. Missing or invalid difficulty tags keep practice in its existing regular-order mode. Existing missions and chapters determine the practice links; their access checks still apply.

## Behavior

- The dashboard reads the current student's `studentPracticeProgress` records and displays topics with first-attempt mistakes.
- Only the latest saved result for each question counts. A later first-try success replaces that question's older mistake; unpracticed questions keep their recommendations.
- Topics are grouped per mission. Renaming a question's topic/label in Firestore updates its presentation; inactive/deleted questions stop contributing.
- Practice Again passes the mission, chapter and topic in the URL. The practice page validates access and filters to matching active questions. An unavailable topic displays a clear empty state.
- Practice difficulty adjusts using the existing performance-based selector when the available questions have valid tags.
- Finishing saves the same append-only practice session schema as before, then reloads recommendations. A failed save leaves the retry button available and does not claim that the student's review record was updated.
- The dashboard can refresh its review list, and reopening it reads the latest saved records. It shows an error state if history cannot be loaded.

Review is based on practice attempts, not a claim of proven mastery or question-level mission-quiz analysis. Practice does not award XP or alter mission completion.

## Verification

16 targeted/unit regression tests passed, including the new review tests and existing journey/profile tests. A headless Chrome test with mock Firestore data passed for targeted practice, database labels, saving, clearing resolved mistakes, retaining unpracticed topics, links, and history failures. JavaScript syntax checks passed. Live question metadata has not been audited.

```powershell
node --test tests/student-review.test.cjs tests/student-journey.test.cjs tests/student-profile.test.cjs
node tests/student-review-browser.cjs
```

## Live acceptance

1. Reload the updated frontend with Ctrl+F5. Publish the changed HTML/CSS/JavaScript too if using a separate host.
2. Complete practice with at least one first-attempt mistake on a question with a topic.
3. Open the dashboard and check Topics to Review.
4. Choose Practice Again and verify only that topic's questions appear.
5. Complete them correctly on the first attempt, wait for the saved status, and return to the dashboard.
6. Confirm resolved questions no longer contribute mistakes; other topics remain.
7. Log out and return to verify the recommendations come from saved records.
