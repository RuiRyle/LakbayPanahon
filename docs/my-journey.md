# My Journey

Student navigation now opens pages/my-journey.html instead of the Home dashboard anchor.

The page provides the existing next-step recommendation (lesson/quiz/practice/chapter challenge resume), owned mission/chapter progress, an expandable path grouped by era, prerequisite-aware lesson/challenge links and personalized review topics.

Runtime data comes from the existing eras, chapters, missions, chapterChallenges, studentProgress, studentChapterProgress, studentQuizAttempts, studentLearningDrafts, studentPracticeProgress and practiceQuestions collections. Student records are queried by the current userId. The existing resolveStudentJourney/renderStudentJourney and missionReviewTopics functions supply recommendations. No curriculum or learner progress was hardcoded or migrated.

Each era begins independently. Inactive/missing parent eras are omitted; chapters being prepared remain unavailable and do not block later ready chapters, matching current access behavior. Mission links require all previous missions; challenge links require all chapter missions. Only owned completed records affect progress.

Core read failures hide incomplete progress and provide Refresh Progress. Optional draft/practice read failures preserve the core path and report unavailable guidance instead of claiming no weak topics. Session/request generations discard late responses, and returning from browser history refreshes the page.

Verification: 62 unit tests passed, including three path eligibility tests. The focused desktop Chrome suite passed next-step practice/quiz resume, owned progress, locked links, review topics, safe content rendering, optional/core read failures, retry, sign-out races and desktop overflow. [Preview using test fixtures](validation/my-journey-preview-2026-10-27.png). This preview uses sample test records; the application reads Firestore. Live acceptance of this new page and Hosting deployment were not performed for this change.
