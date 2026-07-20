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
// ======================================
// SUBMIT WITHDRAWAL
// ======================================

document.getElementById("submitWithdrawalBtn")
.addEventListener("click", async () => {

    try {

        const amount =
            Number(withdrawAmount.value);

        if (!amount || amount <= 0) {

            alert("Enter a valid withdrawal amount.");

            return;

        }

        if (amount < minimumWithdrawal) {

            alert(
                `Minimum withdrawal is ₦${minimumWithdrawal.toLocaleString()}`
            );

            return;

        }

        const walletBalance =
            selectedWallet === "task"
                ? Number(currentUserData.taskWallet || 0)
                : Number(currentUserData.affiliateWallet || 0);

        if (amount > walletBalance) {

            alert("Insufficient wallet balance.");

            return;

        }

        const fee =
            amount * feePercentage / 100;

        const receive =
            amount - fee;

        const status =
            selectedWallet === "task"
                ? "Pending"
                : "Auto Paid";

        // ======================================
// GENERATE WITHDRAWAL REFERENCE
// ======================================

const now = new Date();

const datePart =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");

const randomPart =
    Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

const withdrawalReference =
    `FEW-${datePart}-${randomPart}`;

        await addDoc(collection(db, "withdrawals"), {

    reference: withdrawalReference,

    userId: auth.currentUser.uid,

    username: currentUserData.username || "",

    fullName: currentUserData.fullName || "",

    walletType: selectedWallet,

    amountRequested: amount,

    feePercentage: feePercentage,

    feeAmount: fee,

    amountToReceive: receive,

    bankName: currentUserData.bankName || "",

    accountName: currentUserData.accountName || "",

    accountNumber: currentUserData.accountNumber || "",

    status: status,

    submittedAt: serverTimestamp(),

    requestDate: new Date().toLocaleString(),

    adminComment: "",

    processedBy: "",

    processedAt: null

});

        alert(
            selectedWallet === "task"
            ? "✅ Withdrawal request submitted successfully."
            : "✅ Affiliate withdrawal processed successfully."
        );

        withdrawAmount.value = "";

        calculateWithdrawal();

        loadWithdrawalHistory(auth.currentUser.uid);

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});
// ======================================
// LOAD WITHDRAWAL HISTORY
// ======================================

async function loadWithdrawalHistory(userId) {

    try {

        const historyContainer =
            document.getElementById("withdrawHistory");

        historyContainer.innerHTML = "";

        const q = query(

            collection(db, "withdrawals"),

            where("userId", "==", userId)

        );

        const snapshot =
            await getDocs(q);

        if (snapshot.empty) {

            historyContainer.innerHTML = `

<p>

No withdrawal history available.

</p>

`;

            return;

        }

        snapshot.forEach(docSnap => {

            const data = docSnap.data();

            historyContainer.innerHTML += `

<div class="dashboard-card">

<h3>

${data.walletType === "task" ? "📋 Task Withdrawal" : "👥 Affiliate Withdrawal"}

</h3>

<p>

<strong>Requested:</strong>

₦${Number(data.amountRequested).toLocaleString()}

</p>

<p>

<strong>Fee:</strong>

${data.feePercentage}%

</p>

<p>

<strong>You'll Receive:</strong>

₦${Number(data.amountToReceive).toLocaleString()}

</p>

<p>

<strong>Status:</strong>

${data.status}

</p>

</div>

`;

        });

    }

    catch (error) {

        console.error(error);

    }

}
