import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// ======================================
// CHECK LOGIN
// ======================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }

    try {

        const userRef =
            doc(db, "users", user.uid);

        const userSnap =
            await getDoc(userRef);

        if (!userSnap.exists()) {

            alert("User not found.");

            return;

        }

        const userData =
            userSnap.data();

        // ======================================
// MEMBERSHIP PAGE MODE
// ======================================

const pageTitle =
    document.getElementById("pageTitle");

const pageDescription =
    document.getElementById("pageDescription");

const currentPlanContainer =
    document.getElementById("currentPlanContainer");

const currentPlanDisplay =
    document.getElementById("currentPlanDisplay");

const planIcons = {

    "NEWBIE": "🟢 NEWBIE",

    "SILVER": "⚪ SILVER",

    "GOLD": "🟡 GOLD",

    "DIAMOND": "🔷 DIAMOND",

    "PREMIUM": "👑 PREMIUM"

};

if (userData.memberStatus === "Pending Activation") {

    pageTitle.textContent =
        "💎 Choose Your Membership Plan";

    pageDescription.textContent =
        "Activate a membership plan to start earning from Daily Tasks, Sponsored Ads, Referral Commissions and Withdrawals.";

    currentPlanContainer.style.display =
        "none";

}

else {

    pageTitle.textContent =
        "🚀 Upgrade Membership Plan";

    pageDescription.textContent =
        "Upgrade your membership plan to unlock higher daily earnings, bigger referral commissions and more rewards.";

    currentPlanContainer.style.display =
        "block";

    currentPlanDisplay.textContent =
        planIcons[userData.plan] || userData.plan;

}

        // ======================================
// MEMBERSHIP LADDER
// ======================================

const planOrder = [
    "NEWBIE",
    "SILVER",
    "GOLD",
    "DIAMOND",
    "PREMIUM"
];

const currentIndex =
    planOrder.indexOf(userData.plan);

planOrder.forEach((plan, index) => {

    const button =
        document.querySelector(
            `.activatePlanBtn[data-plan="${plan}"]`
        );

    if (!button) return;

    // User has not activated any plan
    if (userData.memberStatus === "Pending Activation") {

        button.textContent = "Activate Plan";

        button.disabled = false;

        button.style.opacity = "1";

        button.style.cursor = "pointer";

        return;

    }

    // Completed plans
    if (index < currentIndex) {

        button.textContent = "✔ Completed";

button.disabled = true;

button.className =
    "activatePlanBtn plan-completed";

    }

    // Current plan
    else if (index === currentIndex) {

        button.textContent = "⭐ Current Plan";

button.disabled = true;

button.className =
    "activatePlanBtn plan-current";

    }

    // Upgrade plans
    else {

        button.textContent = "🚀 Upgrade Plan";

button.disabled = false;

button.className =
    "activatePlanBtn plan-upgrade";

    }

});

       // ======================================
// PLAN SELECTION
// ======================================

const paymentSection =
    document.getElementById("paymentSection");

const selectedPlan =
    document.getElementById("selectedPlan");

const selectedAmount =
    document.getElementById("selectedAmount");

let chosenPlan = "";

let chosenAmount = 0;

const planButtons =
    document.querySelectorAll(".activatePlanBtn");

planButtons.forEach(button => {

    button.addEventListener("click", () => {

        chosenPlan =
            button.dataset.plan;

        chosenAmount =
            Number(button.dataset.price);

        selectedPlan.textContent =
            chosenPlan;

        selectedAmount.textContent =
            "₦" + chosenAmount.toLocaleString();

        paymentSection.style.display =
            "block";

        paymentSection.scrollIntoView({

            behavior: "smooth"

        });

        // ======================================
// PAYMENT MODE (PAYSTACK READY)
// ======================================

setPaymentMode("manual");

function setPaymentMode(mode) {

    const paymentMode =
        document.getElementById("paymentMode");

    const paymentNotice =
        document.getElementById("paymentNotice");

    const accountExpiry =
        document.getElementById("accountExpiry");

    const paymentReference =
        document.getElementById("paymentReference");

    if (mode === "manual") {

        paymentMode.innerHTML =
            "🟡 Manual Payment Mode";

        paymentNotice.innerHTML =
            "⚠️ <strong>Manual Payment:</strong> Send payment only to the account details below and upload your payment proof after a successful transfer.";

        accountExpiry.style.display = "none";

        paymentReference.style.display = "none";

    }

    else if (mode === "paystack") {

        paymentMode.innerHTML =
            "🟢 Secure Virtual Account";

        paymentNotice.innerHTML =
            "⚠️ <strong>Use this account for THIS TRANSACTION ONLY.</strong><br><br>This virtual account expires automatically after 1 hour. Do not save or reuse it.";

        accountExpiry.style.display = "block";

        paymentReference.style.display = "block";

    }

}

    });

});
      // ======================================
// SUBMIT ACTIVATION REQUEST
// ======================================

const submitPaymentBtn =
    document.getElementById("submitPaymentBtn");
        // ======================================
// CHECK EXISTING ACTIVATION REQUEST
// ======================================

const activationRef =
    doc(db, "activationRequests", user.uid);

const activationSnap =
    await getDoc(activationRef);

if (activationSnap.exists()) {

    const request =
        activationSnap.data();

    if (request.status === "Pending") {

        submitPaymentBtn.disabled = true;

        submitPaymentBtn.textContent =
            "Activation Request Pending";

        document.getElementById("proofStatus").textContent =
            "Your activation request is awaiting admin approval.";

    }

}

submitPaymentBtn.addEventListener("click", async () => {

    if (!chosenPlan) {

        alert("Please select a plan.");

        return;

    }

    const proof =
        document.getElementById("paymentProof").files[0];

    if (!proof) {

        alert("Please upload your payment proof.");

        return;

    }

    const activationRef =
        doc(db, "activationRequests", user.uid);

    await setDoc(activationRef, {

    // =========================
    // USER DETAILS
    // =========================

    userId: user.uid,

    fullname: userData.fullname,

    username: userData.username,

    email: userData.email,

    // =========================
    // PLAN DETAILS
    // =========================

    selectedPlan: chosenPlan,

    amount: chosenAmount,

    // =========================
    // PAYMENT DETAILS
    // =========================

    paymentMethod: "Manual",

    paymentStatus: "Pending",

    paymentReference: "",

    bankName:
        document.getElementById("bankName").textContent,

    accountNumber:
        document.getElementById("accountNumber").textContent,

    accountName:
        document.getElementById("accountName").textContent,

    virtualAccountExpiresAt: null,

    paymentProofUploaded: true,

    // =========================
    // ACTIVATION STATUS
    // =========================

    status: "Pending",

    reviewedBy: "",

    reviewedAt: null,

    rejectionReason: "",

    // =========================
    // TIMESTAMPS
    // =========================

    submittedAt: serverTimestamp()

});

    alert(
        "✅ Your activation request has been submitted successfully.\n\nOur admin will review your payment and activate your account."
    );

    submitPaymentBtn.disabled = true;

    submitPaymentBtn.textContent =
        "Request Submitted";

});
    }
// ======================================
// LOG OUT
// ======================================

const logoutBtn =
    document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", async (e) => {

        e.preventDefault();

        const confirmLogout = confirm(
            "Are you sure you want to log out?"
        );

        if (!confirmLogout) return;

        await signOut(auth);

        window.location.href = "login.html";

    });

}
    catch (error) {

        console.error(error);

        alert(error.message);

    }

});
