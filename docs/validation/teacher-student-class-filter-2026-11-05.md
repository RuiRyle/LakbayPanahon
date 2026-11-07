# Student Progress class filter

Student Progress presents All active classes or a specific owned class directly. The all-class view lists active class cards and loads each class's roster on request, up to 20 memberships per group, with previous/next and refresh controls. It avoids automatically fetching every student's learning report across classes. Names that fail to load remain unavailable. An empty roster is distinguished from an unloaded or failed roster.

Report links contain class and student parameters; the destination rechecks owned active membership. Specific-class selection restores the existing searchable roster, reporting and removal controls. Switching to All active classes clears the selected report and URL parameters. Students in multiple classes are shown per membership rather than counted as unique students. Async responses are guarded by account epoch, roster request identity and mounted content.

Desktop/mobile teacher browser checks pass, covering class filter state, empty rosters, loaded names, report link context and failed-refresh isolation. Separate document navigation/report tests pass. No rules, database fields or real learner records were changed. Website changes remain local and unpublished.
