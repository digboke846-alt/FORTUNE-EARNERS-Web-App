import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    onSnapshot,
    collection,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// ======================================
// HELPER FUNCTIONS
// ======================================

function setPaymentMode(mode) {
    const paymentMode = document.getElementById("paymentMode");
    const paymentNotice = document.getElementById("paymentNotice");
    const accountExpiry = document.getElementById("accountExpiry");
    const paymentReference = document.getElementById("paymentReference");

    if (!paymentMode || !paymentNotice) return;

    if (mode === "manual") {
        paymentMode.innerHTML = "🟡 Manual Payment Mode";
        paymentNotice.innerHTML = "⚠️ <strong>Manual Payment:</strong> Send payment only to the account details below and upload your payment proof after a successful transfer.";
        if (accountExpiry) accountExpiry.style.display = "none";
        if (paymentReference) paymentReference.style.display = "none";
    } else if (mode === "paystack") {
        paymentMode.innerHTML = "🟢 Secure Virtual Account";
        paymentNotice.innerHTML = "⚠️ <strong>Use this account for THIS TRANSACTION ONLY.</strong><br><br>This virtual account expires automatically after 1 hour. Do not save or reuse it.";
        if (accountExpiry) accountExpiry.style.display = "block";
        if (paymentReference) paymentReference.style.display = "block";
    }
}

// ======================================
// CHECK LOGIN & INITIALIZE
// ======================================

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            alert("User not found.");
            return;
        }

        const userData = userSnap.data();

        // ======================================
        // MEMBERSHIP PAGE MODE
        // ======================================

        const pageTitle = document.getElementById("pageTitle");
        const pageDescription = document.getElementById("pageDescription");
        const currentPlanContainer = document.getElementById("currentPlanContainer");
        const currentPlanDisplay = document.getElementById("currentPlanDisplay");

        const planIcons = {
            "🟢 NEWBIE": "🟢 NEWBIE",
            "⚪ SILVER": "⚪ SILVER",
            "🟡 GOLD": "🟡 GOLD",
            "🔷 DIAMOND": "🔷 DIAMOND",
            "👑 PREMIUM": "👑 PREMIUM"
        };

        if (userData.memberStatus === "Pending Activation") {
            if (pageTitle) pageTitle.textContent = "💎 Choose Your Membership Plan";
            if (pageDescription) pageDescription.textContent = "Activate a membership plan to start earning from Daily Tasks, Sponsored Ads, Referral Commissions and Withdrawals.";
            if (currentPlanContainer) currentPlanContainer.style.display = "none";
        } else {
            if (pageTitle) pageTitle.textContent = "🚀 Upgrade Membership Plan";
            if (pageDescription) pageDescription.textContent = "Upgrade your membership plan to unlock higher daily earnings, bigger referral commissions and more rewards.";
            if (currentPlanContainer) currentPlanContainer.style.display = "block";
            if (currentPlanDisplay) currentPlanDisplay.textContent = planIcons[userData.plan] || userData.plan;
        }

        // ======================================
        // MEMBERSHIP LADDER
        // ======================================

        const planOrder = ["🟢 NEWBIE", "⚪ SILVER", "🟡 GOLD", "🔷 DIAMOND", "👑 PREMIUM"];
        const currentIndex = planOrder.indexOf(userData.plan);

        planOrder.forEach((plan, index) => {
            const button = document.querySelector(`.activatePlanBtn[data-plan="${plan}"]`);
            if (!button) return;

            if (userData.memberStatus === "Pending Activation") {
                button.textContent = "Activate Plan";
                button.disabled = false;
                button.style.opacity = "1";
                button.style.cursor = "pointer";
                return;
            }

            if (index < currentIndex) {
                button.textContent = "✔ Completed";
                button.disabled = true;
                button.className = "activatePlanBtn plan-completed";
            } else if (index === currentIndex) {
                button.textContent = "⭐ Current Plan";
                button.disabled = true;
                button.className = "activatePlanBtn plan-current";
            } else {
                button.textContent = "🚀 Upgrade Plan";
                button.disabled = false;
                button.className = "activatePlanBtn plan-upgrade";
            }
        });

        // ======================================
        // PLAN SELECTION
        // ======================================

        const paymentSection = document.getElementById("paymentSection");
        const selectedPlan = document.getElementById("selectedPlan");
        const selectedAmount = document.getElementById("selectedAmount");

        let chosenPlan = "";
        let chosenAmount = 0;

        const planButtons = document.querySelectorAll(".activatePlanBtn");

        planButtons.forEach(button => {
            button.addEventListener("click", () => {
                chosenPlan = button.dataset.plan;
                chosenAmount = Number(button.dataset.price);

                if (selectedPlan) selectedPlan.textContent = chosenPlan;
                if (selectedAmount) selectedAmount.textContent = "₦" + chosenAmount.toLocaleString();

                if (paymentSection) {
                    paymentSection.style.display = "block";
                    paymentSection.scrollIntoView({ behavior: "smooth" });
                }

                setPaymentMode("manual");
            });
        });

        // ======================================
        // CHECK EXISTING ACTIVATION REQUEST
        // ======================================

        const submitPaymentBtn = document.getElementById("submitPaymentBtn");
        const activationRef = doc(db, "activationRequests", user.uid);
        const activationSnap = await getDoc(activationRef);

        if (activationSnap.exists()) {
            const request = activationSnap.data();

            if (request.status === "Pending" && submitPaymentBtn) {
                submitPaymentBtn.disabled = true;
                submitPaymentBtn.textContent = "Submit Activation Request";
                
                const proofStatus = document.getElementById("proofStatus");
                if (proofStatus) proofStatus.textContent = "Your activation request is awaiting admin approval.";
            }
        }

        // ======================================
        // SUBMIT ACTIVATION REQUEST
        // ======================================

        if (submitPaymentBtn) {
            submitPaymentBtn.addEventListener("click", async () => {
                if (!chosenPlan) {
                    alert("Please select a plan.");
                    return;
                }

                const proofInput = document.getElementById("paymentProof");
                const proof = proofInput ? proofInput.files[0] : null;

                if (!proof) {
                    alert("Please upload your payment proof.");
                    return;
                }

                await setDoc(activationRef, {
                    userId: user.uid,
                    fullname: userData.fullname || "",
                    username: userData.username || "",
                    email: userData.email || "",
                    selectedPlan: chosenPlan,
                    amount: chosenAmount,
                    paymentMethod: "Manual",
                    paymentStatus: "Pending",
                    paymentReference: "",
                    bankName: document.getElementById("bankName")?.textContent || "",
                    accountNumber: document.getElementById("accountNumber")?.textContent || "",
                    accountName: document.getElementById("accountName")?.textContent || "",
                    virtualAccountExpiresAt: null,
                    paymentProofUploaded: true,
                    status: "Pending",
                    reviewedBy: "",
                    reviewedAt: null,
                    rejectionReason: "",
                    submittedAt: serverTimestamp()
                });

                alert("✅ Your activation request has been submitted successfully.\n\nOur admin will review your payment and activate your account.");

                submitPaymentBtn.disabled = true;
                submitPaymentBtn.textContent = "Request Submitted";
            });
        }

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
});

// ======================================
// LOG OUT
// ======================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        const confirmLogout = confirm("Are you sure you want to log out?");
        if (!confirmLogout) return;

        try {
            await signOut(auth);
            window.location.href = "login.html";
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    });
}


// ======================================
// BULLETPROOF COPY FUNCTIONS
// ======================================

function copyBank() {
    copyText("bankName", "Bank Name");
}

function copyAccNumber() {
    copyText("accountNumber", "Account Number");
}

function copyAccName() {
    copyText("accountName", "Account Name");
}

function copyText(elementId, labelName) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const text = el.innerText.trim();

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            alert(`${labelName} Copied!`);
        }).catch(() => {
            fallbackCopy(text, labelName);
        });
    } else {
        fallbackCopy(text, labelName);
    }
}

function fallbackCopy(text, labelName) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
        alert(`${labelName} Copied!`);
    } catch (err) {
        alert(`Failed to copy. Please copy manually: ${text}`);
    }

    document.body.removeChild(textArea);
}

// ⚠️ REQUIRED FOR ES MODULES: Expose to window so HTML onclick="..." can find them
window.copyBank = copyBank;
window.copyAccNumber = copyAccNumber;
window.copyAccName = copyAccName;


// ======================================
// LOAD NOTIFICATION BADGE
// ======================================
let previousUnreadCount = 0;

function loadNotificationBadge(userId) {

    const badge =
        document.getElementById("notificationBadge");

    if (!badge) return;

    const q = query(

    collection(db, "notifications"),

    where("userId", "==", userId),

    where("isRead", "==", false),

    orderBy("createdAt", "desc")

);

    onSnapshot(q, (snapshot) => {

        const unreadCount = snapshot.size;

        if (unreadCount > previousUnreadCount && unreadCount > 0) {

    const newestNotification = snapshot.docs[0]?.data();

    if (newestNotification) {

        showNotificationToast(

            newestNotification.title,

            newestNotification.message

        );

    }

}

previousUnreadCount = unreadCount;

        if (unreadCount === 0) {

            badge.classList.add("hidden");

            return;

        }

        badge.classList.remove("hidden");

        badge.textContent =

            unreadCount > 9

                ? "9+"

                : unreadCount;

    });

}


    
// ======================================
// OPEN NOTIFICATIONS PAGE
// ======================================

const notificationButton =
    document.getElementById("notificationButton");

if (notificationButton) {

    notificationButton.addEventListener("click", () => {

        window.location.href = "notifications.html";

    });

}

