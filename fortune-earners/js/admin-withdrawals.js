import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    orderBy,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    increment,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import { createNotification } from "./notification-utils.js";

// ======================================
// CHECK LOGIN
// ======================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }

    loadWithdrawals();

});

// ======================================
// CURRENT FILTER
// ======================================

let currentFilter = "All";

// ======================================
// LOAD WITHDRAWALS
// ======================================

async function loadWithdrawals() {

    try {

        const container =
            document.getElementById("withdrawalContainer");

         // 🛡️ SAFEGUARD: Move modal back to body before clearing container
        const modal = document.getElementById("actionModal");
        if (modal && container.contains(modal)) {
            document.body.appendChild(modal);
            modal.style.display = "none";
        }

        container.innerHTML = "";

        const withdrawQuery = query(

    collection(db, "withdrawals"),

    orderBy("submittedAt", "desc")

);

        const snapshot =
            await getDocs(withdrawQuery);

        if (snapshot.empty) {

            container.innerHTML = `

<div class="dashboard-card">

<h3>

📭 No Withdrawal Requests Yet

</h3>

</div>

`;

            return;

        }

        let total = 0;
        let pending = 0;
        let successful = 0;
        let rejected = 0;

        const searchValue =
    document.getElementById("withdrawSearch")
    .value
    .trim()
    .toLowerCase();

snapshot.forEach((docSnap) => {

            const withdraw = docSnap.data();

    // ======================================
// SEARCH
// ======================================

const fullName =
    (withdraw.fullName || "").toLowerCase();

const username =
    (withdraw.username || "").toLowerCase();

const userId =
    (withdraw.userId || "").toLowerCase();

const reference =
    (withdraw.reference || "").toLowerCase();

if (

    searchValue &&

    !fullName.includes(searchValue) &&

    !username.includes(searchValue) &&

    !userId.includes(searchValue) &&

    !reference.includes(searchValue)

) {

    return;

}
// ======================================
// FILTER
// ======================================

if (

    currentFilter !== "All" &&

    withdraw.status !== currentFilter

) {

    return;

}
    
            total++;

            if (withdraw.status === "Pending") pending++;

            if (withdraw.status === "Successful") successful++;

            if (
                withdraw.status === "Rejected" ||
                withdraw.status === "Rejected - Refunded"
            ) {

                rejected++;

            }

            const fee =
    Number(withdraw.feeAmount || 0);

const amountToPay =
    Number(withdraw.amountToReceive || 0);

const card =
    document.createElement("div");

card.className =
    "dashboard-card";

card.innerHTML = `

<h3>

🧾 ${withdraw.reference || "Generating..."}

</h3>

<p>

<strong>👤 Full Name:</strong><br>

${withdraw.fullName || "Not Available"}

</p>

<p>

<strong>Username:</strong><br>

@${withdraw.username || "username"}

</p>

<p>

<strong>🆔 User ID:</strong><br>

${withdraw.userId}

</p>

<p>

<strong>💰 Withdrawal Amount:</strong><br>

₦${Number(withdraw.amountRequested || 0).toLocaleString()}

</p>

<p>

<strong>💸 Withdrawal Fee (10%)</strong><br>

₦${fee.toLocaleString()}

</p>

<p>

<strong>✅ Amount To Pay</strong><br>

₦${amountToPay.toLocaleString()}

</p>

<p>

<strong>🏦 Bank</strong><br>

${withdraw.bankName || "-"}

</p>

<p>

<strong>🔢 Account Number</strong><br>

${withdraw.accountNumber || "-"}

</p>

<p>

<strong>👤 Account Name</strong><br>

${withdraw.accountName || "-"}

</p>

<p>

<strong>📅 Date Requested</strong><br>

${withdraw.requestDate || "-"}

</p>

<p>

<strong>Status:</strong>

🟡 ${withdraw.status}

</p>

${withdraw.status === "Pending" ? `

<div class="dashboard-grid">

<button
class="approve-btn"
onclick="openActionModal('paid','${docSnap.id}', this)">

💚 Mark as Paid

</button>

<button
class="refund-btn"
onclick="openActionModal('refund','${docSnap.id}', this)">

💛 Reject & Refund

</button>

<button
class="reject-btn"
onclick="openActionModal('reject','${docSnap.id}', this)">

❌ Reject Permanently

</button>

</div>

<hr>

` : `

<div class="dashboard-card">

<p><strong>✅ Already Processed</strong></p>

<p>

<strong>Processed by:</strong><br>

${withdraw.processedBy || "-"}

</p>

<p>

<strong>Processed on:</strong><br>

${withdraw.processedAt
? new Date(withdraw.processedAt.seconds * 1000).toLocaleString()
: "-"}

</p>

${withdraw.status === "Rejected" && withdraw.adminComment ? `

<p>

<strong>Reason:</strong><br>

${withdraw.adminComment}

</p>

` : ""}

</div>

`}

`;

container.appendChild(card);

        });

        document.getElementById("totalWithdrawals").textContent =
            total;

        document.getElementById("pendingWithdrawals").textContent =
            pending;

        document.getElementById("paidWithdrawals").textContent =
            paid;

        document.getElementById("rejectedWithdrawals").textContent =
            rejected;

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}
// ======================================
// ACTION MODAL
// ======================================

let selectedWithdrawalId = null;
let selectedAction = null;

window.openActionModal = function(action, withdrawalId, buttonElement) {

    selectedWithdrawalId = withdrawalId;
    selectedAction = action;

    const modal =
        document.getElementById("actionModal");

    const title =
        document.getElementById("actionTitle");

    const comment =
        document.getElementById("adminComment");

    comment.value = "";

    if (action === "paid") {

        title.textContent =
            "💚 Mark Withdrawal as Paid";

    }

    if (action === "refund") {

        title.textContent =
            "💛 Reject & Refund";

    }

    if (action === "reject") {

        title.textContent =
            "❌ Reject Permanently";

    }

    // Move the modal element dynamically under the selected card
    if (buttonElement) {
        const card = buttonElement.closest(".dashboard-card");
        if (card) {
            card.insertAdjacentElement("afterend", modal);
        }
    }

    modal.style.display = "block";

    modal.scrollIntoView({

        behavior: "smooth",

        block: "center"

    });

};

// ======================================
// CANCEL
// ======================================

document.getElementById("cancelActionBtn")
.addEventListener("click", () => {

    document.getElementById("actionModal")
    .style.display = "none";

});

// ======================================
// CONFIRM
// ======================================

document.getElementById("confirmActionBtn")
.addEventListener("click", async () => {

    const comment =
        document.getElementById("adminComment")
        .value.trim();

    document.getElementById("actionModal")
    .style.display = "none";

    if (selectedAction === "paid") {

        await markAsPaid(
            selectedWithdrawalId,
            comment
        );

    }

    if (selectedAction === "refund") {

        await rejectAndRefund(
            selectedWithdrawalId,
            comment
        );

    }

    if (selectedAction === "reject") {

        await rejectPermanent(
            selectedWithdrawalId,
            comment
        );

    }

});
// ======================================
// MARK AS PAID
// ======================================

async function markAsPaid(withdrawalId, adminComment) {

    try {

        const withdrawalRef =
            doc(db, "withdrawals", withdrawalId);

        const withdrawalSnap =
            await getDoc(withdrawalRef);

        if (!withdrawalSnap.exists()) {

            alert("Withdrawal not found.");

            return;

        }

        const withdrawal =
            withdrawalSnap.data();

        // ======================================
        // PREVENT DOUBLE COUNTING
        // ======================================

        if (withdrawal.status === "Successful") {

            alert("This withdrawal has already been marked as Paid.");

            return;

        }

        // ======================================
        // MARK WITHDRAWAL AS SUCCESSFUL
        // ======================================

        await updateDoc(withdrawalRef, {

            status: "Paid",

            refundStatus: "Not Applicable",

            adminComment:
                adminComment || "",

            processedBy:
                auth.currentUser.email,

            processedAt:
                serverTimestamp()

        });

        // ======================================
        // UPDATE USER LIFETIME WITHDRAWALS
        // ======================================

        const userRef =
            doc(db, "users", withdrawal.userId);

        const userSnap =
            await getDoc(userRef);

        if (userSnap.exists()) {

            const userData =
                userSnap.data();

            await updateDoc(userRef, {

                totalWithdrawals:
                    Number(userData.totalWithdrawals || 0) +
                    Number(withdrawal.amountRequested || 0)

            });

        }


        await addDoc(collection(db, "transactions"), {
    userId: withdrawalUserId, // Target user ID receiving/requesting the withdrawal
    title: "Withdrawal Approved",
    amount: Number(withdrawalAmount),
    type: "debit",
    createdAt: serverTimestamp()
});

        
        // ======================================
        // NOTIFICATION
        // ======================================

        await createNotification({

            userId: withdrawal.userId,

            title:
                "✅ Withdrawal Approved",

            message:
                `Your withdrawal of ₦${Number(
                    withdrawal.amountRequested || 0
                ).toLocaleString()} has been approved successfully. The funds should reflect in your bank account shortly.`,

            type:
                "Withdrawal"

        });

        alert("✅ Withdrawal marked as Paid.");

        loadWithdrawals();

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}
// ======================================
// REJECT & REFUND
// ======================================

async function rejectAndRefund(withdrawalId, comment) {

    try {

        const adminEmail =
            auth.currentUser?.email || "Admin";

        const withdrawRef =
            doc(db, "withdrawals", withdrawalId);

        const withdrawSnap =
            await getDoc(withdrawRef);

        if (!withdrawSnap.exists()) {

            alert("Withdrawal not found.");

            return;

        }

        const withdraw =
            withdrawSnap.data();

        // ======================================
// DO NOT REFUND AFFILIATE WITHDRAWALS
// ======================================

if (withdraw.walletType === "Affiliate Wallet") {

    alert(
        "Affiliate withdrawals are processed automatically by Paystack and cannot be manually refunded."
    );

    return;

}

        const userRef =
            doc(db, "users", withdraw.userId);

        await updateDoc(userRef, {

    taskWallet:
        increment(Number(withdraw.amountRequested || 0))

});

        await updateDoc(withdrawRef, {

            status: "Rejected & Fully Refunded",

refundStatus: "Refunded",

            adminComment: comment || "",

            processedBy: adminEmail,

            processedAt: serverTimestamp()

        });

        await createNotification({

    userId: withdraw.userId,

    title: "💛 Withdrawal Refunded",

    message:
        `Your withdrawal request of ₦${Number(withdraw.amountRequested).toLocaleString()} was rejected.\n\nThe full amount has been refunded to your Task Wallet.\n\nReason: ${comment || "No reason provided."}`,

    type: "Withdrawal"

});

        alert("💛 Withdrawal rejected and wallet refunded.");

        loadWithdrawals();

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}

// ======================================
// REJECT PERMANENTLY
// ======================================

async function rejectPermanent(withdrawalId, comment) {

    try {

        const adminEmail =
            auth.currentUser?.email || "Admin";

        const withdrawRef =
            doc(db, "withdrawals", withdrawalId);

        await updateDoc(withdrawRef, {

            status: "Rejected - No Refund",

refundStatus: "Not Refunded",

            adminComment: comment || "",

            processedBy: adminEmail,

            processedAt: serverTimestamp()

        });

        await createNotification({

    userId: withdraw.userId,

    title: "❌ Withdrawal Rejected",

    message:
        `Your withdrawal request of ₦${Number(withdraw.amountRequested).toLocaleString()} has been permanently rejected.\n\nReason: ${comment || "No reason provided."}`,

    type: "Withdrawal"

});

        alert("❌ Withdrawal permanently rejected.");

        loadWithdrawals();

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}
// ======================================
// SEARCH BAR
// ======================================

document.getElementById("withdrawSearch")
.addEventListener("input", () => {

    loadWithdrawals();

});
// ======================================
// FILTER BUTTONS
// ======================================

document.getElementById("filterAll")
.addEventListener("click", () => {

    currentFilter = "All";

    loadWithdrawals();

});

document.getElementById("filterPending")
.addEventListener("click", () => {

    currentFilter = "Pending";

    loadWithdrawals();

});

document.getElementById("filterPaid")
.addEventListener("click", () => {

    currentFilter = "Paid";

    loadWithdrawals();

});

document.getElementById("filterRejected")
.addEventListener("click", () => {

    currentFilter = "Rejected";

    loadWithdrawals();

});
