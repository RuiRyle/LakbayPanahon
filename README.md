# LakbayPanahon

## Classmate testing — local only

Use the local Firebase emulators to test student lessons/quizzes, teacher workflows and administrator reviews. **Do not use Live Server for the complete test flow:** ordinary Live Server connects to the main Firebase project, whose assessment backend is not deployed.

### First-time setup

1. Install **Node.js 22 LTS**, **Java JDK 21 or newer**, and Git. Reopen your terminal.
2. Check `node --version` (must be v22.x), `npm --version`, and `java -version`.
3. Clone and prepare:

   ```sh
   git clone https://github.com/RuiRyle/LakbayPanahon.git
   cd LakbayPanahon
   npm ci
   npm run setup:local
   npm run start:local
   ```

   On Windows PowerShell, if `npm.ps1` is blocked, use `npm.cmd` in place of `npm`. Do not change your execution policy just for this.

4. Wait for **LOCAL EMULATOR WEBSITE** in the terminal, then open:
   **http://127.0.0.1:4173/pages/login.html**

The first run downloads emulator tooling and installs the pinned backend dependencies. Internet is also needed for Firebase browser SDKs. No Firebase account, `firebase login`, payment card or billing activation is required. Do not run deploy commands.

### Synthetic accounts

| Role | Email | Password |
|---|---|---|
| Student | `student@lakbay.local` | `LakbayLocal123!` |
| Teacher | `teacher@lakbay.local` | `LakbayLocal123!` |
| Administrator | `admin@lakbay.local` | `LakbayLocal123!` |

These credentials work only in the local demo project. Your classmates each get independent data; edits do not change main Firebase or another person's emulator. Do not enter real student data. AI assistance is not running in this local setup.

### What to test

1. Student: sign in, start the prologue lesson and mission quiz, answer questions, finish, reload the result, and check progress/next-mission access.
2. Teacher: dashboard, classes and reports with synthetic accounts.
3. Administrator: application categories, review decisions, separate account activation and history. Some queues initially have no submitted forms; the seeded teacher is already approved for dashboard testing.
4. Report bugs with role, page, steps, expected/actual behavior, browser and a screenshot. Never include tokens or passwords from real accounts.

### Save your local session before stopping

In another terminal in this folder:

```sh
npm run backup:local
```

Keep the printed snapshot name. After a successful backup, stop the launcher with Ctrl+C. Restore next time:

```sh
npm run start:local -- --restore=YOUR-SNAPSHOT-NAME
```

Without `--restore`, startup creates a new synthetic session. Do not share your private backups or commit them. If backup fails, keep the launcher running and report the error before stopping. The launcher refuses to reseed a running emulator session.

### Troubleshooting

- Use port **4173**, not Live Server's 5500. The page must show the **LOCAL EMULATOR** banner.
- If emulators are already running, reuse the existing launcher; do not start another.
- Ports 4000, 4173, 4400, 4500, 5001, 8180, 9099 and 9150 must be available. Check for other emulator sessions before closing anything.
- Java missing: install JDK 21+, reopen the terminal and check `java -version`.
- Backend dependencies missing: run `npm run setup:local` again.
- This URL is private to your computer. It is not a deployment or a link classmates can open remotely.

Hosted deployment is a separate, unapproved release step. Local success does not establish production readiness.
