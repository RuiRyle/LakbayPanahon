# Teacher-wide dashboard starting point

The dashboard without a class URL parameter now lists all owned classes with direct page links, active/archived state and on-demand class summaries. The class dashboard retains its learning insights and has an All Classes return link. No-class users retain their create-class onboarding. Student identity/results are not fetched across all classes automatically, and failed summary reads are explicitly unavailable.

Local teacher browser checks pass at 390px and 1280px, including the teacher-wide state, direct class links and saved summary counts. Existing classroom workflows and separate-page navigation remain covered. These tests use mocked Firebase records; website changes remain local and unpublished.

This is the first refinement in the authorized sequence. All-class reporting filters, browsing lessons before class creation and receiving-class selection during publishing remain subsequent work.
