# Bayani AI: click-by-click setup

**29 October 2026 correction: this Gemini configuration is not approved for the Grade 5 audience.** The [Gemini Developer API terms](https://ai.google.dev/gemini-api/terms) exclude applications directed at, or likely to be accessed by, under-18 users. [Firebase governance](https://firebase.google.com/docs/ai-logic/data-governance) confirms that the selected provider's terms apply. App Check and child-friendly instructions do not remove this restriction. The user authorized research and continued Task 2 preparation; see the [provider comparison](bayani-provider-options.md) and [inactive backend preparation guide](bayani-backend-preparation.md). No provider or billing switch has been made.

The instructions below are retained as the historical setup record, not instructions to enable Gemini for children. The existing connection and billing were not changed during the research. A real reply was previously supplied by the user; that establishes connectivity, not age eligibility or response quality. Resolve the provider decision before learner-facing AI rollout or further live acceptance checks.

## Historical Gemini setup

The steps below connected the existing **lakbaypanahon-1797e** project on Spark, without an emulator, a new Firebase project or Cloud Function deployment.

## 1. Open the correct Firebase project

1. Open [your Firebase project](https://console.firebase.google.com/project/lakbaypanahon-1797e/overview).
2. Sign in with the Google account that manages this project.
3. Check that the project selector shows **lakbaypanahon-1797e**.

Leave this browser tab open for the next steps.

## 2. Enable Firebase AI Logic

1. In the Firebase left sidebar, find **AI Logic**. It may be inside **AI Services** or **Build**; use the product search if it is not visible.
2. Click **Get started**. If the setup already shows a configured provider, inspect that provider instead.
3. Select **Gemini Developer API**.
4. Follow the setup wizard to enable its required APIs and finish provider provisioning.
5. Keep **Spark**. If a screen asks you to attach billing, check the provider selection before continuing: this guide uses Gemini Developer API, not the billing-required backend.

**Checkpoint:** AI Logic shows the Gemini Developer API as configured. Do not copy an example API key or replace `js/firebase-config.js`.

Reference: [Firebase AI Logic setup](https://firebase.google.com/docs/ai-logic/get-started?platform=web).

## 3. Create a Fraud Defense web key

Correction: new setup uses **Fraud Defense (formerly known as reCAPTCHA Enterprise)**. Earlier Classic/v3 instructions are superseded. The Bayani client now uses Firebase's ReCaptchaEnterpriseProvider.

1. Open [Google Cloud Fraud Defense](https://console.cloud.google.com/security/recaptcha?project=lakbaypanahon-1797e).
2. Confirm the project is **lakbaypanahon-1797e**.
3. Enable the reCAPTCHA Enterprise API if prompted. Keep billing unchanged; do not accept a billing upgrade to proceed.
4. Choose **Create key** (the button may say **Create**).
5. Give it a name such as **LakbayPanahon Web**.
6. Select **Web / Website** as the platform.
7. Add your intended website domains without protocol, paths or port numbers:
   - lakbaypanahon-1797e.web.app
   - lakbaypanahon-1797e.firebaseapp.com
8. Use a **score-based** key. Leave **Use checkbox challenge** off. Do not select a challenge/checkbox or mobile key.
9. Do not add localhost or 127.0.0.1; local development uses step 6 below.
10. Create the key and copy its **Key ID / site key**.

There is no Classic secret-key step in this setup. The same public key goes into Firebase App Check and Firestore. Keep App Check debug tokens private.

Reference: [Firebase Enterprise-provider setup](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider).

## 4. Register the existing web app with App Check

1. Return to Firebase **App Check > Apps**.
2. Locate **LakbayPanahon Web**, app ID:
   1:831214660993:web:aeff983c8b3182358e4c80
3. Click **Register**, or open its existing provider configuration.
4. Choose **Fraud Defense (formerly known as reCAPTCHA Enterprise)**, not the Classic reCAPTCHA option.
5. Paste the **Key ID / site key** from step 3 into the provider's key field.
6. Keep the default token lifetime/risk settings and save.

**Checkpoint:** the web app is registered with the Enterprise/Fraud Defense provider.

Leave enforcement settings for Firestore, Authentication and other Firebase products unchanged. This implementation initializes App Check on the Bayani chat page; enforcement on unrelated products could interrupt other student pages.

## 5. Update the existing Firestore settings

1. Open **Firestore Database** in Firebase.
2. Open the **Data** tab.
3. Select collection **learningSettings**.
4. Select document **bayaniAI**. It was already created for you; do not create a differently spelled document.
5. Find **appCheckSiteKey**, click its edit/pencil control, paste the Fraud Defense **Key ID / site key**, and save. Its type must be **string**.
6. Edit **enabled** from `false` to `true`. Its type must be **boolean**, not the text `"true"`.

Leave the other existing fields intact:

| Field | What to do |
| --- | --- |
| `model` | Keep the existing value initially; change it only if AI Logic reports that model unavailable for your project. |
| `systemInstruction` | Keep the existing learning-companion instructions. |
| `maxMessageCharacters` | Keep the existing number. |
| `welcomeMessage` | Keep it or edit the greeting as desired. |

**Checkpoint:** `appCheckSiteKey` contains the public site key and `enabled` is the boolean `true`.

## 6. Register your local development browser

Do this when your website address starts with `http://localhost` or `http://127.0.0.1`. This still connects to your original Firebase database; it does not start an emulator.

1. Run the website using your usual local web server, such as VS Code **Live Server**. Do not open the HTML using a `file:///` address.
2. Sign in as a student and open **Bayani AI** from the sidebar.
3. Press **F12**, then select the browser's **Console** tab.
4. Run these two lines in the console:

   ```js
   sessionStorage.setItem('bayaniAppCheckDebug', 'true');
   location.reload();
   ```

   The code now supports this explicit opt-in only on local hosts. No file editing or token pasted into code is required.

5. After reloading, look for a console message beginning **AppCheck debug token**. If it has not appeared, try sending a short question to trigger an App Check request. Copy the token value privately.
6. Return to Firebase **App Check > Apps**.
7. Beside the same web app, click the **three-dot menu > Manage debug tokens**.
8. Choose **Add debug token**, give it a name such as **My local Chrome**, paste the token, and save.
9. Return to Bayani AI, reload, and try the question again.

A debug token is different from the reCAPTCHA site key. It lets your development browser pass App Check. Anyone who obtains the token could reuse it, so keep it private. Register separate tokens for other development browsers/computers. Hosted domains ignore this local debug flag.

To turn off the local flag later:

```js
sessionStorage.removeItem('bayaniAppCheckDebug');
location.reload();
```

Reference: [Firebase App Check local debug setup](https://firebase.google.com/docs/app-check/web/debug-provider).

## 7. Test an actual conversation

1. Enter: **What was a barangay in early Philippine communities?**
2. Click **Send** and wait for a reply.
3. Enter: **Can you explain that in Filipino?** and send again.
4. Check that **New Chat** clears the conversation.

**Success means both questions receive real Gemini replies.** Seeing the greeting or **Ready to chat** alone does not prove the provider connection works; the first actual message tests it.

## If it does not work

| What happens | What to check |
| --- | --- |
| Chat input stays disabled | Check `enabled` is a boolean `true`, the site key is present, and you are signed in as an active student. |
| Invalid site key or CAPTCHA error | Confirm the key is a Web score-based key, and the same key is registered in App Check and stored in Firestore. |
| App Check rejected / 403 | Register the local debug token, or check your hosted domain/provider configuration. |
| API disabled / service unavailable | Finish the AI Logic wizard in step 2; merely opening the AI Logic page does not enable it. |
| Model unavailable / 404 | Choose an available text model in AI Logic and update Firestore `model`. Consult [supported models](https://firebase.google.com/docs/ai-logic/models). |
| Quota exceeded / 429 | Wait for quota availability; do not attach billing just to bypass this setup issue. |
| You see a different error | Note the error code from the browser Console/Network panel. Remove tokens and keys before sharing it. |

Read-only project check on **29 October 2026** confirmed that both `firebasevertexai.googleapis.com` and `generativelanguage.googleapis.com` are enabled. The existing Bayani settings have `enabled=true`, a site key, instructions, a model and a message limit. The user subsequently supplied an actual reply. The new teaching instructions were published and read back, but their response review remains open. Provider eligibility for Grade 5 remains unresolved; frontend Hosting has not been deployed.

To repeat this limited diagnostic, run `node functions/check-bayani-setup.cjs` from the project root. It reads one settings document and two service states, makes no changes, and prints no keys or tokens. A successful settings lookup does not establish that all Firestore operations are available: the subsequent pending test-record cleanup query still returned HTTP 429.
