import { auth, db } from "./firebase.js";

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Get the login form
const loginForm = document.getElementById("loginForm");


// ======================================
// REMEMBER ME (EMAIL & PASSWORD)
// ======================================

// 1. Auto-fill saved email and password when the login page loads
document.addEventListener("DOMContentLoaded", () => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedPassword = localStorage.getItem("rememberedPassword");

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const rememberCheckbox = document.getElementById("rememberMe");

    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
    }

    if (savedPassword && passwordInput) {
        passwordInput.value = savedPassword;
    }

    if (savedEmail && savedPassword && rememberCheckbox) {
        rememberCheckbox.checked = true;
    }
});

// 2. Call this function inside your login form submission handler
function handleRememberMe(email, password, isChecked) {
    if (isChecked) {
        localStorage.setItem("rememberedEmail", email);
        localStorage.setItem("rememberedPassword", password);
    } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberedPassword");
    }
}



// Listen for login
loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    // Get form values
    let emailOrUsername = document
        .getElementById("email")
        .value
        .trim()
        .toLowerCase();

    const password = document
        .getElementById("password")
        .value;

    if (emailOrUsername === "" || password === "") {
        alert("Please fill in all fields.");
        return;
    }

    try {        // Check if user entered a username instead of an email
        if (!emailOrUsername.includes("@")) {

            const userQuery = query(
                collection(db, "users"),
                where("username", "==", emailOrUsername)
            );

            const userSnapshot = await getDocs(userQuery);

            if (userSnapshot.empty) {
                alert("No account found with that username.");
                return;
            }

            emailOrUsername = userSnapshot.docs[0].data().email;
        }

        // Sign in with Firebase Authentication
        const userCredential = await signInWithEmailAndPassword(
            auth,
            emailOrUsername,
            password
        );

        const user = userCredential.user;

        // Ensure email is verified
        if (!user.emailVerified) {

            alert(
                "Please verify your email before logging in."
            );

            window.location.href = "verify-email.html";

            return;
        }

        // Update last login time
        await updateDoc(
            doc(db, "users", user.uid),
            {
                lastLogin: serverTimestamp()
            }
        );

        alert("Login successful!");

        window.location.href = "dashboard.html";

    } catch (error) {

        console.error(error);

        switch (error.code) {

            case "auth/invalid-credential":
            case "auth/user-not-found":
            case "auth/wrong-password":
                alert("Incorrect email/username or password.");
                break;

            case "auth/too-many-requests":
                alert("Too many failed login attempts. Please try again later.");
                break;

            case "auth/network-request-failed":
                alert("Network error. Please check your internet connection.");
                break;

            default:
                alert("Something went wrong. Please try again.");

        }

    }

});
