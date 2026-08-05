import { auth, db } from "./firebase.js";

import {

    onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {

    doc,

    getDoc

} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


// ======================================
// GET AD ID
// ======================================

const params = new URLSearchParams(window.location.search);

const adId = params.get("id");

if (!adId) {

    alert("Advertisement not found.");

    window.location.href = "sponsored-ads.html";

}


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


        const adRef =
            doc(db, "content", adId);

        const adSnap =
            await getDoc(adRef);

        if (!adSnap.exists()) {

            alert("Advertisement not found.");

            window.location.href = "sponsored-ads.html";

            return;

        }

        const ad =
            adSnap.data();


        // ======================================
        // CALCULATE REWARD
        // ======================================

        let reward = 0;

        switch (userData.plan) {

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

        }


        // ======================================
        // DISPLAY AD
        // ======================================

        document.getElementById("adTitle").textContent =
            ad.title;

        document.getElementById("adDescription").textContent =
            ad.description;

        document.getElementById("rewardAmount").textContent =
            "₦" + reward.toLocaleString();


    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});
