import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    orderBy
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

            // Card comes in Part 3

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
