# Experience improvements: student, teacher and shared learning

Updated 6 November 2026. Prioritize useful learning actions over adding more panels or rewards.

## Student experience

Implemented in this pass: the classroom overview preserves a teacher-selected review topic when opening its lesson. After active practice/activity goals are reached, students have a direct Check explanation and guidance action for a review with a prompt. This opens Activities, resets a restrictive filter, reveals completed history, opens the saved review steps and moves focus to its summary. The existing on-demand check loads the explanation/guidance; no automatic scan of all reflections is added.

The overview uses encouraging copy tied to verified practice-goal completion. It does not award extra XP, assert mastery, require explanation approval to continue, or pretend to know whether an unchecked explanation has been submitted. It offers one review at a time; other reviews remain reachable through Activities.

Next student priorities:

- Check readability of task instructions and retry feedback with actual Grade 5 learners; record confusion rather than guessing from visual style.
- Audit how resume/return links preserve a student's place across lessons, practice and classroom review.
- Improve feedback around actual earned milestones while respecting reduced motion and avoiding distracting repeated celebrations.

## Teacher experience

Recent improvements already available locally: compact outcomes, visible suggested next steps, expandable evidence, specific-topic practice evidence and fewer unrelated reads. Keep teaching context visible when opening a student report or preparing a review.

Next teacher priorities:

- Review large-class performance and make any remaining count/load limits explicit.
- Audit retained planner drafts and switching-class behavior across every publishing form.
- Keep evidence, suggested action and the receiving class/student obvious before sending guidance or assigning work.

## Teacher/student interaction

Implemented in this pass: a direct handoff from successful practice to the student's explanation/guidance checklist. The student does not have to discover that step inside hidden activity history. Teacher-selected focus now survives the classroom overview route as it already did on the full activity card.

Next interaction priorities:

- Follow the loop from a teacher's specific guidance through student response to subsequent evidence; identify where either role loses context.
- Keep missing evidence, delivery, acknowledgement and understanding distinct.
- Prefer helpful private feedback and shared learning purposes over class rank, public scores or new competitive pressure.

## Validation and limits

student-classroom-hub-design.cjs passed 39 assertions at each of 390px and 1440px, including five new handoff checks for topic preservation, direct next action, restrictive filters/history, focus and viewport fit. The simultaneous iframe test captures focus immediately after activation so the other fixture cannot overwrite its observation.

The tested source passes a direct Node syntax check. No database fields/rules changed. This pass does not constitute child usability testing or prove learning effectiveness. These changes and the previous bug/design patch are local, not on the earlier published website.
