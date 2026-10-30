# Chapter 13 Mission 2: Colonial Reforms and Their Effects

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

Locally authored and checked on 2026-10-28. Not published to Firestore or Hosting.

Six scenes guide students through reform aims, methods and effects; the economic society established in 1781; government income and producer burdens under the monopoly; the company charter of 10 March 1785; and a comparative reform report. Students open three clues, make a decision and use authored Explain help. Five labelled modern teaching diagrams are not presented as original documents.

Source boundaries:

- [Macawili (2025), historical research on the economic society](https://rmrj.usjr.edu.ph/rmrj/index.php/RMRJ/article/download/2048/331/11131): the founding year and economic-development context, with periods of inactivity. Later educational achievements are not assigned to the founding year. The 1852 statutes are not presented as verbatim 1781 rules.
- [National Tobacco Administration historical account](https://www.nta.da.gov.ph/tobacco/): revenue aims, production requirements and complaints. Promotional passages, stereotypes and graphic punishments are excluded. The activity does not encourage tobacco use or reward production.
- [University Complutense catalogue of the 1785 charter](https://patrimoniodigital.ucm.es/s/patrimonio/item/638918): document type, date and institution. The lesson explicitly examines catalogue information and does not claim that all charter clauses or operational effects were reviewed.
- [Intramuros Administration](https://intramuros.gov.ph/2015/01/04/intramuros/): the earlier trade route continued until 1815. A new institution does not by itself prove the immediate disappearance of every older practice.

Five main-quiz questions cover five topics; ten medium variants support equivalent retries. Ten separate easy/hard practice questions use existing adaptive review policy. Pass with three correct answers. The finite bank cannot guarantee unlimited unseen retries. The existing one-time reward flow is configured for 50 XP and a Reform Evidence Journal token.

Authoring inputs: data/chapter13-mission2-lessons.json and data/chapter13-mission2-assessments.json. Rebuild using node functions/build-chapter13-mission2.cjs. Runtime content remains in Firestore; local files are authoring and migration inputs.

Publication: 31 changes, comprising 29 new documents and two catalog-description updates guarded against Mission 1 descriptions. Nine prerequisites retain the prior Chapter 12 release and Chapter 13 Mission 1. Existing journey logic requires the learner's own Mission 1 completion. No learner records or chapter completion reward are written by this migration. The apply script was syntax checked only. Its default dry run would still make live database reads, so neither dry run nor apply was executed.

Validation: 315 non-emulator checks passed. A mocked-data Chrome walkthrough passed all six scenes, images, clue exploration, decisions, authored help and recovery. Independent teacher/curriculum review, authenticated live walkthrough, ordered publication and Hosting deployment remain pending. Local checks do not verify deployed permissions or live operation.

Next: Chapter 13 Mission 3, International Events and the Spread of New Ideas.
