import { auth } from "./firebase-config.js";
import {
    applyActionCode, checkActionCode, confirmPasswordReset, verifyPasswordResetCode
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

const params = new URLSearchParams(location.search);
const mode = params.get("mode");
let code = params.get("oobCode");
const apiKey = params.get("apiKey");
const continueUrl = params.get("continueUrl");
// Keep the email token off the visible URL and out of subsequent navigation.
if (location.search || location.hash) history.replaceState(null, "", location.pathname);

const $ = id => document.getElementById(id);
const page = document.querySelector(".auth-action-page");
const title = $("authActionTitle");
const description = $("authActionDescription");
const message = $("authActionMessage");
const form = $("choosePasswordForm");
const password = $("newPassword");
const repeat = $("repeatNewPassword");
const save = form.querySelector("button[type=submit]");
const retry = $("authActionRetry");
const confirm = $("authActionConfirm");
const next = $("authActionContinue");
let busy = false;

function showFeedback(text = "") {
    message.textContent = text;
    message.classList.toggle("error", Boolean(text));
    if (text) message.focus();
}

function render(state, heading, guidance, { label = "Go to log in", destination = "login.html" } = {}) {
    page.dataset.state = state;
    title.textContent = heading;
    document.title = heading + " | LakbayPanahon";
    description.textContent = guidance;
    form.hidden = state !== "password";
    password.disabled = repeat.disabled = save.disabled = form.hidden;
    retry.hidden = state !== "retry";
    confirm.hidden = state !== "recover";
    next.hidden = !["done", "unavailable", "retry", "recover"].includes(state);
    next.textContent = label;
    next.href = destination;
    showFeedback();
    title.focus({ preventScroll: true });
}

function unavailable() {
    code = null;
    form.reset();
    if (mode === "resetPassword") {
        render("unavailable", "Request a new reset link", "This password reset link is invalid, expired, or has already been used.", {
            label: "Get a new reset link", destination: "login.html?view=reset"
        });
    } else {
        render("unavailable", "This link can’t be used", "Open the most recent email for this account. To request a new verification link, sign in and open your teacher application.");
    }
}

function handleCheckError(error) {
    if (["auth/invalid-action-code", "auth/expired-action-code", "auth/user-disabled", "auth/user-not-found"].includes(error.code)) {
        unavailable();
        return;
    }
    const limited = ["auth/too-many-requests", "auth/quota-exceeded"].includes(error.code);
    render("retry", "We couldn’t check your link", limited
        ? "Too many attempts. Wait a few minutes, then try again."
        : "Check your connection and try again. You can also reopen the link from your email.");
}

function maskedAddress(address) {
    const at = address?.lastIndexOf("@") ?? -1;
    return at > 0 ? address.slice(0, 1) + "•••" + address.slice(at) : "";
}

function returnToTeacherSetup() {
    if (!continueUrl) return false;
    try {
        const url = new URL(continueUrl);
        const trustedOrigins = [location.origin, "https://lakbaypanahon.web.app", "https://lakbaypanahon-1797e.web.app"];
        return trustedOrigins.includes(url.origin) && url.pathname === "/pages/teacher-application.html";
    } catch {
        return false;
    }
}

async function checkLink() {
    if (busy) return;
    if (!code || !["resetPassword", "verifyEmail", "recoverEmail"].includes(mode) || (apiKey && apiKey !== auth.app.options.apiKey)) {
        unavailable();
        return;
    }
    busy = true;
    render("checking", "Checking your link", "This should only take a moment.");
    try {
        if (mode === "resetPassword") {
            const email = maskedAddress(await verifyPasswordResetCode(auth, code));
            render("password", "Choose a new password", email ? "Reset the password for " + email + "." : "Enter a new password for your LakbayPanahon account.");
        } else {
            const result = await checkActionCode(auth, code);
            const operation = mode === "verifyEmail" ? "VERIFY_EMAIL" : "RECOVER_EMAIL";
            if (result.operation !== operation) {
                unavailable();
                return;
            }
            if (mode === "verifyEmail") {
                await applyActionCode(auth, code);
                code = null;
                if (returnToTeacherSetup()) {
                    render("done", "Email confirmed", "Return to your teacher application to check your review status.", {
                        label: "Open teacher application", destination: "teacher-application.html"
                    });
                } else {
                    render("done", "Email confirmed", "You can use your confirmed email address to log in to LakbayPanahon.");
                }
            } else {
                const email = maskedAddress(result.data.email);
                render("recover", "Restore your previous email", email
                    ? "Restore " + email + " as the sign-in email for this account."
                    : "Restore the previous sign-in email for this account.");
            }
        }
    } catch (error) {
        handleCheckError(error);
    } finally {
        busy = false;
    }
}

form.addEventListener("submit", async event => {
    event.preventDefault();
    if (busy || !code || form.hidden) return;
    if (Array.from(password.value).length < 15) {
        showFeedback("Use at least 15 characters for your new password.");
        return;
    }
    if (password.value !== repeat.value) {
        showFeedback("The passwords you entered don’t match.");
        return;
    }
    const chosenPassword = password.value;
    busy = true;
    form.setAttribute("aria-busy", "true");
    password.readOnly = repeat.readOnly = save.disabled = true;
    save.textContent = "Saving your password…";
    showFeedback();
    try {
        await confirmPasswordReset(auth, code, chosenPassword);
        code = null;
        form.reset();
        render("done", "Password updated", "Log in with your new password to return to your account.");
    } catch (error) {
        if (["auth/invalid-action-code", "auth/expired-action-code", "auth/user-disabled", "auth/user-not-found"].includes(error.code)) unavailable();
        else if (["auth/weak-password", "auth/password-does-not-meet-requirements"].includes(error.code)) {
            showFeedback("The password doesn’t meet the account requirements. Try a longer passphrase with different words.");
        } else if (error.code === "auth/too-many-requests") {
            showFeedback("Too many attempts. Wait a few minutes before trying again.");
        } else {
            showFeedback("We couldn’t confirm the change. If you lost your connection, try logging in with your new password or request another reset link.");
        }
    } finally {
        busy = false;
        form.setAttribute("aria-busy", "false");
        password.readOnly = repeat.readOnly = false;
        save.disabled = form.hidden;
        save.textContent = "Save new password";
    }
});

confirm.addEventListener("click", async () => {
    if (busy || !code || confirm.hidden) return;
    confirm.disabled = true;
    busy = true;
    try {
        await applyActionCode(auth, code);
        code = null;
        render("done", "Sign-in email restored", "Use your restored email address to log in. You can request a password reset from the login page if you need one.");
    } catch (error) {
        handleCheckError(error);
    } finally {
        busy = false;
        confirm.disabled = false;
    }
});
retry.addEventListener("click", () => { void checkLink(); });
void checkLink();
