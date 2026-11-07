# Local emulator setup validation

Dedicated command: `node tools/start-local-emulator.cjs`. Fixed project: demo-lakbay-local. Website is served only on 127.0.0.1:4173, Auth on 9099 and Firestore on 8180. Current local rules load in the emulator. The seed created 2,742 local catalog/profile documents plus synthetic Auth teacher/student accounts. No real Firebase records were read or written by seeding.

Normal firebase-environment.js exports null. Only the dedicated local server overrides that module to select the demo project. Initialization connects Auth, Firestore and Functions to literal loopback endpoints before use; hosted-domain or wrong-project emulator configuration is rejected. No query-string/localStorage switch is used. Production security-header configuration is unchanged; emulator-server responses allow only the required additional loopback connections.

Three configuration tests pass: normal localhost uses main Firebase, emulator mode connects all services locally, and invalid host/project fails closed. Real Chrome/Firebase SDK checks pass: local approved teacher sign-in, demo project verification, local class creation/code generation, local student join and private-note denial. Evidence: local-emulator-browser-2026-11-05.json.

The launcher uses the repository's offline catalog snapshot and no cloud credentials. Functions/paid AI are not started; Firebase SDK downloads still require internet. Local data is ephemeral and resets with emulator restart. Local testing does not replace a final hosted acceptance, email-delivery test or human review. No Hosting, rules or Functions deployment occurred.
