# First content proposal: history and its sources

**Local draft only — not published.** Prepared 1 November 2026 for the first adult content review. The Q1.1 classification remains partial pending substantive review.

The current lessons already develop archaeology, inscriptions and source limits. This small proposal makes the definition of history explicit, adds one worked comparison of source types, and checks it through the existing ungraded guide. It adds no new screen or mandatory activity.

The source cards are explicitly fictional examples. This does not label all old documents primary, treat oral memory as infallible, or present a teaching illustration as an authentic historical record. The current communication/inscription/context and non-ranking messages are preserved.

Method references: [National Archives document-analysis guidance](https://www.archives.gov/education/teaching-with-documents), [Smithsonian Archives educational materials](https://siarchives.si.edu/history/education). These are general history-teaching references, not Philippine curriculum approval.

## storyScenes/prologue-mission3-scene1

Before:
```json
{
  "content": "You have learned how land and shorelines can change. Now investigate a different question: how do we know people lived in the islands long ago? Your mission is to build a careful museum explanation using a place, a find and what that find supports.\n\nArchaeology studies past life through objects, remains and the places where they are found. Context means the recorded setting: location, layer and relationship to other finds. A find separated from its context can lose useful information.\n\nStart with the locator. Tabon is at Lipuun Point in Quezon, Palawan. Callao Cave is in Peñablanca, Cagayan, in northern Luzon. These dots locate two sites, not every place with evidence of early people. They do not show an ancient travel route between the caves."
}
```

Proposed:
```json
{
  "content": "You have learned how land and shorelines can change. History studies people and events in the past using evidence. Now investigate a different question: how do we know people lived in the islands long ago? Your mission is to build a careful museum explanation using a place, a find and what that find supports.\n\nArchaeology studies past life through objects, remains and the places where they are found. Context means the recorded setting: location, layer and relationship to other finds. A find separated from its context can lose useful information.\n\nStart with the locator. Tabon is at Lipuun Point in Quezon, Palawan. Callao Cave is in Peñablanca, Cagayan, in northern Luzon. These dots locate two sites, not every place with evidence of early people. They do not show an ancient travel route between the caves."
}
```

## storyScenes/chapter4-mission1-scene1

Before:
```json
{
  "content": "Communication means sharing a message or idea. People can communicate through spoken words, stories, signs and writing. These forms can serve different purposes.\n\nAn oral account is shared through speech. An inscription is writing marked on an object or surface. Ask who produced each source, in what setting, and what it can help explain.\n\nA missing written record does not mean a community had no knowledge or history. Compare the sources available instead of ranking people by the records that survive.",
  "sourceUrls": [
    "https://www.nationalmuseum.gov.ph/2022/10/21/baybayin-ancient-and-traditional-scripts-of-the-philippines-gallery/",
    "https://www.nationalmuseum.gov.ph/our-collections/ethnology/mats-and-baskets/",
    "https://ncca.gov.ph/about-culture-and-arts/culture-profile/intangible-heritage/"
  ]
}
```

Proposed:
```json
{
  "content": "History is the study of people and events in the past. We ask questions and investigate sources: traces and records that help us learn about earlier life. Communication means sharing a message through speech, stories, signs or writing.\n\nAn oral account is shared through speech; an inscription is writing marked on an object or surface. Ask who made or shared each source, when, and what it can help explain.\n\nWorked example - fictional practice cards: a letter records a written message; a recorded interview preserves a person's recollection; a drawing made for this lesson is a modern teaching illustration. The drawing can explain an idea, but it does not by itself prove how the past looked. Ask questions about the time and memory behind the recollection too.\n\nA missing written record does not mean a community had no knowledge or history. Compare the sources available instead of ranking people by the records that survive.",
  "sourceUrls": [
    "https://www.nationalmuseum.gov.ph/2022/10/21/baybayin-ancient-and-traditional-scripts-of-the-philippines-gallery/",
    "https://www.nationalmuseum.gov.ph/our-collections/ethnology/mats-and-baskets/",
    "https://ncca.gov.ph/about-culture-and-arts/culture-profile/intangible-heritage/",
    "https://www.archives.gov/education/teaching-with-documents"
  ]
}
```

## missions/chapter4-mission1

Before:
```json
{
  "learningGuide": {
    "chapterId": "chapter-4",
    "missionId": "chapter4-mission1",
    "refs": [
      "Q1.1",
      "Q1.2"
    ],
    "question": "How do writing, language and translation give us different clues?",
    "why": "A script is not the same as a language, and a translation involves interpretation. Comparing them helps us read historical claims carefully.",
    "task": "A source card includes a written object, a transcription and a translation. Why label them separately?",
    "choices": [
      "They have different roles in examining the source.",
      "A translation is the original ancient object.",
      "One sample proves all communities used the same script."
    ],
    "feedback": [
      "Keep the original, its written representation and its interpreted meaning distinct.",
      "A translation represents meaning; it is not the material object.",
      "A particular example does not establish universal use."
    ],
    "answer": 0,
    "referenceNote": "Editorial locators in Grade 5 MATATAG August 2023; not official competency codes or certification."
  }
}
```

Proposed:
```json
{
  "learningGuide": {
    "chapterId": "chapter-4",
    "missionId": "chapter4-mission1",
    "refs": [
      "Q1.1",
      "Q1.2"
    ],
    "question": "How do writing, language and translation give us different clues?",
    "why": "A script is not the same as a language, and a translation involves interpretation. Comparing them helps us read historical claims carefully.",
    "task": "The fictional practice cards describe a letter, a recorded interview and a drawing made for this lesson. Which card represents the modern teaching illustration?",
    "choices": [
      "The drawing made for this lesson.",
      "The letter, because it is old.",
      "The interview, because someone speaks."
    ],
    "feedback": [
      "The label identifies the drawing as a modern teaching aid. Compare related evidence before making a claim about the past.",
      "The letter card represents a written message. Ask who wrote it, when and for what purpose. Age alone does not answer every question.",
      "The interview card represents a person's recollection. Ask what was remembered and when the account was recorded."
    ],
    "answer": 0,
    "referenceNote": "Editorial locators in Grade 5 MATATAG August 2023; not official competency codes or certification."
  }
}
```

## Reviewer decision

Check: Is the definition understandable for Grade 5? Does the fictional comparison clarify different sources without implying every letter is authentic or every memory accurate? Is it clear that the modern illustration is not historical proof? Does the ungraded question check something actually taught?

Outcome: needs correction / suitable to publish for supervised playtest / specialist input needed.

Reviewer/date and specific rationale: __________

After any approved change, verify the exact live baseline and preserve unrelated fields. Do not replay an older content migration or change scores/progression to apply this proposal. Real learner understanding remains a separate observation.