# Settings keyboard and reload acceptance — 30 October 2026

Result: 13 checks passed in `node tests/student-settings-keyboard-browser.cjs`. [Machine-readable results and source hashes](student-settings-keyboard-reload-local.json).

The fixture serves the actual Settings markup, CSS and full preference code over loopback HTTP in a fresh temporary Chrome profile. Chrome's input protocol sends native key events; switch activation is not simulated with DOM `.click()`. Initial controls are focused programmatically, and actual Tab movement is checked.

- Space/Enter activate sound and music switches. Tab reaches the volume slider with a visible-focus state. Arrow keys adjust sound volume independently of music.
- Native keyboard input enables motion/contrast preferences and changes the reading-size select.
- A real page reload restores the selected audio/display choices from browser storage. No preference seeding or DOM snapshot restoration is used.
- Enter activates Reset, restoring audio/display defaults. Defaults survive a second reload.
- Unrelated local/tab data and a draft sentinel survive reload and Reset. The sentinel is test data, not proof of actual Firestore draft recovery; existing draft checks cover that separately.

Firebase/Auth scripts are removed, the fixture blocks external connections, and AudioContext is disabled. No Firebase, emulator, live account, deployment or exploration-preview setting was used or changed. This closes local keyboard and real-reload acceptance for Settings. It does not verify authentication, the real student shell, actual music audibility, balance, quality or continuity between signed-in pages. Those remaining audio checks require the intended app and listening.

This is supplemental evidence to the earlier combined 281-check/12-fixture run, not a claim that the entire combined suite was rerun. No production code changed in this follow-up.
