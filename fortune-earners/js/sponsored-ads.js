import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    query,
    where,
    documentId,
    onSnapshot
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
// USER COMPLETED ADS
// ======================================

const completedAdsRef =
    collection(db, "completedSponsoredAds");

const completedAdsQuery =
    query(
        completedAdsRef,
        where("userId", "==", user.uid)
    );

const completedAdsSnap =
    await getDocs(completedAdsQuery);

const completedAds =
    new Set();

completedAdsSnap.forEach(docSnap => {

    const item =
        docSnap.data();

    completedAds.add(item.adId);

});
        
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

            if (availableCount === 0) {

    adsList.innerHTML = `
        <div class="task-card">
            <h3>📺 No Sponsored Ad Available</h3>

            <p>
                No Sponsored Ad available at the moment.
                Please check back later.
            </p>
        </div>
    `;

            }

            document.getElementById("availableAds").textContent = "0";

            return;

        }

        // ======================================
        // LOAD SPONSORED ADS
        // ======================================

        const adsList =
            document.getElementById("adsList");

        adsList.innerHTML = "";

        const completedAdsList =
    document.getElementById("completedAdsList");

const noCompletedAdsMessage =
    document.getElementById("noCompletedAdsMessage");

if (completedAdsList) {
    completedAdsList.innerHTML = "";
}

if (noCompletedAdsMessage) {
    noCompletedAdsMessage.style.display =
        completedAds.size > 0 ? "none" : "block";
}

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

            // ======================================
// CALCULATE REWARD FOR USER'S PLAN
// ======================================

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

            // ======================================
// CHECK IF USER HAS COMPLETED THIS AD
// ======================================

const completedAdsList =
    document.getElementById("completedAdsList");

if (completedAds.has(adDoc.id)) {

    completedAdsList.innerHTML += `

<div class="task-card">

<h3>${ad.title}</h3>

<p>${ad.description}</p>

<div class="task-info">

<span>

💰 Reward:
<strong>₦${reward.toLocaleString()}</strong>

</span>

</div>

<div class="task-status completed">

<span>

🟢 Status:

✅ Completed

</span>

</div>

<button
    class="completed-ad-btn"
    disabled>
    🎉 Reward Claimed
</button>



</div>

`;

    return;

}

            availableCount++;

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
onclick="location.href='sponsored-ads-details.html?id=${adDoc.id}'">

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

// ======================================
// LOG OUT
// ======================================

const logoutLink =
    document.getElementById("logoutBtn");

if (logoutLink) {

    logoutLink.addEventListener("click", async (e) => {

        e.preventDefault();

        const confirmLogout = confirm(
            "Are you sure you want to log out?"
        );

        if (!confirmLogout) return;

        try {

            await signOut(auth);

            window.location.href = "login.html";

        }

        catch (error) {

            console.error(error);

            alert("Logout failed.");

        }

    });

}
// ======================================
// LOAD NOTIFICATION BADGE
// ======================================
let previousUnreadCount = 0;

function loadNotificationBadge(userId) {

    const badge =
        document.getElementById("notificationBadge");

    if (!badge) return;

    const q = query(

    collection(db, "notifications"),

    where("userId", "==", userId),

    where("isRead", "==", false),

    orderBy("createdAt", "desc")

);

    onSnapshot(q, (snapshot) => {

        const unreadCount = snapshot.size;

        if (unreadCount > previousUnreadCount && unreadCount > 0) {

    const newestNotification = snapshot.docs[0]?.data();

    if (newestNotification) {

        showNotificationToast(

            newestNotification.title,

            newestNotification.message

        );

    }

}

previousUnreadCount = unreadCount;

        if (unreadCount === 0) {

            badge.classList.add("hidden");

            return;

        }

        badge.classList.remove("hidden");

        badge.textContent =

            unreadCount > 9

                ? "9+"

                : unreadCount;

    });

}

function showNotificationToast(title, message) {

    const toast =
        document.getElementById("notificationToast");

    const toastTitle =
        document.getElementById("toastTitle");

    const toastMessage =
        document.getElementById("toastMessage");

    if (!toast) return;

    toastTitle.textContent = title;

    toastMessage.textContent = message;

    toast.classList.remove("hidden");

    toast.classList.add("show");

    const sound =
    document.getElementById("notificationSound");

if (sound && notificationSoundUnlocked) {

    sound.currentTime = 0;

    sound.play();

}
    
    setTimeout(() => {

        toast.classList.remove("show");

        setTimeout(() => {

            toast.classList.add("hidden");

        }, 350);

    }, 5000);

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
