import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs
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

        // ======================================
        // LOAD REFERRAL STATISTICS
        // ======================================

        document.getElementById("totalReferrals").textContent =
            userData.totalReferrals || 0;

        document.getElementById("validReferrals").textContent =
            userData.validReferrals || 0;

        document.getElementById("referralEarnings").textContent =
            "₦" + Number(userData.referralEarnings || 0).toLocaleString();

        document.getElementById("affiliateWallet").textContent =
            "₦" + Number(userData.affiliateWallet || 0).toLocaleString();

        // ======================================
        // GENERATE REFERRAL LINK
        // ======================================

        const referralLink =

`https://fortunearners.netlify.app/signup.html?ref=${userData.username}`;

        document.getElementById("referralLink").value =
            referralLink;

        // ======================================
// COPY REFERRAL LINK
// ======================================

const copyBtn =
    document.getElementById("copyReferralBtn");

copyBtn.addEventListener("click", async () => {

    try {

        await navigator.clipboard.writeText(referralLink);

        alert("✅ Referral link copied successfully!");

    }

    catch {

        const input =
            document.getElementById("referralLink");

        input.select();

        document.execCommand("copy");

        alert("✅ Referral link copied successfully!");

    }

});

// ======================================
// SHARE REFERRAL LINK
// ======================================

const shareBtn =
    document.getElementById("shareReferralBtn");

shareBtn.addEventListener("click", async () => {

    const shareMessage =

`🚀 Join Fortune Earners and start earning online!

Use my referral link to register:

${referralLink}`;

    if (navigator.share) {

        try {

            await navigator.share({

                title: "Fortune Earners",

                text: shareMessage

            });

        }

        catch {

            // User cancelled sharing

        }

    }

    else {

        try {

            await navigator.clipboard.writeText(shareMessage);

            alert(
                "Sharing is not supported on this device.\n\nThe referral message has been copied instead."
            );

        }

        catch {

            alert(
                "Your device does not support sharing."
            );

        }

    }

});

// ======================================
// LOAD REFERRAL HISTORY
// ======================================

const referralHistory =
    document.getElementById("referralHistory");

const referralsQuery =
    query(
        collection(db, "users"),
        where("referredBy", "==", userData.username)
    );

const referralsSnapshot =
    await getDocs(referralsQuery);

referralHistory.innerHTML = "";

if (referralsSnapshot.empty) {

    referralHistory.innerHTML = `

        <p>

            No referrals yet.

        </p>

    `;

}

else {

    referralsSnapshot.forEach((refDoc) => {

        const refUser =
            refDoc.data();

        referralHistory.innerHTML += `

        <div class="dashboard-card">

            <h3>

                👤 ${refUser.fullname}

            </h3>

            <p>

                Username: @${refUser.username}

            </p>

            <p>

                Plan: ${refUser.plan}

            </p>

            <p>

                Status: ${refUser.memberStatus}

            </p>

        </div>

        `;

    });

}

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

});
