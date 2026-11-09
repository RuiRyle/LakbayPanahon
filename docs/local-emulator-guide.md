# Local Firebase testing

Start in the VS Code terminal at `C:\LakbayPanahon`:

```powershell
node tools/start-local-emulator.cjs --secured
```

Wait for **LOCAL EMULATOR WEBSITE**, then open:

- Website: http://127.0.0.1:4173/pages/login.html
- Emulator data/account viewer: http://127.0.0.1:4000

| Local account | Email | Password |
| --- | --- | --- |
| Approved teacher | teacher@lakbay.local | LakbayLocal123! |
| Student | student@lakbay.local | LakbayLocal123! |
| Pre-created administrator | admin@lakbay.local | LakbayLocal123! |

The administrator signs in with the seeded account; there is no public admin registration. This account is created only when a fresh local session is seeded, not added automatically to an already running session.

Use separate browser profiles for teacher and student. These credentials exist only in the local Auth emulator; use no real account credentials here. A gold LOCAL EMULATOR banner identifies this environment.

## What the launcher does

Builds a fresh public package and starts Auth (9099), Firestore (8180) and, with `--secured`, assessment Functions (5001) for `demo-lakbay-local`. Secured mode uses the prepared Stage 0 backend and protected rules, seeds three synthetic roles and the repository's offline history catalog, and serves a loopback website on port 4173. It requires the validated package at `build/priority3-stage0-release`, its installed dependencies and the verified Node 22 runtime at `build/node22/node-v22.23.4-win-x64`. Java 21 and Firebase CLI are also required. Ports 4000/4400/4500/9150 are used by the emulator suite. Full secured-launch integration acceptance is still pending.

All seeding endpoints are literal 127.0.0.1 addresses and the project is fixed to demo-lakbay-local. The seed does not authenticate to or export production Firebase. Seeded teacher email/approval is a local fixture, not a real professional credential review. Catalog content comes from the repository's offline snapshot, not a fresh online export. Real email delivery and paid AI calls are not running. Functions run locally only with `--secured`; without that option, assessment calls fail locally. Emulator App Check behavior does not prove production attestation. Firebase SDK scripts still download from Google's CDN, so this is local database testing, not a completely offline application.

## Stop or return to the normal website

Before stopping a session whose progress you want to keep, run this in another terminal:

```powershell
node tools/backup-local-emulator.cjs
```

The tool creates a new Auth/Firestore snapshot under `build/local-backups` and prints its name. It does not overwrite older snapshots. Stop activity while taking a backup; this is not an atomic snapshot across both services. These local exports contain account and learning data; keep them local and use synthetic records.

After stopping the original launcher, restore the printed snapshot name:

```powershell
node tools/start-local-emulator.cjs --secured --restore=2026-11-09T03-46-09-462Z
```

Replace the example name with your snapshot. Restore skips seeding and imports the saved accounts/progress. Only marked snapshots directly under the local backup directory are accepted. There is no automatic continuous persistence: changes since the last backup are lost on shutdown. The normal fresh-launch command still starts new synthetic data.

Press **Ctrl+C** in the launcher terminal. Local accounts and data reset on restart; there is no automatic import/export to the real database. Do not close the terminal while you want to keep testing. If another application uses one of the ports, stop that application's process or resolve the conflict rather than altering production settings.

The normal preview command remains:

```powershell
node tools/serve-student-web.cjs build/student-web-XA9sUT
```

That normal preview and the deployed website use the main Firebase project. No source edit is needed to switch. Their data writes use real Firebase and its quota. Only the dedicated emulator server replaces `js/firebase-environment.js`; the module stored in the repository and normal builds exports null. Query strings and localStorage cannot enable emulator mode. Emulator configuration is rejected on non-loopback hosts or for an unexpected project.

## Suggested first test

Teacher verification and access activation are separate: approve the submitted qualifications, then use **Existing-account access** to activate the teacher with a reason and identity confirmation. Approval alone preserves pending/inactive status. Approved teachers awaiting activation can view their application status but cannot open classroom tools. The secured launcher generates a local-only Rules overlay for this workflow; accepted Stage 0 artifacts and production configuration remain unchanged.

Sign in as teacher, create a class, generate a code, then sign in as student in another profile and join. Continue with assignment, quiz, feedback and private follow-up tests using local data. The actual browser/SDK acceptance check is `node tests/local-emulator-browser.cjs` while the launcher is running; it creates a clearly labelled local acceptance class.

Local emulator behavior and rules tests are development evidence. The active delivery constraint is no billing. Public deployment requires a separately validated backend and authorized hosted acceptance; quota recovery alone does not resolve that gate. Any later Hosting package must be rebuilt and reviewed before publication.
