import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    where,
    updateDoc
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

            await signOut(auth);

            window.location.href = "login.html";

            return;

        }

        const data = userSnap.data();

        // ======================================
        // USER INFORMATION
        // ======================================

        const dashboardUsername =
            document.getElementById("dashboardUsername");

        const popupUserName =
            document.getElementById("popupUserName");

        const currentPlan =
            document.getElementById("currentPlan");

        const memberStatus =
            document.getElementById("memberStatus");

        if (dashboardUsername) {
            dashboardUsername.textContent =
                data.fullname || "Member";
        }

        if (popupUserName) {
            popupUserName.textContent =
                data.fullname || "Member";
        }

        if (currentPlan) {
            currentPlan.textContent =
                data.plan || "Not Activated";
        }

        if (memberStatus) {
            memberStatus.textContent =
                data.memberStatus || "Pending Activation";
        }
                // ======================================
        // LOAD WALLETS
        // ======================================

        const affiliateWallet =
            Number(data.affiliateWallet || 0);

        const taskWallet =
            Number(data.taskWallet || 0);

        const totalBalance =
            affiliateWallet + taskWallet;

        document.getElementById("affiliateWallet").textContent =
            "₦" + affiliateWallet.toLocaleString();

        document.getElementById("taskWallet").textContent =
            "₦" + taskWallet.toLocaleString();

        document.getElementById("totalBalance").textContent =
            "₦" + totalBalance.toLocaleString();

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
        // REFERRAL LINK
        // ======================================

        const username =
            data.username || "USERNAME";

        const referralLink =
            "https://fortunearner.netlify.app/signup?ref=" + username;

        document.getElementById("referralLink").value =
            referralLink;

        // ======================================
        // COPY REFERRAL LINK
        // ======================================

        document
            .getElementById("copyReferralBtn")
            .addEventListener("click", async () => {

                try {

                    await navigator.clipboard.writeText(referralLink);

                    alert("✅ Referral link copied successfully!");

                } catch (error) {

                    alert("Unable to copy referral link.");

                }

            });

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
        // TELEGRAM & WHATSAPP LINKS
        // ======================================

        document.getElementById("telegramChannelBtn").href =
            "https://t.me/TgEarnVault";

        document.getElementById("telegramGroupBtn").href =
            "https://t.me/EarnVaultCHAT";

        document.getElementById("whatsappChannelBtn").href =
            "https://chat.whatsapp.com/CKJ2Awq0F5F8xpaq31JJlP?s=cl&p=a&ilr=1";

        // ======================================
        // WELCOME POPUP
        // ======================================

        const popup =
            document.getElementById("welcomePopup");

        const hidePopup =
            document.getElementById("hidePopup");

        const continueBtn =
            document.getElementById("continueDashboard");

        if (
            popup &&
            hidePopup &&
            continueBtn &&
            localStorage.getItem("hideWelcomePopup") !== "true"
        ) {

            popup.style.display = "flex";

        }

        if (continueBtn) {

            continueBtn.addEventListener("click", () => {

    if (hidePopup.checked) {

        localStorage.setItem(
            "hideWelcomePopup",
            "true"
        );

    }

    popup.style.display = "none";

    showAnnouncementPopup();

});
        // ======================================
// LOAD ANNOUNCEMENTS
// ======================================

const announcementBox =
    document.getElementById("announcementBox");

if (announcementBox) {

    announcementBox.innerHTML = "";

    const announcementQuery = query(
        collection(db, "content"),
        where("type", "==", "announcement"),
        where("status", "==", "Active")
    );

    const announcementSnapshot =
        await getDocs(announcementQuery);

    if (announcementSnapshot.empty) {

        announcementBox.innerHTML =
            "<p>No announcements available.</p>";

    } else {

        for (const announcementDoc of announcementSnapshot.docs) {

            const announcement =
                announcementDoc.data();

            // ==========================
            // UNIQUE VIEW COUNT
            // ==========================

            const viewedBy =
                announcement.viewedBy || {};

            if (!viewedBy[user.uid]) {

                viewedBy[user.uid] = true;

                await updateDoc(
                    announcementDoc.ref,
                    {
                        viewedBy: viewedBy,
                        viewCount:
                            Object.keys(viewedBy).length
                    }
                );

            }

            const card =
                document.createElement("div");

            card.className = "dashboard-card";

            card.innerHTML = `
                <h3>📢 ${announcement.title}</h3>

                <p>${announcement.description}</p>
            `;

            announcementBox.appendChild(card);

        }

    }

}

    } 
        // ======================================
// SHOW ANNOUNCEMENT DIRECTLY
// ======================================

if (
    !popup ||
    localStorage.getItem("hideWelcomePopup") === "true"
) {

    showAnnouncementPopup();

}
    catch (error) {

        console.error(error);

        alert(error.message);

    }

});
// ======================================
// DAILY ANNOUNCEMENT POPUP
// ======================================

async function showAnnouncementPopup() {

    const popup =
        document.getElementById("announcementPopup");

    const title =
        document.getElementById("popupAnnouncementTitle");

    const message =
        document.getElementById("popupAnnouncementMessage");

    const closeBtn =
        document.getElementById("closeAnnouncementPopup");

    if (!popup || !title || !message || !closeBtn) return;

    const today = new Date().toISOString().split("T")[0];

    if (localStorage.getItem("lastAnnouncementPopup") === today) {

        return;

    }

    try {

        const announcementQuery = query(

            collection(db, "content"),

            where("type", "==", "announcement"),

            where("status", "==", "Active")

        );

        const snapshot = await getDocs(announcementQuery);

        if (snapshot.empty) return;

        const announcement = snapshot.docs[0].data();

        title.textContent = announcement.title;

        message.textContent = announcement.description;

        popup.style.display = "flex";

        closeBtn.onclick = () => {

            popup.style.display = "none";

            localStorage.setItem(
                "lastAnnouncementPopup",
                today
            );

        };

    }

    catch (error) {

        console.error(error);

    }

}
// ======================================
// LOG OUT
// ======================================

const logoutLink = document.getElementById("logoutBtn");

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
