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
    updateDoc,
    increment,
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

    loadWithdrawals();

});

// ======================================
// LOAD WITHDRAWALS
// ======================================

async function loadWithdrawals() {

    try {

        const container =
            document.getElementById("withdrawalContainer");

        container.innerHTML = "";

        const withdrawQuery = query(

            collection(db, "withdrawals"),

            orderBy("requestedAt", "desc")

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
        let paid = 0;
        let rejected = 0;

        snapshot.forEach((docSnap) => {

            const withdraw = docSnap.data();

            total++;

            if (withdraw.status === "Pending") pending++;

            if (withdraw.status === "Paid") paid++;

            if (
                withdraw.status === "Rejected" ||
                withdraw.status === "Rejected - Refunded"
            ) {

                rejected++;

            }

            const fee =
    Math.round(Number(withdraw.amount || 0) * 0.10);

const amountToPay =
    Number(withdraw.amount || 0) - fee;

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

<strong>@ Username:</strong><br>

@${withdraw.username || "username"}

</p>

<p>

<strong>🆔 User ID:</strong><br>

${withdraw.userId}

</p>

<p>

<strong>💰 Withdrawal Amount:</strong><br>

₦${Number(withdraw.amount || 0).toLocaleString()}

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

<div class="dashboard-grid">

<button
class="approve-btn"
onclick="openActionModal('paid','${docSnap.id}')">

💚 Mark as Paid

</button>

<button
class="warning-btn"
onclick="openActionModal('refund','${docSnap.id}')">

💛 Reject & Refund

</button>

<button
class="delete-btn"
onclick="openActionModal('reject','${docSnap.id}')">

❤️ Reject Permanently

</button>

</div>

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

window.openActionModal = function(action, withdrawalId) {

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
            "❤️ Reject Permanently";

    }

    modal.style.display = "block";

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

        await updateDoc(withdrawalRef, {

            status: "Paid",

            adminComment: adminComment || "",

            processedBy:
                auth.currentUser.email,

            processedAt:
                serverTimestamp()

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

        const userRef =
            doc(db, "users", withdraw.userId);

        await updateDoc(userRef, {

            taskWallet:
                increment(Number(withdraw.amount || 0))

        });

        await updateDoc(withdrawRef, {

            status: "Rejected",

refundStatus: "Refunded",

            adminComment: comment || "",

            processedBy: adminEmail,

            processedAt: serverTimestamp()

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

            status: "Rejected",

            adminComment: comment || "",

            processedBy: adminEmail,

            processedAt: serverTimestamp()

        });

        alert("❤️ Withdrawal permanently rejected.");

        loadWithdrawals();

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}
