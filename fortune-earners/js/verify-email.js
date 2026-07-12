import { auth, db } from "./firebase.js";

import {
    sendEmailVerification,
    onAuthStateChanged,
    reload
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// HTML Elements
const resendButton = document.getElementById("resendVerification");
const verifyButton = document.getElementById("checkVerification");
const loginButton = document.getElementById("goToLogin");
const userEmail = document.getElementById("userEmail");
const countdown = document.getElementById("countdown");

// Store the authenticated user
let currentUser = null;

// Wait for Firebase to restore the user's session
onAuthStateChanged(auth, (user) => {

    if (user) {

        currentUser = user;

        userEmail.textContent =
            `Verification email sent to: ${user.email}`;

    } else {

        alert("Your session has expired. Please log in again.");

        window.location.href = "login.html";

    }

});

// Resend verification email
resendButton.addEventListener("click", async () => {

    if (!currentUser) {

        alert("Please log in first.");

        window.location.href = "login.html";

        return;

    }

    try {

        await sendEmailVerification(currentUser);

        alert("Verification email has been sent again.");

    } catch (error) {

        console.error(error);

        alert(error.message);

    }

});

// Check if the email has been verified
verifyButton.addEventListener("click", async () => {

    if (!currentUser) {

        alert("Please log in first.");

        window.location.href = "login.html";

        return;

    }

    try {

        await reload(currentUser);

        if (currentUser.emailVerified) {

            await updateDoc(
                doc(db, "users", currentUser.uid),
                {
                    emailVerified: true
                }
            );

            alert("Email verified successfully! You can now log in.");

            window.location.href = "login.html";

        } else {

            alert(
                "Your email has not been verified yet. Please check your inbox and click the verification link."
            );

        }

    } catch (error) {

        console.error(error);

        alert("Something went wrong. Please try again.");

    }

});

// Go to Login
loginButton.addEventListener("click", () => {

    window.location.href = "login.html";

});