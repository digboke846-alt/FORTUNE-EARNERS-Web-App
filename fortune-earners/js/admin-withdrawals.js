// ======================================
// IMPORTS
// ======================================

import { auth, db } from "./firebase.js";

import {

    collection,
    getDocs,
    getDoc,
    updateDoc,
    doc,
    query,
    where,
    serverTimestamp

} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {

    onAuthStateChanged,
    signOut

} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// ======================================
// GLOBAL VARIABLES
// ======================================

let selectedWithdrawalId = null;

let selectedWithdrawalData = null;

const withdrawalsContainer =
    document.getElementById("withdrawalsContainer");

const withdrawalModal =
    document.getElementById("withdrawalModal");

const withdrawalDetails =
    document.getElementById("withdrawalDetails");

const adminNote =
    document.getElementById("adminNote");

const approveBtn =
    document.getElementById("approveWithdrawalBtn");

const rejectBtn =
    document.getElementById("rejectWithdrawalBtn");

const closeModal =
    document.getElementById("closeWithdrawalModal");
// ======================================
// ADMIN AUTHENTICATION
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

            window.location.href = "login.html";

            return;

        }

        const userData = userSnap.data();

        if (!userData.isAdmin) {

            alert("Access denied.");

            window.location.href = "dashboard.html";

            return;

        }

        loadWithdrawals();

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});

// ======================================
// LOGOUT
// ======================================

document.getElementById("logoutBtn")
.addEventListener("click", async () => {

    await signOut(auth);

    window.location.href = "login.html";

});

// ======================================
// CLOSE MODAL
// ======================================

closeModal.addEventListener("click", () => {

    withdrawalModal.style.display = "none";

});

window.addEventListener("click", (e) => {

    if (e.target === withdrawalModal) {

        withdrawalModal.style.display = "none";

    }

});
// ======================================
// LOAD WITHDRAWALS
// ======================================

async function loadWithdrawals() {

    withdrawalsContainer.innerHTML =
        "<p>Loading withdrawal requests...</p>";

    try {

        const snapshot =
            await getDocs(collection(db, "withdrawals"));

        withdrawalsContainer.innerHTML = "";

        let pending = 0;
        let approvedToday = 0;
        let rejected = 0;

        let pendingAmount = 0;
        let totalPaid = 0;
        let taskPayout = 0;
        let referralPayout = 0;

        let highestWithdrawal = 0;

        let lastPayment = "None";

        if (snapshot.empty) {

            withdrawalsContainer.innerHTML =
                "<p>No withdrawal requests found.</p>";

        }

        snapshot.forEach(docSnap => {

            const data = docSnap.data();

            const amount = Number(data.amount) || 0;

            if (amount > highestWithdrawal) {

                highestWithdrawal = amount;

            }

            switch (data.status) {

                case "Pending":

                    pending++;

                    pendingAmount += amount;

                    break;

                case "Approved":

                    totalPaid += amount;

                    lastPayment =
                        data.reference || "Paid";

                    if (data.walletType === "Task") {

                        taskPayout += amount;

                    }

                    else if (data.walletType === "Affiliate") {

                        referralPayout += amount;

                    }

                    break;

                case "Rejected":

                    rejected++;

                    break;

            }

        });

        document.getElementById("pendingCount").textContent =
            pending;

        document.getElementById("approvedToday").textContent =
            approvedToday;

        document.getElementById("rejectedCount").textContent =
            rejected;

        document.getElementById("pendingAmount").textContent =
            "₦" + pendingAmount.toLocaleString();

        document.getElementById("totalPaid").textContent =
            "₦" + totalPaid.toLocaleString();

        document.getElementById("taskPayout").textContent =
            "₦" + taskPayout.toLocaleString();

        document.getElementById("referralPayout").textContent =
            "₦" + referralPayout.toLocaleString();

        document.getElementById("highestWithdrawal").textContent =
            "₦" + highestWithdrawal.toLocaleString();

        document.getElementById("lastPayment").textContent =
            lastPayment;

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}
