import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// ======================================
// GLOBAL VARIABLES
// ======================================

let currentUserData = null;

let selectedWallet = "task";

let feePercentage = 10;

let minimumWithdrawal = 0;

// ======================================
// ELEMENTS
// ======================================

const withdrawType =
    document.getElementById("withdrawType");

const withdrawAmount =
    document.getElementById("withdrawAmount");

const feeDisplay =
    document.getElementById("withdrawFee");

const receiveDisplay =
    document.getElementById("amountToReceive");

const minimumDisplay =
    document.getElementById("minimumWithdrawal");

const taskWallet =
    document.getElementById("taskWallet");

const affiliateWallet =
    document.getElementById("affiliateWallet");
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

            alert("User account not found.");

            return;

        }

        currentUserData =
            userSnap.data();

        // =========================
        // LOAD WALLETS
        // =========================

        taskWallet.textContent =
            "₦" + Number(
                currentUserData.taskWallet || 0
            ).toLocaleString();

        affiliateWallet.textContent =
            "₦" + Number(
                currentUserData.affiliateWallet || 0
            ).toLocaleString();

        // =========================
        // LOAD BANK DETAILS
        // =========================

        document.getElementById("bankName").value =
            currentUserData.bankName || "";

        document.getElementById("accountName").value =
            currentUserData.accountName || "";

        document.getElementById("accountNumber").value =
            currentUserData.accountNumber || "";

        // =========================
        // SET DEFAULT MINIMUM
        // =========================

        updateWithdrawalSettings();

        // =========================
        // LOAD HISTORY
        // =========================

        loadWithdrawalHistory(user.uid);

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});
// ======================================
// UPDATE WITHDRAWAL SETTINGS
// ======================================

function updateWithdrawalSettings() {

    selectedWallet =
        withdrawType.value;

    if (selectedWallet === "task") {

        feePercentage = 10;

        switch (currentUserData.plan) {

            case "NEWBIE":
                minimumWithdrawal = 9000;
                break;

            case "SILVER":
                minimumWithdrawal = 15000;
                break;

            case "GOLD":
                minimumWithdrawal = 25000;
                break;

            case "DIAMOND":
                minimumWithdrawal = 35000;
                break;

            case "PREMIUM":
                minimumWithdrawal = 50000;
                break;

            default:
                minimumWithdrawal = 0;

        }

    }

    else {

        feePercentage = 7;

        minimumWithdrawal = 1000;

    }

    minimumDisplay.textContent =
        "₦" + minimumWithdrawal.toLocaleString();

    calculateWithdrawal();

}

// ======================================
// CALCULATE WITHDRAWAL
// ======================================

function calculateWithdrawal() {

    const amount =
        Number(withdrawAmount.value) || 0;

    const fee =
        amount * feePercentage / 100;

    const receive =
        amount - fee;

    feeDisplay.textContent =
        "₦" + fee.toLocaleString();

    receiveDisplay.textContent =
        "₦" + receive.toLocaleString();

}

withdrawType.addEventListener("change", updateWithdrawalSettings);

withdrawAmount.addEventListener("input", calculateWithdrawal);
