import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc
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

        // Part 2 starts here...

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});
