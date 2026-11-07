# Era Overview visual refinement

Reuses `assets/story/chapter3-mission1-scene1.png` as the Precolonial hero, showing existing lesson artwork of coastal settlement and maritime activity. This is an editorial lesson illustration, not a newly researched historical reconstruction. The image fills 44% of the desktop header with a cover crop and becomes a 190px scene on phones. Original PNG remains unchanged; it is approximately 3 MB and further image compression remains a performance opportunity.

Later eras retain distinct explicitly symbolic fallbacks. Comparable detailed local scenes for exploration/colonial encounters, colonial social/economic change and resistance/national consciousness were not found. Those historically reviewed assets remain needed; unrelated stock images or unreviewed new scenes were not inserted.

Desktop chapter cards now have three areas: milestone and optional existing chapter-scene thumbnail; original title/description and saved mission meter; existing completion status and action. Mobile stacks the action below the content. Chapter titles dominate, repeated labels are moved to the action area, and redundant card minimum heights are removed. Gold route and teal completion states remain restrained. Existing descriptions, data queries, progress calculations, routes, prologue behavior and unlocking rules are unchanged.

Validation: 20 responsive assertions at 1920/1440 and 18 at 768/390 (76 total), including full-size hero crop, compact desktop card height, nonoverlapping action column, percentage, saved mission evidence, locked behavior and routes. Existing era overview browser regression passed, as did 16 shared progression/routing tests. Desktop/mobile screenshots were inspected. Fixtures use synthetic chapters and progress, not production learner accounts.

Final package: build/student-web-XeiXIb/public, 592 files, zero missing/rejected references. Nothing deployed. Changes are limited to selected-era presentation and its validation files.
