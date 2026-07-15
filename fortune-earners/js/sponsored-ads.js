import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs,
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

    document.getElementById("adsContainer").innerHTML = `

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

    return;

}

        const adsContainer =
            document.getElementById("adsContainer");

        adsContainer.innerHTML =
            "<p>Loading sponsored ads...</p>";

        // ======================================
// LOAD SPONSORED ADS
// ======================================

const adsQuery = query(

    collection(db, "sponsoredAds"),

    where("active", "==", true)

);

const querySnapshot = await getDocs(adsQuery);

adsContainer.innerHTML = "";

if (querySnapshot.empty) {

    adsContainer.innerHTML = `

        <div class="dashboard-card">

            <h3>No Sponsored Ads Available</h3>

            <p>

                Please check back later.

            </p>

        </div>

    `;

    return;

}

querySnapshot.forEach((doc) => {

    const ad = doc.data();

    adsContainer.innerHTML += `

        <div class="dashboard-card">

            <h3>

                📺 ${ad.title}

            </h3>

            <p>

                ${ad.description}

            </p>

            <button
                onclick="location.href='sponsored-ad-details.html?id=${doc.id}'">

                🚀 Open Ad

            </button>

        </div>

    `;

});

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});
