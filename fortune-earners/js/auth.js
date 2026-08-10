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
    getDoc,
    updateDoc
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

    // ======================================
// CUSTOM SIGNUP VALIDATION
// ======================================

function showSignupError(fieldId, message) {

    const field = document.getElementById(fieldId);

    if (!field) return false;

    // Remove previous error for this field
    const oldError =
        document.getElementById(fieldId + "Error");

    if (oldError) {
        oldError.remove();
    }

    // Highlight field
    field.style.border =
        "2px solid #FFD700";

    field.style.boxShadow =
        "0 0 12px rgba(255, 215, 0, 0.35)";

    // Scroll to field
    field.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    // Focus field
    field.focus();

    // Create error message
    const error =
        document.createElement("div");

    error.id =
        fieldId + "Error";

    error.textContent =
        "⚠️ " + message;

    error.style.color =
        "#FFD700";

    error.style.fontWeight =
        "bold";

    error.style.marginTop =
        "8px";

    error.style.marginBottom =
        "10px";

    error.style.textAlign =
        "left";

    // Put message after field
    field.parentElement.appendChild(error);

    // Remove warning when user starts correcting it
    const clearError = () => {

        field.style.border = "";
        field.style.boxShadow = "";

        const currentError =
            document.getElementById(fieldId + "Error");

        if (currentError) {
            currentError.remove();
        }

        field.removeEventListener(
            "input",
            clearError
        );
    };

    field.addEventListener(
        "input",
        clearError
    );

    return true;
}


// ======================================
// FULL NAME
// ======================================

if (!fullname) {

    showSignupError(
        "fullname",
        "Please enter your full name."
    );

    return;
}

if (fullname.length < 3) {

    showSignupError(
        "fullname",
        "Your full name must be at least 3 characters."
    );

    return;
}


// ======================================
// USERNAME
// ======================================

if (!username) {

    showSignupError(
        "username",
        "Please choose a username."
    );

    return;
}

if (
    username.length < 4 ||
    username.length > 20
) {

    showSignupError(
        "username",
        "Username must be between 4 and 20 characters."
    );

    return;
}

const usernamePattern =
    /^[a-z0-9_]+$/;

if (!usernamePattern.test(username)) {

    showSignupError(
        "username",
        "Username can only contain lowercase letters, numbers and underscores (_)."
    );

    return;
}


// ======================================
// EMAIL
// ======================================

if (!email) {

    showSignupError(
        "email",
        "Please enter your email address."
    );

    return;
}

const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailPattern.test(email)) {

    showSignupError(
        "email",
        "Please enter a valid email address."
    );

    return;
}


// ======================================
// PHONE
// ======================================

if (!phone) {

    showSignupError(
        "phone",
        "Please enter your phone number."
    );

    return;
}

const phonePattern =
    /^(070|080|081|090|091)\d{8}$/;

if (!phonePattern.test(phone)) {

    showSignupError(
        "phone",
        "Please enter a valid Nigerian phone number."
    );

    return;
}


// ======================================
// PASSWORD
// ======================================

if (!password) {

    showSignupError(
        "password",
        "Please create a password."
    );

    return;
}

if (password.length < 6) {

    showSignupError(
        "password",
        "Password must be at least 6 characters."
    );

    return;
}


// ======================================
// CONFIRM PASSWORD
// ======================================

if (!confirmPassword) {

    showSignupError(
        "confirmPassword",
        "Please confirm your password."
    );

    return;
}

if (password !== confirmPassword) {

    showSignupError(
        "confirmPassword",
        "Passwords do not match."
    );

    return;
}


// ======================================
// TERMS & CONDITIONS
// ======================================

if (!terms) {

    const termsCheckbox =
        document.getElementById("terms");

    alert(
        "You must agree to our Terms & Conditions and Privacy Policy."
    );

    if (termsCheckbox) {

        termsCheckbox.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        termsCheckbox.focus();

        termsCheckbox.style.outline =
            "3px solid #FFD700";

        termsCheckbox.style.outlineOffset =
            "6px";

        termsCheckbox.animate(
            [
                { transform: "scale(1)" },
                { transform: "scale(1.3)" },
                { transform: "scale(1)" }
            ],
            {
                duration: 500,
                iterations: 3
            }
        );

        const removeHighlight =
            () => {

                if (termsCheckbox.checked) {

                    termsCheckbox.style.outline = "";
                    termsCheckbox.style.outlineOffset = "";

                    termsCheckbox.removeEventListener(
                        "change",
                        removeHighlight
                    );
                }
            };

        termsCheckbox.addEventListener(
            "change",
            removeHighlight
        );
    }

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
            memberStatus: "🟢 Active",
            accountStatus: "Pending Activation",
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

            completedTasksToday: 0,

sponsoredAdsToday: 0,

referralsToday: 0,

earnedToday: 0,

lastDailyReset: new Date().toISOString().split("T")[0],

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
// CREATE WELCOME NOTIFICATION
// ======================================

await addDoc(collection(db, "notifications"), {

    userId: user.uid,

    title: "🎉 Welcome To Fortune Earners!",

    message:
        "Congratulations on joining Fortune Earners.\n\nActivate a membership plan to start earning daily.\n\nWe're happy to have you! 💙💚❤️",

    type: "welcome",

    isRead: false,

    createdAt: serverTimestamp()

});
    // ======================================
// NOTIFY REFERRER OF NEW REFERRAL
// ======================================

if (referrerUid) {

    await addDoc(collection(db, "notifications"), {

        userId: referrerUid,

        title: "👥 New Referral",

        message:
            `🎉 ${fullname} just joined Fortune Earners using your referral link.\n\nEncourage them to activate a plan and start earning 'n get your reward!🎉`,

        type: "referral",

        isRead: false,

        createdAt: serverTimestamp()

    });

}
        // ======================================
// UPDATE REFERRER TOTAL REFERRALS
// ======================================

if (referrerUid) {

    const referrerRef =
        doc(db, "users", referrerUid);

    const referrerSnap =
        await getDoc(referrerRef);

    if (referrerSnap.exists()) {

        const referrerData =
            referrerSnap.data();

        await updateDoc(referrerRef, {

            totalReferrals:
                (referrerData.totalReferrals || 0) + 1

        });

    }

}
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

        activatedPlan: "Not Activated",

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
        
