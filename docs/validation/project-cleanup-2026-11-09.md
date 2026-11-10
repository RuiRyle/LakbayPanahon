# Development folder cleanup

9 November 2026. Removed **142 obsolete generated `build/student-web-*` directories**, totaling **14.25 GiB** of file sizes. These were untracked, not referenced by scanned project docs/tools/tests/functions/experiments, not mentioned by running process command lines, and outside the eight most recent builds. Every deleted target was validated as a direct child of the workspace build directory with a release manifest and public folder; linked paths and tracked files were refused.

Kept source code, tests, assets, validation evidence, local backups, dependencies, verified Node 22, accepted release/Stage 0 packages, referenced historical builds and active preview/emulator packages. Archived removed manifests and exact paths/byte counts in `build/cleanup-20261109-115251/removed-builds.json` and adjacent manifest files. Generated public assets from those copies are deleted; they can be rebuilt from source, but their exact historical bytes are not retained.

Post-cleanup: all 142 targets absent, required packages/backups present, accepted Stage 0 integrity validation passed, and local login page returned HTTP 200. The cleanup inventory is local generated output and is ignored by Git.

Maintenance: `tools/cleanup-old-web-builds.ps1` defaults to inspection; `-Apply` performs the same bounded cleanup. It requires readable process command lines to protect active builds. Historical source experiments were retained because their evidence and potential dependencies remain relevant; this pass does not classify every old source module as removable.
