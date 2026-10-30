# Era 3, Chapter 9 Mission 1: Tribute and Colonial Taxation

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status and roadmap

Built locally on 28 October 2026. Unpublished. No live Firestore requests, writes, test accounts or Hosting deployment. Database availability has not been rechecked. Earlier pending publications remain necessary before this migration is applied.

This release creates Era 3, Economic, Social, and Cultural Changes Under Spanish Rule, and Chapter 9, Colonial Economic Life and Policies, with only Mission 1. The roadmap calls for five missions in Chapter 9. Missions 2-5, the chapter challenge, Chapters 10-11 and their rewards are not fabricated or marked complete.

## Learning design

Six illustrated scenes cover tribute as a required payment, goods in selected collections, household burdens, rules versus collection records, change in taxation, and a five-topic recap. Every scene has three clues, a decision, feedback, vocabulary and authored Explain help. Five accessible SVG teaching guides are modern diagrams rather than original documents, tribute objects or universal payment schedules.

The household comparison uses explicitly fictional supply tokens: ten minus two leaves eight, while five minus two leaves three. This makes resource differences visible without presenting an invented historical tax rate, asking for personal family finances or rewarding extraction. Payment is not treated as approval. A complaint is not treated as proof of its final resolution. One documented example is not a rule for all places and periods.

The tax-transition scene follows the cited Aguilar study: tribute ended in 1884 and cedulas personales were instituted in 1885. The scene distinguishes these stages and does not claim that every tax ended, every payer had one rate, or this is modern tax guidance.

The quiz selects five medium questions, one per topic, passing at three correct. Ten main-bank items give two finite variants per topic; ten separate easy/hard practice questions support mapped lesson review and existing practice policy. Configured reward is 50 XP and the symbolic Tribute Investigation Journal, using existing one-time reward behavior. Instructional data comes from Firestore after publication; local JSON is authoring input.

## Publication and access

- data/chapter9-mission1-lessons.json and data/chapter9-mission1-assessments.json: authored inputs.
- functions/build-chapter9-mission1.cjs: repeatable local builder.
- data/chapter9-mission1-migration.json: 31 creates, including the era and chapter; no existing catalog fields are overwritten.
- functions/apply-chapter9-mission1.cjs: original project only; dry run by default; --apply performs an atomic commit, rollback snapshot and field readback.

Seven publication prerequisites require active Chapter 8, its challenge, badge and four missions. These are deployment-order checks, not new student locks. Student access follows the existing independent-era policy: the first ready chapter of a new era can be entered without completing the previous era. Completing Mission 1 alone does not complete Chapter 9 or make a nonexistent challenge available.

Publish earlier releases in sequence, including Chapter 8 Missions 1-4 and challenge. When database availability and prerequisites are confirmed, run the apply script without flags and inspect its dry run. Use --apply to commit, then repeat the dry run to verify zero changes. Review collisions rather than bypassing preconditions. No live preflight, commit or authenticated walkthrough has run.

## Sources and review limits

- [The Philippine Islands, Volume VII, 1588-1591](https://www.gutenberg.org/cache/epub/13701/pg13701-images.html): translated colonial accounts provide examples of payments in goods, collection and debates. Colonial categories, religious judgments and claims of authority are not adopted as neutral descriptions of community worth. The lesson paraphrases limited examples and does not reproduce derogatory passages.
- [Kristyl Obispado, The 16th century Carrera del Pacifico, Philippine Review of Economics 60(2), 2023](https://pre.econ.upd.edu.ph/index.php/pre/article/viewFile/1046/970): page 115 discusses textiles, early tribute and household production. Selected forms are not universal rates, dimensions or obligations in this mission.
- [Filomeno V. Aguilar, The Termination of Tribute in the Spanish Philippines in 1884, 2023](https://archium.ateneo.edu/history-faculty-pubs/114/): institutional repository abstract establishes the 1884/1885 distinction and economic-capacity basis of the later system. Full procedural details and exemptions are not reconstructed from the abstract.

Historical, teacher, curriculum alignment and Grade 5 readability review remain pending. Introductory examples do not establish complete coverage of colonial taxation or classroom learning effectiveness.

## Verification

All 223 non-emulator unit checks passed. The six-scene Chrome fixture passed clue exploration, decisions, authored help, image loading and recovery. Tests cover topic coverage, finite retries, separate adaptive practice, mapped review, labelled resource model, dated tax changes, independent-era access and no premature chapter completion. Migration syntax passed. Fixtures use mocked Firestore; live security, publication and an authenticated student walkthrough remain pending.

Next: Chapter 9 Mission 2, Polo y Servicios and Bandala. Keep labor service and compulsory produce delivery distinct, with dated evidence and no universal unqualified rate.
