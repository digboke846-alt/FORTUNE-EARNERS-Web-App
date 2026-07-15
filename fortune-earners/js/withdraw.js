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

        const userRef = doc(db, "users", user.uid);

        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {

            alert("User account not found.");

            return;

        }

        const userData = userSnap.data();

        // ======================================
        // CHECK PLAN ACTIVATION
        // ======================================

        if (userData.memberStatus !== "Active") {

            document.getElementById("withdrawContainer").innerHTML = `

                <div class="dashboard-card">

                    <h2>🔒 Withdrawals Locked</h2>

                    <p>

                        Activate your membership plan before requesting withdrawals.

                    </p>

                    <button onclick="location.href='activate-plan.html'">

                        💎 Activate Plan

                    </button>

                </div>

            `;

            return;

        }

        // ======================================
        // LOAD USER DATA
        // ======================================

        document.getElementById("affiliateBalance").textContent =
            "₦" + Number(userData.affiliateWallet || 0).toLocaleString();

        document.getElementById("taskBalance").textContent =
            "₦" + Number(userData.taskWallet || 0).toLocaleString();

        document.getElementById("bankName").textContent =
            userData.bankName || "Not Added";

        document.getElementById("accountNumber").textContent =
            userData.accountNumber || "Not Added";

        document.getElementById("accountName").textContent =
            userData.accountName || "Not Added";

        // ======================================
// WITHDRAWAL CALCULATOR
// ======================================

const walletRadios =
    document.querySelectorAll("input[name='wallet']");

const amountInput =
    document.getElementById("withdrawAmount");

const summaryAmount =
    document.getElementById("summaryAmount");

const processingFee =
    document.getElementById("processingFee");

const receiveAmount =
    document.getElementById("receiveAmount");

const withdrawAllBtn =
    document.getElementById("withdrawAllBtn");

let selectedWallet = "";

let availableBalance = 0;

// Wallet Selection
walletRadios.forEach((radio) => {

    radio.addEventListener("change", () => {

        selectedWallet = radio.value;

        if (selectedWallet === "affiliate") {

            availableBalance =
                Number(userData.affiliateWallet || 0);

        } else {

            availableBalance =
                Number(userData.taskWallet || 0);

        }

    });

});

// Withdraw All
withdrawAllBtn.addEventListener("click", () => {

    amountInput.value = availableBalance;

    calculateWithdrawal();

});

// Live Calculation
amountInput.addEventListener("input", calculateWithdrawal);

function calculateWithdrawal() {

    const amount =
        Number(amountInput.value) || 0;

    const fee =
        amount * 0.07;

    const receive =
        amount - fee;

    summaryAmount.textContent =
        "₦" + amount.toLocaleString();

    processingFee.textContent =
        "₦" + fee.toLocaleString();

    receiveAmount.textContent =
        "₦" + receive.toLocaleString();

}
        // ======================================
// SUBMIT WITHDRAWAL REQUEST
// ======================================

const confirmWithdrawBtn =
    document.getElementById("confirmWithdrawBtn");

confirmWithdrawBtn.addEventListener("click", async (e) => {

    e.preventDefault();

    if (!selectedWallet) {

        alert("Please select a wallet.");

        return;

    }

    const amount =
        Number(amountInput.value);

    if (!amount || amount < 1000) {

        alert("Minimum withdrawal is ₦1,000.");

        return;

    }

    if (amount > availableBalance) {

        alert("Insufficient wallet balance.");

        return;

    }

    if (
        !userData.bankName ||
        !userData.accountNumber ||
        !userData.accountName
    ) {

        alert("Please add your bank details before requesting a withdrawal.");

        window.location.href = "profile.html";

        return;

    }

    const fee = amount * 0.07;

    const receive = amount - fee;

    await setDoc(
        doc(db, "withdrawRequests", user.uid),
        {

            userId: user.uid,

            fullname: userData.fullname,

            username: userData.username,

            wallet: selectedWallet,

            amount: amount,

            processingFee: fee,

            amountToReceive: receive,

            bankName: userData.bankName,

            accountNumber: userData.accountNumber,

            accountName: userData.accountName,

            status: "Pending",

            requestedAt: serverTimestamp()

        }

    );

    document.getElementById("withdrawStatus").textContent =
        "Pending Approval";

    confirmWithdrawBtn.disabled = true;

    confirmWithdrawBtn.textContent =
        "Withdrawal Submitted";

    alert(
        "✅ Withdrawal request submitted successfully.\n\nOur admin will review and process it."
    );

});

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});
