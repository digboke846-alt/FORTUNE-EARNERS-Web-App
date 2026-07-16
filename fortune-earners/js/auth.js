import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    setDoc,
    addDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// ======================================
// AUTO REFERRAL DETECTION
// ======================================

let referrerUid = "";

window.addEventListener("load", async () => {

    const urlParams = new URLSearchParams(window.location.search);

    const refUsername = urlParams.get("ref");

    const referredByInput =
        document.getElementById("referredBy");

    if (!refUsername || !referredByInput) return;

    try {

        const refQuery = query(

            collection(db, "users"),

            where("username", "==", refUsername.toLowerCase())

        );

        const refSnapshot =
            await getDocs(refQuery);

        if (refSnapshot.empty) {

    referredByInput.value = "";

    referredByInput.readOnly = true;

    alert("Invalid referral username.");

    return;

        }

        const refDoc =
            refSnapshot.docs[0];

        referrerUid =
            refDoc.id;

        referredByInput.value =
            refUsername.toLowerCase();

        referredByInput.readOnly = true;

    }

    catch(error){

        console.error(error);

    }

});
// Get the signup form
const signupForm = document.getElementById("signupForm");

// Listen for form submission
signupForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    // Get form values
    const fullname = document.getElementById("fullname").value.trim();

    const username = document
        .getElementById("username")
        .value
        .trim()
        .toLowerCase();

    const email = document
        .getElementById("email")
        .value
        .trim();

    const phone = document
        .getElementById("phone")
        .value
        .trim();

    const password = document
        .getElementById("password")
        .value;

    const confirmPassword = document
        .getElementById("confirmPassword")
        .value;

    const referredBy = document
        .getElementById("referredBy")
        .value
        .trim();

    const terms = document
        .getElementById("terms")
        .checked;

    // Validation
    if (!terms) {
        alert("You must agree to the Terms & Conditions and Privacy Policy.");
        return;
    }

    if (fullname.length < 3) {
        alert("Please enter your full name.");
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
        alert("Please enter a valid Nigerian phone number.");
        return;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    try {

        // Check if username already exists
        const usernameQuery = query(
            collection(db, "users"),
            where("username", "==", username)
        );

        const usernameSnapshot = await getDocs(usernameQuery);

        if (!usernameSnapshot.empty) {
            alert("Username already taken.");
            return;
        }
                    // Create Firebase Authentication account
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        const user = userCredential.user;

        // Send verification email
        await sendEmailVerification(user);

        // Save user information to Firestore
        await setDoc(doc(db, "users", user.uid), {

            fullname: fullname,
            username: username,
            email: email,
            phone: phone,

            plan: "Not Activated",
            memberStatus: "Pending Activation",
            accountStatus: "Active",
            role: "user",

isAdmin: false,

            planActivatedOn: null,
            lastPlanUpgrade: null,
            planExpiryDate: null,
            activationHistory: [],

            affiliateWallet: 0,
            taskWallet: 0,

            referralEarnings: 0,
            taskEarnings: 0,

            totalWithdrawals: 0,
            totalWithdrawalRequests: 0,
            successfulWithdrawals: 0,
            pendingWithdrawals: 0,
            rejectedWithdrawals: 0,

            lastWithdrawalAmount: 0,
            lastWithdrawalStatus: "",
            lastWithdrawalWallet: "",
            lastWithdrawalReference: "",
            lastWithdrawalDate: null,

            totalReferrals: 0,
            validReferrals: 0,

            referredBy: referredBy,
            referrerUid: referrerUid,
            referralCode: username,

            bankName: "",
            accountNumber: "",
            accountName: "",

            withdrawalStatus: "No Pending Request",

            achievements: [],

            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),

            emailVerified: false,

            lastTaskCompleted: null,
            lastSponsoredAdCompleted: null,

            currentStreak: 0,
            highestStreak: 0,

            profilePhoto: "",

            notificationsEnabled: true,

            accountDeleted: false

        });
        // ======================================
// CREATE REFERRAL RECORD
// ======================================

if (referrerUid) {

    await addDoc(collection(db, "referrals"), {

        referrerUid: referrerUid,

        referrerUsername: referredBy,

        referredUid: user.uid,

        referredUsername: username,

        status: "Pending",

        commission: 0,

        activatedPlan: "None",

        createdAt: serverTimestamp()

    });

}

        alert(
            "Account created successfully!\n\nA verification email has been sent to your email address.\n\nPlease verify your email before logging in."
        );

        window.location.href = "verify-email.html";

    } catch (error) {

        console.error(error);

        switch (error.code) {

            case "auth/email-already-in-use":
                alert("This email address is already registered.");
                break;

            case "auth/invalid-email":
                alert("Please enter a valid email address.");
                break;

            case "auth/weak-password":
                alert("Password must be at least 6 characters.");
                break;

            case "auth/network-request-failed":
                alert("Network error. Please check your internet connection.");
                break;

            default:
                alert("Something went wrong. Please try again.");

        }

    }

});
        
