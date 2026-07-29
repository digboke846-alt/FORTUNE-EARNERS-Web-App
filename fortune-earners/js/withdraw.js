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
    serverTimestamp,
    updateDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// ======================================
// GLOBAL VARIABLES
// ======================================

let currentUserData = null;

let selectedWallet = "task";

let feePercentage = 10;

let minimumWithdrawal = 0;

let isSubmittingWithdrawal = false;

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

        const submitWithdrawBtn =
    document.getElementById("submitWithdrawalBtn");

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

    if (isSubmittingWithdrawal) {
    return;
}

isSubmittingWithdrawal = true;

    // ======================================
    // CHECK BANK DETAILS
    // ======================================
const latestUserSnap =
    await getDoc(doc(db, "users", auth.currentUser.uid));

const latestUser =
    latestUserSnap.data();

if (
    !latestUser.bankName ||
    !latestUser.accountName ||
    !latestUser.accountNumber
) {

    alert(
        "⚠️ Please add your bank details before requesting a withdrawal.\n\nYou will now be redirected to your profile to update your bank details."
    );

    window.location.href = "profile.html";

    return;
}
    
    document.getElementById("submitWithdrawalBtn").disabled = true;

    document.getElementById("submitWithdrawalBtn").textContent =
    "⏳ Processing...";

    try {

        const amount =
            Number(withdrawAmount.value);

        if (!amount || amount <= 0) {

            document.getElementById("submitWithdrawalBtn").disabled = false;

            document.getElementById("submitWithdrawalBtn").textContent =
    "💸 Submit Withdrawal";
            isSubmittingWithdrawal = false;

            alert("Enter a valid withdrawal amount.");

            return;

        }

        if (amount < minimumWithdrawal) {

            document.getElementById("submitWithdrawalBtn").disabled = false;

            document.getElementById("submitWithdrawalBtn").textContent =
    "💸 Submit Withdrawal";
            isSubmittingWithdrawal = false;

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

            document.getElementById("submitWithdrawalBtn").disabled = false;

            document.getElementById("submitWithdrawalBtn").textContent =
    "💸 Submit Withdrawal";
            isSubmittingWithdrawal = false;

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

    fullName: currentUserData.fullname || "",

    walletType: selectedWallet,

    amountRequested: amount,

    feePercentage: feePercentage,

    feeAmount: fee,

    amountToReceive: receive,

    bankName: currentUserData.bankName || "",

    accountName: currentUserData.accountName || "",

    accountNumber: currentUserData.accountNumber || "",

    status: "Pending",

    refundStatus: "Not Applicable",

    adminComment: "",

    processedBy: "",

    processedAt: null,

    submittedAt: serverTimestamp(),

    requestDate: new Date().toLocaleString()

});
        document.getElementById("submitWithdrawalBtn").textContent =
    "✅ Withdrawal Submitted";

        // ======================================
// DEDUCT WALLET IMMEDIATELY
// ======================================

const userRef =
    doc(db, "users", auth.currentUser.uid);

if (selectedWallet === "task") {

    await updateDoc(userRef, {

        taskWallet:
            Number(currentUserData.taskWallet || 0) - amount

    });

    currentUserData.taskWallet =
        Number(currentUserData.taskWallet || 0) - amount;

}

else {

    await updateDoc(userRef, {

        affiliateWallet:
            Number(currentUserData.affiliateWallet || 0) - amount

    });

    currentUserData.affiliateWallet =
        Number(currentUserData.affiliateWallet || 0) - amount;

}

        alert(
            selectedWallet === "task"
            ? "✅ Withdrawal request submitted successfully."
            : "✅ Affiliate withdrawal processed successfully."
        );

        withdrawAmount.value = "";

calculateWithdrawal();

// ======================================
// REFRESH WALLET DISPLAY
// ======================================

taskWallet.textContent =
    "₦" + Number(
        currentUserData.taskWallet || 0
    ).toLocaleString();

affiliateWallet.textContent =
    "₦" + Number(
        currentUserData.affiliateWallet || 0
    ).toLocaleString();

loadWithdrawalHistory(auth.currentUser.uid);

    }

    catch (error) {

        document.getElementById("submitWithdrawalBtn").disabled = false;

document.getElementById("submitWithdrawalBtn").textContent =
    "💸 Submit Withdrawal";
        isSubmittingWithdrawal = false;

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

            where("userId", "==", userId),

        orderBy("submittedAt", "desc")

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

<strong>💸 Amount Withdrawn:</strong>

₦${Number(data.amountRequested).toLocaleString()}

</p>

<p>

<strong>🧾 Reference:</strong>

${data.reference || "Not Available"}

</p>

<p>

<strong>📅 Date:</strong>

${data.requestedDate || "-"}

</p>

<p>

<strong>📌 Status:</strong>

<span class="status-badge ${

data.status === "Pending"

? "pending"

: data.status === "Successful"

? "paid"

: data.status === "Rejected"

? "rejected"

: "rejected-no-refund"

}">

${data.status}

</span>

</p>

${data.adminComment ?

`<p>

<strong>📝 Admin Comment:</strong>

${data.adminComment}

</p>`

: ""}

</div>

`;

        });

    }

    catch (error) {

        console.error(error);

    }

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
