# Teacher workflow release preparation

Prepared package: `build/student-web-XA9sUT/public` (31 pages, 568 files). No deployment performed.

The release inventory originally omitted the four new teacher destination pages from its entry allowlist. The audit was corrected to include them explicitly, then a fresh package was staged and hash-verified. All five teacher destinations served over the local package server with CSP; rules, manifests and documentation were inaccessible through it.

The offline rules comparison reconstructs the last recorded qualification publication from its backup plus its published decision-function scope. The reconstruction matches publication hash `1cd3e6535405c0dedaeb972b4528c49e66c315539523cf7097161e193d770f01`. Candidate hash is `77e38891c0b631d568ce08be7dfb017f32dc4c27ae8f2303d768f0132f211a4b`. Changed scopes are classMembers, validPublication, classFeedback and teacherSupportNotes. Other named scopes and text outside named scopes match. The 129-check emulator evidence matches this candidate hash.

The package review checks source/manifest hashes, required teacher destinations and generated Hosting configuration. The exact teacher HTML was rechecked in desktop/mobile browser tests after the final cache-version change. No live release or external account was modified, and live baseline drift is still unverified.

Next: fresh live rules comparison and a matching publication procedure, then hosted acceptance after authorized activation. Do not use older publishers with this candidate. This handoff does not claim current full-site staged role acceptance or actual human teacher/student validation.
