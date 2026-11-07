# Local Firebase testing

Start in the VS Code terminal at `C:\LakbayPanahon`:

```powershell
node tools/start-local-emulator.cjs
```

Wait for **LOCAL EMULATOR WEBSITE**, then open:

- Website: http://127.0.0.1:4173/pages/login.html
- Emulator data/account viewer: http://127.0.0.1:4000

| Local account | Email | Password |
| --- | --- | --- |
| Approved teacher | teacher@lakbay.local | LakbayLocal123! |
| Student | student@lakbay.local | LakbayLocal123! |

Use separate browser profiles for teacher and student. These credentials exist only in the local Auth emulator; use no real account credentials here. A gold LOCAL EMULATOR banner identifies this environment.

## What the launcher does

Builds a fresh public package, starts Auth (9099) and Firestore (8180) for `demo-lakbay-local`, loads the current local rules, seeds synthetic teacher/student identities and the repository's offline history catalog, and serves a dedicated loopback website on port 4173. Ports 4000/4400/4500/9150 are used by the emulator suite. Node, Java 21 and Firebase CLI are required; they were available on this workstation when validated.

All seeding endpoints are literal 127.0.0.1 addresses and the project is fixed to demo-lakbay-local. The seed does not authenticate to or export production Firebase. Seeded teacher email/approval is a local fixture, not a real professional credential review. Catalog content comes from the repository's offline snapshot, not a fresh online export. Real email delivery, paid AI calls and Cloud Functions are not running. Functions SDK calls point to a local port and fail locally rather than falling back to the real project. Firebase SDK scripts still download from Google's CDN, so this is quota-free local database testing, not a completely offline application.

## Stop or return to the normal website

Press **Ctrl+C** in the launcher terminal. Local accounts and data reset on restart; there is no automatic import/export to the real database. Do not close the terminal while you want to keep testing. If another application uses one of the ports, stop that application's process or resolve the conflict rather than altering production settings.

The normal preview command remains:

```powershell
node tools/serve-student-web.cjs build/student-web-XA9sUT
```

That normal preview and the deployed website use the main Firebase project. No source edit is needed to switch. Their data writes use real Firebase and its quota. Only the dedicated emulator server replaces `js/firebase-environment.js`; the module stored in the repository and normal builds exports null. Query strings and localStorage cannot enable emulator mode. Emulator configuration is rejected on non-loopback hosts or for an unexpected project.

## Suggested first test

Sign in as teacher, create a class, generate a code, then sign in as student in another profile and join. Continue with assignment, quiz, feedback and private follow-up tests using local data. The actual browser/SDK acceptance check is `node tests/local-emulator-browser.cjs` while the launcher is running; it creates a clearly labelled local acceptance class.

Local emulator behavior and rules tests are development evidence. Do a smaller hosted acceptance against real Firebase when quota recovers. New firebase-config.js/environment changes mean the previously prepared Hosting package must be rebuilt and reviewed before a later publication.
