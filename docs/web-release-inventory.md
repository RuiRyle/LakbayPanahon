# Local website release inventory

Run `node functions/audit-web-release-local.cjs` from the project root. This local-only command creates `docs/validation/web-release-local.json` with an explicit file inventory and dependency findings. It does not deploy, copy a release folder, authenticate or use Firestore.

Latest 30 October result: 23 entry pages, 429 selected files, zero missing static references and zero rejected references. This includes the 404 recovery page, optional Bayani backend client and explicit Settings/student-shell public destinations. Checked local HTML src/href, CSS url() and JavaScript module imports. Firestore-selected images are included from the assets tree; their live metadata is not checked by this inventory.

The inventory excludes root documentation, backups, authoring JSON, functions, private `server/` code, tests, Firebase configuration/rules and local preview/audit HTML tools. Four focused boundary checks cover server/private-directory exclusion, allowed public client modules and Settings/student-shell entry coverage. Shared teacher/admin role-redirect pages remain included; their workflows are not certified by this student audit. This allowlist protects a staged public package, not a Live Server instance serving the repository root; real credentials must remain outside the workspace.

Before an actual release, rerun the audit and review the resulting inventory. Use a staging directory populated only from reviewed files. Do not set the repository root as the Hosting public directory. Root Firebase deployment settings remain unchanged; the latest package has a separate proposed Hosting-only configuration. No website deployment was made.

Limitations: computed JavaScript links, generated HTML, CSS @import, remote URLs, live Firestore content, broken images on the server, and runtime behavior need separate checks. Existing static dependencies and a clean file inventory are only one part of release readiness.


## Local staging build

`node functions/build-web-release-local.cjs` reruns the dependency audit and validates publishable paths. Add `--build` to create a fresh `build/student-web-*/public` directory; existing packages are never overwritten or deleted. A SHA-256 manifest is saved beside public, not inside it. Sources are copied byte-for-byte with hash verification. Generated packages are Git-ignored.

Latest recorded build: `build/student-web-wGGfja/public`, 429 hash-verified files. The sibling `firebase.json` contains the proposed site ID `lakbaypanahon-1797e`, script-hash CSP and other security/cache headers; this Hosting destination has not been verified or activated. The sibling manifest/config are outside public. No Firebase request or deployment occurred during the build. Earlier package folders are stale snapshots. The package does not publish queued Firestore changes or resolve pending curriculum/acceptance checks; regenerate after website edits.

`node tests/student-hosting-config-browser.cjs build/student-web-wGGfja` checks the 404 and injected-script CSP behavior using a loopback-only server and Chrome. This fixture's server rejects paths outside the manifest. The separate public-inventory tests verify private code/backups are excluded from the package. Real authenticated page/App Check/provider behavior under Hosting headers still needs acceptance before deployment; Live Server does not apply these Hosting headers.
