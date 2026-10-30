# Chapter 2: a dated account of women's roles

30 October 2026. **Local draft; not published to Firestore.** Seven existing Mission 2 records are revised: Scenes 1 and 6, mission objectives/recap, both medium spiritual-leadership quiz variants, and its easy and hard practice items. No dependency on the separate unpublished Mission 1 family draft is required.

## Evidence and limits

The translated [1589 Tagalog relations by Juan de Plasencia](https://www.gutenberg.org/files/13701/13701-h/13701-h.htm), under “Relation of the Worship of the Tagalogs,” describe a ritual specialist called *catolonan* and state that a woman or man could hold the role. The relevant passages are printed pages 179 and 181–182; the volume groups the two relations under 1589, with the first signed 21 October. We use the year, not a separate signature date for the worship account.

The [NCCA Sagisag Kultura entry on babaylan](https://philippineculturaleducation.com.ph/babaylan/) supplies modern cultural context, including regional terms and women and men in these roles. The historical spelling *catolonan* is retained when discussing the translated account. Regional terms are related; the fictional scene is not a record of the same people or setting.

Plasencia was a Spanish missionary writing after Spanish arrival. His religious judgments and sweeping claims are not adopted as facts. The lesson paraphrases only the role information, identifies his viewpoint and date, and makes no claim that the account proves conditions in every community before contact. Raw primary text contains disparaging and graphic material; its URL remains editorial metadata. Current story rendering does not turn `sourceUrls` into child-facing links. Students are not asked to perform rituals or disclose beliefs.

Q1.7 remains **partial**. This adds one dated cultural example and matching assessment. Wider economic/social contributions, regional comparisons, historical review and Grade 5 comprehension remain open.

## Learning sequence

Scene 1 introduces the imagined gathering, then a dated Tagalog source card, followed by a check about women and men in the role. Scene 6 connects the written account with the existing artifact and tradition examples. Main quiz checks the reported role; retry applies it to a museum label. Easy practice recalls the role, while hard practice combines the imagined scene and dated report without treating them as one event. Each incorrect practice choice has a targeted hint and explanation.

Both existing quiz variants are revised so whichever is selected addresses the new teaching. The five-question blueprint, topic IDs, answer letters, difficulty labels, rewards, progression and practice evidence requirements are preserved. The old scene's mismatched quick-check explanation is corrected. Mission objectives retain continuity/change teaching.

## Local validation and publication

Authored text is in `data/chapter2-women-role-learning.content.json`; the browser continues to read Firestore content. Build and review with:

```powershell
node functions/build-chapter2-women-role-learning.cjs
node functions/apply-chapter2-women-role-learning.cjs
node tests/chapter2-women-role-learning.test.cjs
```

The publisher defaults to local checks. It reconstructs the dated snapshot with the published beliefs, question feedback, practice feedback and reading overlays. Every mutation has an old-value or absent-field guard. Future explicit live modes use document update-time preconditions, an atomic write, backup and readback. No live mode was run for this draft. Content changes can invalidate affected unfinished drafts under the existing version policy; completed rewards are not rewritten.

Teacher/history review and Grade 5 comprehension review remain pending. Passing structural tests does not establish instructional effectiveness or historical approval.

Local validation on 30 October: all 10 focused tests passed; all seven updates matched the reconstructed local baseline. The candidate catalog reported 66 missions, 388 scenes and 330 topic slots with zero missing images, structural topic gaps or invalid scene choices. The curriculum index reported no locator errors and retained 13 mapped / 13 partial areas. No live Firestore or browser walkthrough was performed for this draft.
