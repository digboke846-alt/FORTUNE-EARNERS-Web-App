import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
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

        // Get user document

        const userRef = doc(db, "users", user.uid);

        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {

            alert("User account not found.");

            await signOut(auth);

            window.location.href = "login.html";

            return;

        }

        const data = userSnap.data();

        // ======================================
        // LOAD USER INFORMATION
        // ======================================

        document.getElementById("userFullName").textContent =
            data.fullname || "Member";

        document.getElementById("popupUserName").textContent =
            data.fullname || "Member";

        document.getElementById("currentPlan").textContent =
            data.plan || "Not Activated";

        document.getElementById("memberStatus").textContent =
            data.memberStatus || "Active";

        // ======================================
        // LOAD WALLETS
        // ======================================

        const affiliateWallet =
            Number(data.affiliateWallet || 0);

        const taskWallet =
            Number(data.taskWallet || 0);

        document.getElementById("affiliateWallet").textContent =
            "₦" + affiliateWallet.toLocaleString();

        document.getElementById("taskWallet").textContent =
            "₦" + taskWallet.toLocaleString();

        document.getElementById("totalBalance").textContent =
            "₦" + (affiliateWallet + taskWallet).toLocaleString();

        // ======================================
        // REFERRAL LINK
        // ======================================

        const referralLink =
            "https://fortunearner.netlify.app/signup?ref=" +
            data.username;

        document.getElementById("referralLink").value =
            referralLink;
              // ======================================
        // LOAD STATISTICS
        // ======================================

        document.getElementById("totalReferrals").textContent =
            data.totalReferrals || 0;

        document.getElementById("tasksCompleted").textContent =
            data.tasksCompleted || 0;

        document.getElementById("adsViewed").textContent =
            data.sponsoredAdsViewed || 0;

        document.getElementById("totalWithdrawals").textContent =
            "₦" + Number(data.totalWithdrawals || 0).toLocaleString();

        // ======================================
        // TODAY SUMMARY
        // ======================================

        document.getElementById("tasksCompletedToday").textContent =
            (data.tasksCompletedToday || 0) + "/5";

        document.getElementById("adsViewedToday").textContent =
            (data.adsViewedToday || 0) + "/5";

        document.getElementById("referralsToday").textContent =
            data.referralsToday || 0;

        document.getElementById("earnedToday").textContent =
            "₦" + Number(data.earnedToday || 0).toLocaleString();

        // ======================================
        // TELEGRAM & WHATSAPP LINKS
        // ======================================

        document.getElementById("telegramChannelBtn").href =
            "https://t.me/TgEarnVault";

        document.getElementById("telegramGroupBtn").href =
            "https://t.me/EarnVaultCHAT";

        document.getElementById("whatsappChannelBtn").href =
            "https://chat.whatsapp.com/CKJ2Awq0F5F8xpaq31JJlP?s=cl&p=a&ilr=1";

        // ======================================
        // SHOW WELCOME POPUP
        // ======================================

        const popup =
            document.getElementById("welcomePopup");

        const hidePopup =
            document.getElementById("hidePopup");

        const continueBtn =
            document.getElementById("continueDashboard");

        if (localStorage.getItem("hideWelcomePopup") !== "true") {

            popup.style.display = "flex";

        }

        continueBtn.addEventListener("click", () => {

            if (hidePopup.checked) {

                localStorage.setItem(
                    "hideWelcomePopup",
                    "true"
                );

            }

            popup.style.display = "none";

        });
              // ======================================
        // COPY REFERRAL LINK
        // ======================================

        const copyBtn =
            document.getElementById("copyReferralBtn");

        copyBtn.addEventListener("click", async () => {

            try {

                await navigator.clipboard.writeText(
                    document.getElementById("referralLink").value
                );

                alert("✅ Referral link copied successfully!");

            } catch (error) {

                alert("Unable to copy referral link.");

            }

        });

    } catch (error) {

        console.error(error);

        alert("Failed to load your dashboard.");

    }

});

// ======================================
// LOG OUT
// ======================================

const logoutLink = document.querySelector(
    '#menu a:last-child'
);

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

        } catch (error) {

            alert("Logout failed.");

            console.error(error);

        }

    });

}
