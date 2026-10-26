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
    signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";


// ==========================================
// FIRESTORE
// ==========================================

import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";



document.addEventListener("DOMContentLoaded", () => {


    // ======================================
    // PASSWORD SHOW / HIDE
    // ======================================

    const passwordButtons =
        document.querySelectorAll(".password-toggle");


    passwordButtons.forEach((button) => {

        button.addEventListener("click", () => {

            const targetId =
                button.dataset.target;


            const input =
                document.getElementById(targetId);


            if (!input) {
                return;
            }


            if (input.type === "password") {

                input.type = "text";

                button.textContent = "Hide";

                button.setAttribute(
                    "aria-label",
                    "Hide password"
                );

            } else {

                input.type = "password";

                button.textContent = "Show";

                button.setAttribute(
                    "aria-label",
                    "Show password"
                );

            }

        });

    });



    // ======================================
    // STUDENT REGISTRATION
    // ======================================

    const studentForm =
        document.getElementById(
            "studentRegisterForm"
        );


    if (studentForm) {

        console.log(
            "Student registration form detected."
        );


        studentForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


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


                // ==================================
                // VALIDATION
                // ==================================

                if (
                    !firstName ||
                    !lastName ||
                    !email ||
                    !password ||
                    !confirmPassword
                ) {

                    showMessage(
                        message,
                        "Please complete all required fields.",
                        "error"
                    );

                    return;
                }


                if (password.length < 6) {

                    showMessage(
                        message,
                        "Password must contain at least 6 characters.",
                        "error"
                    );

                    return;
                }


                if (password !== confirmPassword) {

                    showMessage(
                        message,
                        "The passwords you entered do not match.",
                        "error"
                    );

                    return;
                }


                // ==================================
                // START REGISTRATION
                // ==================================

                setButtonLoading(
                    submitButton,
                    true,
                    "Creating Account..."
                );


                try {


                    // ==================================
                    // CREATE FIREBASE AUTH ACCOUNT
                    // ==================================

                    const userCredential =
                        await createUserWithEmailAndPassword(
                            auth,
                            email,
                            password
                        );


                    const user =
                        userCredential.user;


                    console.log(
                        "Student Authentication account created:",
                        user.uid
                    );


                    // ==================================
                    // CREATE FIRESTORE PROFILE
                    // ==================================

                    await setDoc(
                        doc(
                            db,
                            "users",
                            user.uid
                        ),
                        {

                            firstName: firstName,

                            middleName: middleName,

                            lastName: lastName,

                            email: email,

                            role: "student",

                            status: "active",

                            createdAt:
                                serverTimestamp()

                        }
                    );


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


                    console.error(
                        "Student registration error:",
                        error
                    );


                    showMessage(
                        message,
                        getRegistrationErrorMessage(
                            error.code
                        ),
                        "error"
                    );


                } finally {


                    setButtonLoading(
                        submitButton,
                        false,
                        "Create Student Account"
                    );


                }

            }
        );

    }



    // ======================================
    // TEACHER REGISTRATION
    // ======================================

    const teacherForm =
        document.getElementById(
            "teacherRegisterForm"
        );


    if (teacherForm) {

        console.log(
            "Teacher registration form detected."
        );


        teacherForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                // --------------------------
                // GET FORM VALUES
                // --------------------------

                const firstName =
                    document
                        .getElementById(
                            "teacherFirstName"
                        )
                        .value
                        .trim();


                const middleName =
                    document
                        .getElementById(
                            "teacherMiddleName"
                        )
                        .value
                        .trim();


                const lastName =
                    document
                        .getElementById(
                            "teacherLastName"
                        )
                        .value
                        .trim();


                const email =
                    document
                        .getElementById(
                            "teacherEmail"
                        )
                        .value
                        .trim();


                const password =
                    document
                        .getElementById(
                            "teacherPassword"
                        )
                        .value;


                const confirmPassword =
                    document
                        .getElementById(
                            "teacherConfirmPassword"
                        )
                        .value;


                const message =
                    document
                        .getElementById(
                            "teacherRegisterMessage"
                        );


                const submitButton =
                    teacherForm.querySelector(
                        'button[type="submit"]'
                    );


                clearMessage(message);


                // ==================================
                // VALIDATION
                // ==================================

                if (
                    !firstName ||
                    !lastName ||
                    !email ||
                    !password ||
                    !confirmPassword
                ) {

                    showMessage(
                        message,
                        "Please complete all required fields.",
                        "error"
                    );

                    return;
                }


                if (password.length < 6) {

                    showMessage(
                        message,
                        "Password must contain at least 6 characters.",
                        "error"
                    );

                    return;
                }


                if (password !== confirmPassword) {

                    showMessage(
                        message,
                        "The passwords you entered do not match.",
                        "error"
                    );

                    return;
                }


                // ==================================
                // START REGISTRATION
                // ==================================

                setButtonLoading(
                    submitButton,
                    true,
                    "Creating Account..."
                );


                try {


                    console.log(
                        "Starting teacher registration..."
                    );


                    // ==================================
                    // CREATE FIREBASE AUTH ACCOUNT
                    // ==================================

                    const userCredential =
                        await createUserWithEmailAndPassword(
                            auth,
                            email,
                            password
                        );


                    const user =
                        userCredential.user;


                    console.log(
                        "Teacher Authentication account created:",
                        user.uid
                    );


                    // ==================================
                    // CREATE FIRESTORE PROFILE
                    // ==================================

                    await setDoc(
                        doc(
                            db,
                            "users",
                            user.uid
                        ),
                        {

                            firstName: firstName,

                            middleName: middleName,

                            lastName: lastName,

                            email: email,

                            role: "teacher",

                            status: "pending",

                            createdAt:
                                serverTimestamp()

                        }
                    );


                    console.log(
                        "Teacher Firestore profile created."
                    );


                    // ==================================
                    // SUCCESS
                    // ==================================

                    showMessage(
                        message,
                        "Your teacher account has been created successfully. Please wait for Administrator verification before accessing teacher features.",
                        "success"
                    );


                    teacherForm.reset();


                } catch (error) {


                    console.error(
                        "Teacher registration error:",
                        error
                    );


                    showMessage(
                        message,
                        getRegistrationErrorMessage(
                            error.code
                        ),
                        "error"
                    );


                } finally {


                    setButtonLoading(
                        submitButton,
                        false,
                        "Register as Teacher"
                    );


                }

            }
        );

    }



    // ======================================
    // SHARED LOGIN
    // ======================================

    const loginForm =
        document.getElementById(
            "loginForm"
        );


    if (loginForm) {

        console.log(
            "Login form detected."
        );


        loginForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                // --------------------------
                // GET LOGIN VALUES
                // --------------------------

                const email =
                    document
                        .getElementById(
                            "loginEmail"
                        )
                        .value
                        .trim();


                const password =
                    document
                        .getElementById(
                            "loginPassword"
                        )
                        .value;


                const message =
                    document
                        .getElementById(
                            "loginMessage"
                        );


                const submitButton =
                    loginForm.querySelector(
                        'button[type="submit"]'
                    );


                clearMessage(message);


                // ==================================
                // VALIDATION
                // ==================================

                if (!email || !password) {

                    showMessage(
                        message,
                        "Please enter your email address and password.",
                        "error"
                    );

                    return;
                }


                // ==================================
                // START LOGIN
                // ==================================

                setButtonLoading(
                    submitButton,
                    true,
                    "Logging In..."
                );


                try {


                    // ==================================
                    // FIREBASE AUTHENTICATION
                    // ==================================

                    const userCredential =
                        await signInWithEmailAndPassword(
                            auth,
                            email,
                            password
                        );


                    const user =
                        userCredential.user;


                    console.log(
                        "Authentication successful:",
                        user.uid
                    );


                    // ==================================
                    // GET FIRESTORE PROFILE
                    // ==================================

                    const userReference =
                        doc(
                            db,
                            "users",
                            user.uid
                        );


                    const userSnapshot =
                        await getDoc(
                            userReference
                        );


                    // ==================================
                    // PROFILE DOES NOT EXIST
                    // ==================================

                    if (!userSnapshot.exists()) {


                        await signOut(auth);


                        showMessage(
                            message,
                            "Your account profile could not be found. Please contact the administrator.",
                            "error"
                        );


                        return;
                    }


                    const userData =
                        userSnapshot.data();


                    console.log(
                        "User role:",
                        userData.role
                    );


                    console.log(
                        "User status:",
                        userData.status
                    );


                    // ==================================
                    // INACTIVE ACCOUNT
                    // ==================================

                    if (
                        userData.status === "inactive"
                    ) {


                        await signOut(auth);


                        showMessage(
                            message,
                            "Your account is currently inactive. Please contact the administrator.",
                            "error"
                        );


                        return;
                    }


                    // ==================================
                    // STUDENT
                    // ==================================

                    if (
                        userData.role === "student" &&
                        userData.status === "active"
                    ) {


                        console.log(
                            "Redirecting to Student Dashboard..."
                        );


                        window.location.href =
                            "student-dashboard.html";


                        return;
                    }


                    // ==================================
                    // TEACHER WAITING FOR APPROVAL
                    // ==================================

                    if (
                        userData.role === "teacher" &&
                        userData.status === "pending"
                    ) {


                        await signOut(auth);


                        showMessage(
                            message,
                            "Your teacher account is still waiting for administrator verification.",
                            "error"
                        );


                        return;
                    }


                    // ==================================
                    // APPROVED TEACHER
                    // ==================================

                    if (
                        userData.role === "teacher" &&
                        userData.status === "active"
                    ) {


                        console.log(
                            "Redirecting to Teacher Dashboard..."
                        );


                        window.location.href =
                            "teacher-dashboard.html";


                        return;
                    }


                    // ==================================
                    // ADMINISTRATOR
                    // ==================================

                    if (
                        userData.role === "admin" &&
                        userData.status === "active"
                    ) {


                        console.log(
                            "Redirecting to Administrator Dashboard..."
                        );


                        window.location.href =
                            "admin-dashboard.html";


                        return;
                    }


                    // ==================================
                    // UNKNOWN ROLE OR STATUS
                    // ==================================

                    await signOut(auth);


                    showMessage(
                        message,
                        "Your account does not currently have access to the system.",
                        "error"
                    );


                } catch (error) {


                    console.error(
                        "Login error:",
                        error
                    );


                    showMessage(
                        message,
                        getLoginErrorMessage(
                            error.code
                        ),
                        "error"
                    );


                } finally {


                    setButtonLoading(
                        submitButton,
                        false,
                        "Log In"
                    );


                }

            }
        );

    }



    // ======================================
    // FORGOT PASSWORD
    // ======================================

    const forgotPasswordButton =
        document.getElementById(
            "forgotPasswordButton"
        );


    const forgotPasswordSection =
        document.getElementById(
            "forgotPasswordSection"
        );


    const forgotPasswordForm =
        document.getElementById(
            "forgotPasswordForm"
        );


    const backToLoginButton =
        document.getElementById(
            "backToLoginButton"
        );


    const loginContent =
        document.getElementById(
            "loginContent"
        );



    // ======================================
    // OPEN FORGOT PASSWORD
    // ======================================

    if (
        forgotPasswordButton &&
        forgotPasswordSection &&
        loginContent
    ) {


        forgotPasswordButton.addEventListener(
            "click",
            () => {


                const loginEmail =
                    document
                        .getElementById(
                            "loginEmail"
                        )
                        .value
                        .trim();


                const resetEmail =
                    document
                        .getElementById(
                            "resetEmail"
                        );


                // Copy entered login email
                // to the reset email field

                if (
                    loginEmail &&
                    resetEmail
                ) {

                    resetEmail.value =
                        loginEmail;

                }


                // Clear old messages

                const loginMessage =
                    document.getElementById(
                        "loginMessage"
                    );


                const resetMessage =
                    document.getElementById(
                        "resetPasswordMessage"
                    );


                clearMessage(
                    loginMessage
                );


                clearMessage(
                    resetMessage
                );


                // Hide login content

                loginContent.hidden =
                    true;


                // Show reset content

                forgotPasswordSection.hidden =
                    false;


                if (resetEmail) {

                    resetEmail.focus();

                }

            }
        );

    }



    // ======================================
    // BACK TO LOGIN
    // ======================================

    if (
        backToLoginButton &&
        forgotPasswordSection &&
        loginContent
    ) {


        backToLoginButton.addEventListener(
            "click",
            () => {


                const resetMessage =
                    document.getElementById(
                        "resetPasswordMessage"
                    );


                clearMessage(
                    resetMessage
                );


                // Hide reset content

                forgotPasswordSection.hidden =
                    true;


                // Show login content

                loginContent.hidden =
                    false;


                const loginEmail =
                    document.getElementById(
                        "loginEmail"
                    );


                if (loginEmail) {

                    loginEmail.focus();

                }

            }
        );

    }



    // ======================================
    // SEND PASSWORD RESET EMAIL
    // ======================================

    if (forgotPasswordForm) {


        forgotPasswordForm.addEventListener(
            "submit",
            async (event) => {


                event.preventDefault();


                const email =
                    document
                        .getElementById(
                            "resetEmail"
                        )
                        .value
                        .trim();


                const message =
                    document
                        .getElementById(
                            "resetPasswordMessage"
                        );


                const submitButton =
                    forgotPasswordForm.querySelector(
                        'button[type="submit"]'
                    );


                clearMessage(
                    message
                );


                // ==================================
                // VALIDATION
                // ==================================

                if (!email) {


                    showMessage(
                        message,
                        "Please enter your email address.",
                        "error"
                    );


                    return;
                }


                // ==================================
                // START RESET REQUEST
                // ==================================

                setButtonLoading(
                    submitButton,
                    true,
                    "Sending..."
                );


                try {


                    // ==================================
                    // FIREBASE PASSWORD RESET
                    // ==================================

                    await sendPasswordResetEmail(
                        auth,
                        email
                    );


                    console.log(
                        "Password reset email requested."
                    );


                    // ==================================
                    // SUCCESS
                    // ==================================

                    showMessage(
                        message,
                        "Password reset instructions have been sent. Please check your email.",
                        "success"
                    );


                } catch (error) {


                    console.error(
                        "Password reset error:",
                        error
                    );


                    showMessage(
                        message,
                        getPasswordResetErrorMessage(
                            error.code
                        ),
                        "error"
                    );


                } finally {


                    setButtonLoading(
                        submitButton,
                        false,
                        "Send Reset Link"
                    );


                }

            }
        );

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
                `${text} <span>→</span>`;


        }

    }



    // ======================================
    // REGISTRATION ERROR MESSAGES
    // ======================================

    function getRegistrationErrorMessage(
        errorCode
    ) {


        switch (errorCode) {


            case "auth/email-already-in-use":

                return "An account with this email address already exists.";


            case "auth/invalid-email":

                return "Please enter a valid email address.";


            case "auth/weak-password":

                return "Your password is too weak. Please create a stronger password.";


            case "auth/network-request-failed":

                return "Unable to connect. Please check your internet connection and try again.";


            case "auth/operation-not-allowed":

                return "Email and password registration is not enabled.";


            default:

                return "Something went wrong while creating your account. Please try again.";


        }

    }



    // ======================================
    // LOGIN ERROR MESSAGES
    // ======================================

    function getLoginErrorMessage(
        errorCode
    ) {


        switch (errorCode) {


            case "auth/invalid-email":

                return "Please enter a valid email address.";


            case "auth/invalid-credential":

                return "Incorrect email address or password.";


            case "auth/user-disabled":

                return "This account has been disabled.";


            case "auth/too-many-requests":

                return "Too many unsuccessful login attempts. Please try again later.";


            case "auth/network-request-failed":

                return "Unable to connect. Please check your internet connection and try again.";


            default:

                return "Unable to log in. Please try again.";


        }

    }



    // ======================================
    // PASSWORD RESET ERROR MESSAGES
    // ======================================

    function getPasswordResetErrorMessage(
        errorCode
    ) {


        switch (errorCode) {


            case "auth/invalid-email":

                return "Please enter a valid email address.";


            case "auth/too-many-requests":

                return "Too many password reset requests. Please wait a moment and try again.";


            case "auth/network-request-failed":

                return "Unable to connect. Please check your internet connection and try again.";


            default:

                return "Unable to send the password reset email. Please try again.";


        }

    }


});