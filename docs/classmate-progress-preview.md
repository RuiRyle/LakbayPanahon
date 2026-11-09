# Classmate progress preview

This source checkpoint shares development progress. It is not a production deployment or a claim that every local change is compatible with the currently deployed backend and Rules.

## Shared Firebase mode

Serving the repository with VS Code Live Server or another normal static web server uses the existing `lakbaypanahon-1797e` Firebase project. Cloning alone does not connect. The LOCAL EMULATOR banner does not appear in normal mode. Sign in with your own authorized account; do not share passwords or service-account credentials.

Permitted writes affect the real shared database. Do not run seed/reset scripts against that project. No new production Rules, backend, IAM or billing configuration is deployed by this checkpoint. The secure assessment backend is not accepted for public release, so assessment operations may be unavailable. Teacher qualification approval and separate activation were verified using a local Rules overlay; deployed Rules have not been updated to match that policy. Do not use the shared project to test those administrative mutations as if this were a completed release.

## Separate local testing

Use [the emulator guide](local-emulator-guide.md) for synthetic accounts, safe workflow testing and backup/restore instructions. The dedicated launcher supplies emulator configuration and the visible banner. Its accounts/data are separate from the shared project.

## Current acceptance

The owner reports the connected three-role interactions work in their manual walkthrough. See [administrator local acceptance](validation/admin-presentation-acceptance-2026-11-09.md) and the validation directory for automated evidence and limits. Major UI redesigns are frozen. Free public hosting, real credential delivery and hosted acceptance remain unresolved; no billing activation is authorized.
