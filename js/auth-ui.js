// ==========================================
// LAKBAYPANAHON
// AUTHENTICATION SYSTEM
// ==========================================


// ==========================================
// FIREBASE CONFIGURATION
// ==========================================

import {
    auth,
    db
} from "./firebase-config.js";


// ==========================================
// FIREBASE AUTHENTICATION
// ==========================================

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged,
    signOut,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";


// ==========================================
// FIRESTORE
// ==========================================

import {
    doc,
    setDoc,
    getDocFromServer,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const minimumNewPasswordLength = 15;
const newPasswordHelp = "Use at least 15 characters. A passphrase made of several words is easier to remember.";
const credentialErrors = new Set([
    "auth/invalid-credential", "auth/invalid-login-credentials", "auth/wrong-password",
    "auth/user-not-found", "auth/user-disabled"
]);
const throttleErrors = new Set(["auth/too-many-requests", "auth/quota-exceeded", "resource-exhausted"]);
const connectionErrors = new Set(["auth/network-request-failed", "auth/timeout", "unavailable", "deadline-exceeded"]);
const expiredSessionErrors = new Set(["auth/user-token-expired", "auth/invalid-user-token", "auth/requires-recent-login"]);

function openSignedInPage(destination) {
    if (window.LakbayPageTransition) window.LakbayPageTransition(destination);
    else window.location.href = destination;
}

// Apply the student's device choice before authentication, rather than silently
// keeping Firebase's durable default on a shared computer.
async function prepareAuthPersistence(remember = false) {
    try {
        await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    } catch {
        throw Object.assign(new Error("Unable to apply sign-in persistence."), {
            code: "auth/session-persistence-unavailable"
        });
    }
}


function initializeAuthUI() {


    // ======================================
    // STUDENT REGISTRATION
    // ======================================

    const studentForm =
        document.getElementById(
            "studentRegisterForm"
        );


    const signupQuery = studentForm && window.location?.search ? new URLSearchParams(window.location.search) : null;
    if (studentForm && signupQuery?.get('method') !== 'username') {
        const finishSetup = signupQuery?.get('mode') === 'finish-setup';
        if (finishSetup) {
            document.getElementById('studentSignupMethods').hidden = true;
            document.getElementById('studentSignupFormTitle').textContent = 'Finish your student account';
            document.getElementById('studentSignupFormDescription').textContent = 'Add your name to complete your student profile.';
        }
        let registrationBusy=false, registrationComplete=false;
        let createdStudent=null;

        console.log(
            "Student registration form detected."
        );


        studentForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();
                if (registrationBusy || registrationComplete) return;
                if (!studentForm.reportValidity()) return;


                // --------------------------
                // GET FORM VALUES
                // --------------------------

                const firstName =
                    document
                        .getElementById("firstName")
                        .value
                        .trim();


                const middleName =
                    document
                        .getElementById("middleName")
                        .value
                        .trim();


                const lastName =
                    document
                        .getElementById("lastName")
                        .value
                        .trim();


                const email =
                    document
                        .getElementById("studentEmail")
                        .value
                        .trim();


                const password =
                    document
                        .getElementById("studentPassword")
                        .value;


                const confirmPassword =
                    document
                        .getElementById(
                            "studentConfirmPassword"
                        )
                        .value;


                const message =
                    document
                        .getElementById(
                            "studentRegisterMessage"
                        );


                const submitButton =
                    studentForm.querySelector(
                        'button[type="submit"]'
                    );


                clearMessage(message);
                const signedInUser = auth.currentUser;
                const sameEmail = user => user?.email?.toLowerCase() === email.toLowerCase();
                const canResume = sameEmail(signedInUser);
                if (finishSetup && !canResume) {
                    showMessage(message, "Sign in again before finishing your account setup.", "error");
                    return;
                }


                // ==================================
                // VALIDATION
                // ==================================

                if (
                    !firstName ||
                    !lastName ||
                    !email ||
                    (!canResume && (!password || !confirmPassword))
                ) {

                    showMessage(
                        message,
                        "Please complete all required fields.",
                        "error"
                    );

                    return;
                }


                if ([firstName,middleName,lastName].some(name=>name.length>100)) {
                    showMessage(message,"Names must be 100 characters or fewer.","error");return;
                }
                if (!document.getElementById("studentTerms").checked) {
                    showMessage(message,"Please read the account notice and check the box to continue.","error");return;
                }
                if ((createdStudent && !sameEmail(createdStudent)) || (signedInUser && !canResume)) {
                    showMessage(message,"Finish saving the account you just created before changing the email.","error");return;
                }
                if (!canResume && Array.from(password).length < minimumNewPasswordLength) {

                    showMessage(
                        message,
                        newPasswordHelp,
                        "error"
                    );

                    return;
                }


                if (!canResume && password !== confirmPassword) {

                    showMessage(
                        message,
                        "The passwords you entered do not match.",
                        "error"
                    );
                    document.getElementById('studentConfirmPassword')?.focus?.();
                    return;
                }


                // ==================================
                // START REGISTRATION
                // ==================================

                registrationBusy=true;
                setButtonLoading(
                    submitButton,
                    true,
                    finishSetup ? "Saving profile..." : "Creating Account..."
                );


                try {


                    // ==================================
                    // CREATE FIREBASE AUTH ACCOUNT
                    // ==================================

                    await prepareAuthPersistence();
                    if (auth.currentUser !== signedInUser) {
                        throw Object.assign(Error("Your session changed. Sign in again before finishing your student profile."), {code:"registration/session-changed"});
                    }
                    const user = createdStudent || (canResume ? signedInUser : (await createUserWithEmailAndPassword(auth,email,password)).user);
                    createdStudent=user;
                    const current = () => {
                        if (auth.currentUser?.uid !== user.uid) {
                            throw Object.assign(Error("Your session changed. Sign in again before finishing your student profile."), {code:"registration/session-changed"});
                        }
                    };
                    current();
                    for (const id of ["studentPassword", "studentConfirmPassword"]) {
                        const input = document.getElementById(id);
                        input.value = "";
                        input.disabled = true;
                    }
                    const profileRef = doc(db,"users",user.uid);
                    const acceptable = profile => profile?.role === "student" && profile.status === "active" && sameEmail(profile);
                    const existing = await getDocFromServer(profileRef);
                    current();
                    if (existing.exists()) {
                        if (!acceptable(existing.data())) {
                            throw Object.assign(Error("This account cannot be registered as a student. Sign in with your existing account or contact an administrator."), {code:"registration/profile-conflict"});
                        }
                    } else {
                        try {
                            await setDoc(profileRef,{firstName,middleName,lastName,email:user.email || email,role:"student",status:"active",createdAt:serverTimestamp()});
                        } catch (error) {
                            // A lost acknowledgement must not recreate or overwrite an accepted profile.
                            current();
                            const saved=await getDocFromServer(profileRef).catch(()=>null);
                            current();
                            if (!saved?.exists() || !acceptable(saved.data())) throw error;
                        }
                    }
                    current();
                    registrationComplete=true;
                    const continueLink=document.getElementById("studentRegistrationContinue");
                    if (continueLink) continueLink.hidden=false;
                    const completion = document.getElementById('studentRegistrationSuccess');
                    if (completion) {
                        studentForm.hidden = true;
                        document.getElementById('studentSignupMethods').hidden = true;
                        document.getElementById('choose-account').hidden = true;
                        completion.hidden = false;
                        document.getElementById('studentRegistrationSuccessTitle').focus();
                    }

                    console.log(
                        "Student Firestore profile created."
                    );


                    // ==================================
                    // SUCCESS
                    // ==================================

                    showMessage(
                        message,
                        "Your student account has been created successfully!",
                        "success"
                    );


                    studentForm.reset();


                } catch (error) {


                    showMessage(
                        message,
                        error.code?.startsWith("registration/") ? error.message
                            : createdStudent && auth.currentUser?.uid === createdStudent.uid && error.code !== "auth/session-persistence-unavailable"
                                ? "Your sign-in account is ready, but the profile could not be confirmed. Retry Create Student Account to finish."
                                : getRegistrationErrorMessage(error.code),
                        "error"
                    );


                } finally {
                    registrationBusy=false;


                    setButtonLoading(
                        submitButton,
                        false,
                        finishSetup ? "Finish student setup" : "Create Student Account"
                    );
                    submitButton.disabled=registrationComplete||(finishSetup&&!auth.currentUser?.email);


                }

            }
        );
        studentForm.setAttribute?.("data-auth-ready", "true");
        const readyButton = studentForm.querySelector('button[type="submit"]');
        if (readyButton) {
            if (finishSetup) {
                const notice = document.getElementById("studentRegisterMessage");
                const email = document.getElementById("studentEmail");
                const passwordFields = [...studentForm.querySelectorAll("[data-student-new-password]")];
                onAuthStateChanged(auth, user => {
                    if (registrationBusy || registrationComplete) return;
                    readyButton.disabled = !user?.email;
                    if (!user?.email) {
                        email.value = "";
                        email.readOnly = false;
                        showMessage(notice, "Sign in again before finishing your account setup.", "error");
                        return;
                    }
                    email.value = user.email;
                    email.readOnly = true;
                    for (const group of passwordFields) {
                        group.hidden = true;
                        for (const field of group.querySelectorAll("input, button")) field.disabled = true;
                    }
                    readyButton.textContent = "Finish student setup";
                    showMessage(notice, "You’re signed in. Add your name to finish setting up your student profile.", "success");
                });
            } else {
                readyButton.disabled = false;
            }
        }

    }



    // Teacher sign-in and profile creation are completed before the application write.
    const teacherForm = document.getElementById("teacherApplicationForm") || document.getElementById("teacherRegisterForm");
    if (teacherForm) {
        const accountFields = document.getElementById("teacherSetupAccount");
        const submitButton = teacherForm.querySelector('button[type="submit"]');
        let teacherBusy = false;
        let teacherComplete = false;
        let createdTeacher = null;

        teacherForm.addEventListener("submit", async event => {
            if (accountFields?.hidden) return;
            event.preventDefault();
            if (teacherComplete && !auth.currentUser) {
                teacherComplete = false;
                createdTeacher = null;
            }
            if (teacherBusy || teacherComplete) return;

            const firstName = document.getElementById("teacherFirstName").value.trim();
            const middleName = document.getElementById("teacherMiddleName")?.value.trim() || "";
            const lastName = document.getElementById("teacherLastName").value.trim();
            const email = document.getElementById("teacherEmail").value.trim();
            const passwordField = document.getElementById("teacherPassword");
            const confirmation = document.getElementById("teacherConfirmPassword");
            const password = passwordField.value;
            const message = document.getElementById("teacherRegisterMessage");
            const notice = document.getElementById("teacherQualificationAcknowledged") || document.getElementById("teacherTerms");
            const sameEmail = user => user?.email?.toLowerCase() === email.toLowerCase();
            const signedInUser = auth.currentUser;
            const canResume = sameEmail(signedInUser);

            clearMessage(message);
            if (!firstName || !lastName || !email || (!canResume && !password)) {
                showMessage(message, "Please complete all required fields.", "error");
                return;
            }
            if ([firstName, middleName, lastName].some(name => name.length > 100)) {
                showMessage(message, "Names must be 100 characters or fewer.", "error");
                return;
            }
            if (!notice.checked) {
                showMessage(message, "Read the teacher account notice and check the box to continue.", "error");
                return;
            }
            if ((createdTeacher && !sameEmail(createdTeacher)) || (signedInUser && !canResume)) {
                showMessage(message, "Finish saving the account you just created before changing the email.", "error");
                return;
            }
            if (!canResume && Array.from(password).length < minimumNewPasswordLength) {
                showMessage(message, newPasswordHelp, "error");
                return;
            }
            if (!canResume && confirmation && password !== confirmation.value) {
                showMessage(message, "The passwords you entered do not match.", "error");
                confirmation.focus?.();
                return;
            }

            teacherBusy = true;
            if (accountFields) teacherForm.dataset.creating = "true";
            setButtonLoading(submitButton, true, "Submitting application...");
            try {
                await prepareAuthPersistence();
                if (auth.currentUser?.uid !== signedInUser?.uid) {
                    throw Object.assign(Error("Your session changed. Sign in again before submitting."), {code: "registration/session-changed"});
                }
                const user = createdTeacher || (canResume ? signedInUser : (await createUserWithEmailAndPassword(auth, email, password)).user);
                createdTeacher = user;
                passwordField.disabled = true;
                if (confirmation) confirmation.disabled = true;
                const current = () => {
                    if (auth.currentUser?.uid !== user.uid) {
                        throw Object.assign(Error("Your session changed. Sign in again before finishing your teacher profile."), {code: "registration/session-changed"});
                    }
                };
                current();

                const profileRef = doc(db, "users", user.uid);
                const acceptable = profile => profile?.role === "teacher" && ["pending", "active"].includes(profile.status) && sameEmail(profile);
                const existing = await getDocFromServer(profileRef);
                current();
                if (existing.exists()) {
                    if (!acceptable(existing.data())) {
                        throw Object.assign(Error("This account already has a profile that cannot be registered as a teacher. Use Sign In or contact your administrator."), {code: "registration/profile-conflict"});
                    }
                } else {
                    try {
                        await setDoc(profileRef, {firstName, middleName, lastName, email: user.email || email, role: "teacher", status: "pending", createdAt: serverTimestamp()});
                        current();
                    } catch (error) {
                        current();
                        const saved = await getDocFromServer(profileRef).catch(() => null);
                        current();
                        if (!saved?.exists() || !acceptable(saved.data())) throw error;
                    }
                }
                teacherComplete = true;
            } catch (error) {
                const feedback = error.code?.startsWith("registration/") ? error.message
                    : error.code === "auth/session-persistence-unavailable" ? getRegistrationErrorMessage(error.code)
                    : createdTeacher ? "Your sign-in account is ready, but the profile could not be confirmed. " +
                        (accountFields ? "Select Submit application to retry." : "Retry Register as Teacher to finish.")
                    : getRegistrationErrorMessage(error.code);
                showMessage(message, feedback, "error");
            } finally {
                teacherBusy = false;
                if (accountFields) teacherForm.dataset.creating = "false";
                const label = accountFields ? (auth.currentUser ? "Submit application" : "Create account and apply") : "Register as Teacher";
                setButtonLoading(submitButton, false, label);
                submitButton.disabled = teacherComplete;
            }
            if (!teacherComplete) return;

            passwordField.value = "";
            if (confirmation) confirmation.value = "";
            if (accountFields) {
                document.dispatchEvent(new CustomEvent("teacher-account-ready"));
            } else {
                const continueLink = document.getElementById("teacherRegistrationContinue");
                if (continueLink) continueLink.hidden = false;
                showMessage(message, "Your account is ready. Your password is unchanged.", "success");
                teacherForm.reset();
            }
        });

        teacherForm.setAttribute?.("data-auth-ready", "true");
        if (accountFields) {
            document.dispatchEvent(new CustomEvent("teacher-registration-ready"));
        } else {
            submitButton.disabled = false;
        }
    }

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const message = document.getElementById("loginMessage");
        const finishSetup = document.getElementById("finishAccountSetup");
        let loginBusy = false, setupUser = null;

        loginForm.addEventListener("submit", async event => {
            event.preventDefault();
            if (loginBusy) return;

            const email = document.getElementById("loginEmail").value.trim();
            const passwordInput = document.getElementById("loginPassword");
            const password = passwordInput.value;
            clearMessage(message);
            setupUser = null;
            if (finishSetup) finishSetup.hidden = true;
            if (!email || !password) {
                showMessage(message, "Please enter your email address and password.", "error");
                return;
            }

            loginBusy = true;
            setButtonLoading(submitButton, true, "Logging in...");
            let session = null;
            const checkSession = () => {
                if (!session || auth.currentUser !== session) {
                    throw Object.assign(Error("The sign-in session changed."), {code: "auth/session-changed"});
                }
            };
            try {
                await prepareAuthPersistence(document.getElementById("rememberMe")?.checked === true);
                const {user} = await signInWithEmailAndPassword(auth, email, password);
                if (passwordInput.value === password) passwordInput.value = "";
                if (auth.currentUser?.uid === user.uid) session = auth.currentUser;
                checkSession();

                const profile = await getDocFromServer(doc(db, "users", user.uid));
                checkSession();
                if (!profile.exists()) {
                    if (finishSetup) {
                        setupUser = user.uid;
                        finishSetup.hidden = false;
                        showMessage(message, "You’re signed in. Choose the account you were setting up to finish your profile.", "success");
                        finishSetup.querySelector("a").focus();
                        return;
                    }
                    throw Object.assign(Error("Account profile not found."), {code: "auth/profile-missing"});
                }

                const {role, status, teacherVerifiedRevision} = profile.data();
                if (status === "inactive") {
                    throw Object.assign(Error("Account is inactive."), {code: "auth/profile-inactive"});
                }
                if (role === "teacher" && ["pending", "active"].includes(status)) {
                    if (status === "pending" || !teacherVerifiedRevision || user.emailVerified !== true) {
                        openSignedInPage('teacher-application.html');
                        return;
                    }
                    const application = await getDocFromServer(doc(db, "teacherApplications", user.uid));
                    checkSession();
                    const approval = application.data();
                    if (approval?.status !== "approved" || approval.revision !== teacherVerifiedRevision ||
                        approval.emailVerified !== true || approval.email !== user.email) {
                        openSignedInPage('teacher-application.html');
                        return;
                    }
                    openSignedInPage('teacher-dashboard.html');
                    return;
                }
                if (status === "active" && role === "student") {
                    openSignedInPage(window.self === window.top ? 'student-shell.html' : 'student-dashboard.html');
                    return;
                }
                if (status === "active" && role === "admin") {
                    openSignedInPage('admin-dashboard.html');
                    return;
                }
                throw Object.assign(Error("Account access is unavailable."), {code: "auth/profile-access-denied"});
            } catch (error) {
                if (credentialErrors.has(error.code) && passwordInput.value === password) passwordInput.value = "";
                let feedback = getLoginErrorMessage(error.code);
                if (session && auth.currentUser === session) {
                    try {
                        await signOut(auth);
                    } catch {
                        feedback += " This browser could not end the session. Clear this site's data before leaving a shared device.";
                    }
                }
                showMessage(message, feedback, "error");
            } finally {
                loginBusy = false;
                setButtonLoading(submitButton, false, "Log In");
            }
        });
        loginForm.setAttribute?.("data-auth-ready", "true");
        if (submitButton) submitButton.disabled = false;
        clearMessage(message);
        if (window.location?.search === "?reason=session-expired") {
            showMessage(message, "Your session expired. Sign in again to continue.", "error");
        }
        if (finishSetup) onAuthStateChanged(auth, user => {
            if (user?.uid !== setupUser) finishSetup.hidden = true;
        });
    }

    const resetForm = document.getElementById('forgotPasswordForm');
    if (resetForm) {
        const resetSection = document.getElementById('forgotPasswordSection');
        const loginContent = document.getElementById('loginContent');
        const signInEmail = document.getElementById('loginEmail');
        const email = document.getElementById('resetEmail');
        const message = document.getElementById('resetPasswordMessage');
        const cooldown = document.getElementById('resetPasswordCooldown');
        const deliveryHelp = document.getElementById('resetDeliveryHelp');
        const previewNote = document.getElementById('resetPreviewNote');
        const submit = resetForm.querySelector('button[type="submit"]');
        const emulator = Boolean(auth.emulatorConfig);
        const continueAt = { url: 'https://lakbaypanahon.web.app/pages/login.html' };
        const requested = new Map();
        let pending = false, timer, retryAfter = 0;

        const addressKey = () => email.value.trim().toLowerCase();
        const openReset = () => {
            const signInAddress = signInEmail.value.trim();
            if (!pending && signInAddress) email.value = signInAddress;
            const password = document.getElementById('loginPassword');
            if (password) password.value = '';
            clearMessage(document.getElementById('loginMessage'));
            loginContent.hidden = true;
            resetSection.hidden = false;
            resetAddressChanged();
            email.focus();
        };

        function updateResetButton() {
            clearTimeout(timer);
            const lastRequest = requested.get(addressKey());
            const remaining = Math.ceil((Math.max(lastRequest || 0, retryAfter) - Date.now()) / 1000);
            submit.disabled = pending || remaining > 0;
            submit.textContent = pending ? 'Requesting a reset link…' : lastRequest ? 'Resend reset link' : 'Send reset link';
            email.readOnly = pending;
            cooldown.hidden = remaining <= 0;
            if (remaining > 0) {
                cooldown.textContent = 'Try again in ' + remaining + ' seconds.';
                if (!resetSection.hidden) timer = setTimeout(updateResetButton, 1000);
            }
        }

        function showRequestReceipt() {
            const text = emulator
                ? 'If an account matches this address, its reset link appears in the Firebase emulator log.'
                : 'If an account matches the address above, look for a reset link in that inbox. Check Spam or Junk too.';
            showMessage(message, text, 'success');
            deliveryHelp.hidden = emulator;
        }

        function resetAddressChanged() {
            clearMessage(message);
            deliveryHelp.hidden = true;
            if (requested.has(addressKey())) showRequestReceipt();
            updateResetButton();
        }

        function recordResetRequest(key) {
            requested.set(key, Date.now() + 60000);
            showRequestReceipt();
        }

        function closeReset() {
            if (email.validity.valid && email.value.trim() !== signInEmail.value.trim()) {
                signInEmail.value = email.value.trim();
            }
            resetSection.hidden = true;
            loginContent.hidden = false;
            clearTimeout(timer);
            signInEmail.focus();
        }

        const resetRequested = () => window.location?.search && new URLSearchParams(window.location.search).get('view') === 'reset';
        previewNote.hidden = !emulator;
        email.addEventListener('input', resetAddressChanged);
        document.getElementById('forgotPasswordButton').addEventListener('click', event => {
            if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            if (!resetRequested()) window.history?.pushState({ authReset: true }, '', '?view=reset');
            openReset();
        });
        document.getElementById('backToLoginButton').addEventListener('click', () => {
            closeReset();
            if (!resetRequested() || !window.history) return;
            if (window.history.state?.authReset) window.history.back();
            else window.history.replaceState(null, '', 'login.html');
        });
        window.addEventListener?.('popstate', () => {
            if (resetRequested() && resetSection.hidden) openReset();
            else if (!resetRequested() && !resetSection.hidden) closeReset();
        });
        resetForm.addEventListener('submit', async event => {
            event.preventDefault();
            const address = email.value.trim(), key = addressKey();
            if (pending || Date.now() < Math.max(requested.get(key) || 0, retryAfter)) return;
            if (!address) {
                showMessage(message, 'Please enter your email address.', 'error');
                return;
            }
            if (!email.validity.valid) {
                showMessage(message, 'Please enter a valid email address.', 'error');
                email.focus();
                return;
            }

            clearMessage(message);
            deliveryHelp.hidden = true;
            pending = true;
            updateResetButton();
            try {
                try {
                    await sendPasswordResetEmail(auth, address, emulator ? undefined : continueAt);
                } catch (error) {
                    // Firebase rejected the return URL before sending an email. Try its default handler once.
                    if (emulator || error.code !== 'auth/unauthorized-continue-uri') throw error;
                    await sendPasswordResetEmail(auth, address);
                }
                recordResetRequest(key);
            } catch (error) {
                if (error.code === 'auth/user-not-found' || error.code === 'auth/user-disabled') {
                    recordResetRequest(key);
                } else {
                    if (throttleErrors.has(error.code)) retryAfter = Date.now() + 120000;
                    showMessage(message, getPasswordResetErrorMessage(error.code), 'error');
                    deliveryHelp.hidden = emulator;
                }
            } finally {
                pending = false;
                updateResetButton();
            }
        });
        if (resetRequested()) openReset();
        else updateResetButton();
    }

    // ======================================
    // DISPLAY MESSAGE
    // ======================================

    function showMessage(
        element,
        text,
        type
    ) {


        if (!element) {

            console.error(
                "Message element was not found."
            );

            return;
        }


        element.textContent =
            text;


        element.classList.remove(
            "error",
            "success"
        );


        element.classList.add(
            type
        );

    }



    // ======================================
    // CLEAR MESSAGE
    // ======================================

    function clearMessage(element) {


        if (!element) {
            return;
        }


        element.textContent =
            "";


        element.classList.remove(
            "error",
            "success"
        );

    }



    // ======================================
    // BUTTON LOADING STATE
    // ======================================

    function setButtonLoading(
        button,
        isLoading,
        text
    ) {


        if (!button) {
            return;
        }


        button.disabled =
            isLoading;


        if (isLoading) {


            button.textContent =
                text;


        } else {


            button.innerHTML =
                `${text} <span aria-hidden="true">→</span>`;


        }

    }



    function getRegistrationErrorMessage(code) {
        if (throttleErrors.has(code)) return "Too many attempts. Wait a few minutes before trying again.";
        if (connectionErrors.has(code)) return "Unable to connect. Check your internet connection and try again.";
        if (expiredSessionErrors.has(code)) return "Your session expired. Sign in again to finish setting up your account.";
        switch (code) {
            case "auth/session-persistence-unavailable":
                return "Your browser could not set up a sign-in session. Check its privacy settings, then try again.";
            case "auth/email-already-in-use":
                return "If you already have an account, sign in or use Forgot Password. Otherwise, check your email address and try again.";
            case "auth/invalid-email":
                return "Please enter a valid email address.";
            case "auth/weak-password":
            case "auth/password-does-not-meet-requirements":
                return "This password does not meet the account security requirements. Try a longer passphrase with different words.";
            case "auth/operation-not-allowed":
            case "auth/unauthorized-continue-uri":
                return "Registration is unavailable on this site. Open the official LakbayPanahon website or contact an administrator.";
            default:
                return "Unable to create your account right now. Please try again.";
        }
    }

    function getLoginErrorMessage(code) {
        if (credentialErrors.has(code)) return "Incorrect email address or password.";
        if (throttleErrors.has(code)) return "Too many sign-in attempts. Wait a few minutes before trying again.";
        if (expiredSessionErrors.has(code)) return "Your session expired. Sign in again.";
        switch (code) {
            case "auth/session-changed":
                return "Your sign-in session changed. Please sign in again.";
            case "auth/profile-missing":
                return "Your account setup is incomplete. If you just registered, return to the registration page. Otherwise, contact an administrator.";
            case "auth/profile-inactive":
                return "Your account is currently inactive. Please contact an administrator.";
            case "auth/profile-access-denied":
                return "Your account does not currently have access. Contact an administrator for help.";
            case "unavailable":
            case "deadline-exceeded":
                return "We could not check your current account access. Check your connection and try signing in again.";
            case "permission-denied":
                return "We could not confirm your account access. Try signing in again from the official site. If this continues, contact an administrator.";
            case "auth/session-persistence-unavailable":
                return "Your browser could not apply your sign-in choice. Check its privacy settings, then try again.";
            case "auth/invalid-email":
                return "Please enter a valid email address.";
            case "auth/network-request-failed":
            case "auth/timeout":
                return "Unable to connect. Check your internet connection and try again.";
            case "auth/operation-not-allowed":
            case "auth/unauthorized-domain":
                return "Sign-in is unavailable on this site. Open the official LakbayPanahon website or contact an administrator.";
            case "auth/multi-factor-auth-required":
                return "This account requires an additional sign-in check. Contact an administrator for help signing in.";
            default:
                return "Unable to log in. Please try again.";
        }
    }

    function getPasswordResetErrorMessage(code) {
        if (throttleErrors.has(code)) return "Too many password reset requests. Wait a few minutes before trying again.";
        if (connectionErrors.has(code)) return "Unable to connect. Check your internet connection and try again.";
        switch (code) {
            case "auth/invalid-email":
            case "auth/invalid-recipient-email":
                return "Please enter a valid email address.";
            case "auth/invalid-sender":
            case "auth/invalid-message-payload":
            case "auth/operation-not-allowed":
            case "auth/unauthorized-domain":
                return "Password reset email is unavailable right now. Ask your school administrator for help getting back into your account.";
            default:
                return "Unable to request a password reset right now. Please try again.";
        }
    }
}
if(document.readyState && document.readyState!=="loading")initializeAuthUI();
else document.addEventListener("DOMContentLoaded",initializeAuthUI,{once:true});
