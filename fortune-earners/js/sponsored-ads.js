import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    query,
    where
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

        const userRef =
            doc(db, "users", user.uid);

        const userSnap =
            await getDoc(userRef);

        if (!userSnap.exists()) {

            alert("User account not found.");

            return;

        }

        const userData =
            userSnap.data();

        const currentPlan =
            userData.plan || "Not Activated";
                // ======================================
        // CHECK PLAN ACTIVATION
        // ======================================

        if (

            userData.plan === "None" ||

            userData.memberStatus !== "Active"

        ) {

            document.getElementById("adsList").innerHTML = `

<div class="dashboard-card">

<h2>🔒 Sponsored Ads Locked</h2>

<p>

Activate your membership plan to unlock Sponsored Ads and start earning.

</p>

<button onclick="location.href='activate-plan.html'">

💎 Activate Plan

</button>

</div>

`;

            document.getElementById("availableAds").textContent = "0";

            return;

        }

        // ======================================
        // LOAD SPONSORED ADS
        // ======================================

        const adsList =
            document.getElementById("adsList");

        adsList.innerHTML = "";

        const adsQuery =
            query(

                collection(db, "content"),

                where("type", "==", "ad"),

                where("status", "==", "Active")

            );

        const adsSnapshot =
            await getDocs(adsQuery);

        let availableCount = 0;

        adsSnapshot.forEach((adDoc) => {

            const ad =
                adDoc.data();

            // Hide ads that have reached maximum users

            if (

                ad.maxUsers !== null &&

                ad.maxUsers !== undefined &&

                (ad.completedUsers || 0) >= ad.maxUsers

            ) {

                return;

            }

            availableCount++;

            let reward = 0;

            switch (currentPlan) {

                case "NEWBIE":

                    reward = ad.rewardNewbie || 0;

                    break;

                case "SILVER":

                    reward = ad.rewardSilver || 0;

                    break;

                case "GOLD":

                    reward = ad.rewardGold || 0;

                    break;

                case "DIAMOND":

                    reward = ad.rewardDiamond || 0;

                    break;

                case "PREMIUM":

                    reward = ad.rewardPremium || 0;

                    break;

                default:

                    reward = 0;

            }

            adsList.innerHTML += `

<div class="task-card">

<h3>${ad.title}</h3>

<p>${ad.description}</p>

<div class="task-info">

<span>

💰 Reward:

<strong>₦${reward.toLocaleString()}</strong>

</span>

<span class="task-status available">

🟢 Available

</span>

</div>

<button
onclick="location.href='ad-details.html?id=${adDoc.id}'">

📺 View Ad

</button>

</div>

`;

        });

        document.getElementById("availableAds").textContent =
            availableCount;
    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});
