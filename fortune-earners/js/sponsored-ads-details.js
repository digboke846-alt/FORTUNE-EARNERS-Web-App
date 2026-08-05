import { auth, db } from "./firebase.js";

import {

    onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {

    doc,

    getDoc,

    setDoc,

    updateDoc,

    serverTimestamp

} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {

    createNotification

} from "./notification-utils.js";

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


    // ======================================
// CHECK IF ALREADY CLAIMED TODAY
// ======================================

const completedRef =
    doc(db, "completedSponsoredAds", `${user.uid}_${adId}`);

const completedSnap =
    await getDoc(completedRef);

const today =
    new Date().toISOString().split("T")[0];

if (completedSnap.exists()) {

    const completedData =
        completedSnap.data();

    if (completedData.completedDate === today) {

        document.getElementById("openAdBtn").style.display = "none";

        document.getElementById("claimRestriction")
            .classList.add("hidden");

        document.getElementById("claimRewardBtn")
            .style.display = "none";

        document.getElementById("claimedMessage")
            .classList.remove("hidden");

        return;

    }

}

// ======================================
// OPEN AD + START COUNTDOWN
// ======================================

const openAdBtn =
    document.getElementById("openAdBtn");

const claimRestriction =
    document.getElementById("claimRestriction");

const countdownElement =
    document.getElementById("countdown");

const claimRewardBtn =
    document.getElementById("claimRewardBtn");

let timerStarted = false;

openAdBtn.addEventListener("click", () => {

    // Prevent opening multiple times

    if (timerStarted) return;

    timerStarted = true;

    // Open advertiser link

    window.open(ad.link, "_blank");

    // Hide Open button

    openAdBtn.style.display = "none";

    // Show countdown section

    claimRestriction.classList.remove("hidden");

    let seconds = 60;

    countdownElement.textContent = seconds;

    const countdown = setInterval(() => {

        seconds--;

        countdownElement.textContent = seconds;

        if (seconds <= 0) {

            clearInterval(countdown);

            claimRestriction.classList.add("hidden");

            claimRewardBtn.classList.remove("hidden");

            claimRewardBtn.disabled = false;

        }

    }, 1000);

});

                // ======================================
// CLAIM REWARD
// ======================================

claimRewardBtn.addEventListener("click", async () => {

    claimRewardBtn.disabled = true;

    claimRewardBtn.textContent =
        "Processing...";

    try {

        const completedRef =
            doc(

                db,

                "completedSponsoredAds",

                `${user.uid}_${adId}`

            );

        const completedSnap =
            await getDoc(completedRef);

        if (completedSnap.exists()) {

            alert(
                "You have already claimed this reward today."
            );

            return;

        }

        // ======================================
// CREDIT USER
// ======================================

await updateDoc(userRef, {

    taskWallet:
        Number(userData.taskWallet || 0) +
        Number(reward),

    earnedToday:
        Number(userData.earnedToday || 0) +
        Number(reward),

    sponsoredAdsToday:
        Number(userData.sponsoredAdsToday || 0) + 1,

    sponsoredAdsViewed:
        Number(userData.sponsoredAdsViewed || 0) + 1

});


// ======================================
// SAVE COMPLETED AD
// ======================================

await setDoc(completedRef, {

    userId: user.uid,

    adId: adId,

    completedDate:
        new Date().toISOString().split("T")[0],

    createdAt:
        serverTimestamp()

});


// ======================================
// CREATE NOTIFICATION
// ======================================

await createNotification(

    user.uid,

    "Sponsored Ad Completed",

    `🎉 Congratulations! You earned ₦${reward.toLocaleString()} from Sponsored Advertisement.`,

    "Sponsored Ads"

);

        // ======================================
// SUCCESS UI
// ======================================

claimRewardBtn.style.display = "none";

document.getElementById("claimedMessage")
.classList.remove("hidden");

alert(
    `🎉 Congratulations!\n\nYou have successfully earned ₦${reward.toLocaleString()} from this Sponsored Advertisement.`
);

        }

    catch (error) {

        console.error(error);

        claimRewardBtn.disabled = false;

claimRewardBtn.textContent =
    "🎁 Claim Reward";

        alert(error.message);

    }

});

        }

catch (error) {

    console.error(error);

    alert(error.message);

}

});
