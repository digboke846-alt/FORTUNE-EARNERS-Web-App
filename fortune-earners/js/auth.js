import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    setDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const fullname = document.getElementById("fullname").value.trim();

    const username = document.getElementById("username").value.trim().toLowerCase();

    const email = document.getElementById("email").value.trim();

    const phone = document.getElementById("phone").value.trim();

    const password = document.getElementById("password").value;

    const confirmPassword = document.getElementById("confirmPassword").value;

    const referredBy = document.getElementById("referredBy").value.trim();

    const terms = document.getElementById("terms").checked;

    if (!terms) {
        alert("You must agree to the Terms & Conditions and Privacy Policy.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters long.");
        return;
    }

    if (username.length < 4 || username.length > 20) {
        alert("Username must be between 4 and 20 characters.");
        return;
    }

    const usernamePattern = /^[a-z0-9_]+$/;

    if (!usernamePattern.test(username)) {
        alert("Username can only contain lowercase letters, numbers and underscores (_).");
        return;
    }

    const phonePattern = /^(070|080|081|090|091)\d{8}$/;

    if (!phonePattern.test(phone)) {
        alert("Please