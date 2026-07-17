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
    orderBy,
    limit,
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

        if (dashboardUsername)
            dashboardUsername.textContent =
                data.fullname || "Member";

        if (popupUserName)
            popupUserName.textContent =
                data.fullname || "Member";

        if (currentPlan)
            currentPlan.textContent =
                data.plan || "Not Activated";

        if (memberStatus)
            memberStatus.textContent =
                data.memberStatus || "Pending Activation";

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
            ?.addEventListener("click", async () => {

                try {

                    await navigator.clipboard.writeText(referralLink);

                    alert("✅ Referral link copied successfully!");

                }

                catch {

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
        // TELEGRAM & WHATSAPP
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

        const welcomePopup =
            document.getElementById("welcomePopup");

        const hidePopup =
            document.getElementById("hidePopup");

        const continueBtn =
            document.getElementById("continueDashboard");

        if (
            welcomePopup &&
            hidePopup &&
            continueBtn
        ) {

            if (
                localStorage.getItem("hideWelcomePopup") !== "true"
            ) {

                welcomePopup.style.display = "flex";

            }

            continueBtn.onclick = () => {

                if (hidePopup.checked) {

                    localStorage.setItem(
                        "hideWelcomePopup",
                        "true"
                    );

                }

                welcomePopup.style.display = "none";

                showAnnouncementPopup();

            };

        }

        else {

            showAnnouncementPopup();

        }
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

                where("status", "==", "Active"),

                orderBy("createdAt", "desc")

            );

            const announcementSnapshot =
                await getDocs(announcementQuery);

            if (announcementSnapshot.empty) {

                announcementBox.innerHTML =
                    "<p>No announcements available.</p>";

            }

            else {

                for (const announcementDoc of announcementSnapshot.docs) {

                    const announcement =
                        announcementDoc.data();

                    const viewedBy =
                        announcement.viewedBy || {};

                    if (!viewedBy[user.uid]) {

                        viewedBy[user.uid] = true;

                        await updateDoc(
                            announcementDoc.ref,
                            {
                                viewedBy,
                                viewCount:
                                    Object.keys(viewedBy).length
                            }
                        );

                    }

                    const card =
                        document.createElement("div");

                    card.className =
                        "dashboard-card";

                    card.innerHTML = `
<h3>📢 ${announcement.title}</h3>
<p>${announcement.description}</p>
`;

                    announcementBox.appendChild(card);

                }

            }

        }
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

    const continueBtn =
        document.getElementById("closeAnnouncementPopup");

    if (!popup || !title || !message || !continueBtn) return;

    const today =
        new Date().toISOString().split("T")[0];

    try {

        const latestAnnouncementQuery = query(

            collection(db, "content"),

            where("type", "==", "announcement"),

            where("status", "==", "Active"),

            orderBy("createdAt", "desc"),

            limit(1)

        );

        const snapshot =
            await getDocs(latestAnnouncementQuery);

        if (snapshot.empty) return;

        const latestDoc =
            snapshot.docs[0];

        const announcement =
            latestDoc.data();
        console.log(announcement);
alert(JSON.stringify(announcement));

        // Already shown today?

        if (

            localStorage.getItem("lastAnnouncementDate") === today &&

            localStorage.getItem("lastAnnouncementId") === latestDoc.id

        ) {

            return;

        }

        title.textContent =
            announcement.title;

        message.textContent =
            announcement.description;

        popup.style.display = "flex";

        continueBtn.onclick = () => {

            popup.style.display = "none";

            localStorage.setItem(
                "lastAnnouncementDate",
                today
            );

            localStorage.setItem(
                "lastAnnouncementId",
                latestDoc.id
            );

        };

    }

    catch (error) {

        console.error(error);

    }

}
                // ======================================
        // END OF onAuthStateChanged
        // ======================================

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
