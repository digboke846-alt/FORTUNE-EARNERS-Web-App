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
    updateDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

let notificationSoundUnlocked = false;

document.addEventListener("click", () => {

    if (notificationSoundUnlocked) return;

    const sound =
        document.getElementById("notificationSound");

    if (sound) {

        sound.play()
            .then(() => {

                sound.pause();

                sound.currentTime = 0;

                notificationSoundUnlocked = true;

            })
            .catch(() => {});

    }

}, { once: true });

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
        loadNotificationBadge(user.uid);

        const data = userSnap.data();

        // Add this line inside onAuthStateChanged (e.g. right after loading user balances):
loadDashboardLeaderboard();
        

        // ======================================
// DAILY RESET
// ======================================

const today =
    new Date().toISOString().split("T")[0];

if (data.lastDailyReset !== today) {

    await updateDoc(userRef, {

        completedTasksToday: 0,

        sponsoredAdsToday: 0,

        referralsToday: 0,

        earnedToday: 0,

        lastDailyReset: today

    });

    data.completedTasksToday = 0;

    data.sponsoredAdsToday = 0;

    data.referralsToday = 0;

    data.earnedToday = 0;

    data.lastDailyReset = today;

}

        const dashboardAvatar =
    document.getElementById("dashboardAvatar");

if (dashboardAvatar) {

    dashboardAvatar.textContent =
        data.profileAvatar || "👤";

    dashboardAvatar.onclick = () => {

        window.location.href = "profile.html";

    };

}

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
                data.memberStatus || "🟢 Active";

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
    (data.completedTasksToday || 0) + "/5";

        document.getElementById("adsViewedToday").textContent =
    (data.sponsoredAdsToday || 0) + "/5";

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
            data.completedTasks || 0;

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

    } else {

        showAnnouncementPopup();

    }

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


// ======================================\r
// DASHBOARD TOP EARNERS PREVIEW (TOP 3)\r
// ======================================\r
\r
// Helper: Calculate Active Week Date Range (Monday to Sunday)\r
function getActiveWeekDateRange() {\r
    const now = new Date();\r
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday...\r
\r
    // Calculate Monday of current week\r
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;\r
    const monday = new Date(now);\r
    monday.setDate(now.getDate() + distanceToMonday);\r
\r
    // Calculate Sunday of current week\r
    const sunday = new Date(monday);\r
    sunday.setDate(monday.getDate() + 6);\r
\r
    const options = { month: 'short', day: 'numeric' };\r
    const mondayStr = monday.toLocaleDateString('en-US', options);\r
    const sundayStr = sunday.toLocaleDateString('en-US', options);\r
\r
    return `${mondayStr} – ${sundayStr}`;\r
}\r
\r
async function loadDashboardLeaderboard() {\r
    const dateRangeEl = document.getElementById("widgetDateRange");\r
    const container = document.getElementById("dashboardLeaderboardPreview");\r
\r
    // Set date range text if container exists\r
    if (dateRangeEl) {\r
        dateRangeEl.textContent = getActiveWeekDateRange();\r
    }\r
\r
    if (!container) return;\r
\r
    try {\r
        const usersRef = collection(db, "users");\r
\r
        // Query Top 3 users ordered by weeklyEarnings descending\r
        const q = query(usersRef, orderBy("weeklyEarnings", "desc"), limit(3));\r
        const snapshot = await getDocs(q);\r
\r
        if (snapshot.empty) {\r
            container.innerHTML = `<p style="text-align: center; color: var(--muted); font-size: 13px;">No earnings recorded this week yet.</p>`;\r
            return;\r
        }\r
\r
        let html = "";\r
        let rank = 1;\r
\r
        snapshot.forEach((docSnap) => {\r
            const data = docSnap.data();\r
            const username = data.username || "Anonymous";\r
            const amount = data.weeklyEarnings || 0;\r
\r
            let rankBadge = `#${rank}`;\r
            if (rank === 1) rankBadge = "🥇";\r
            else if (rank === 2) rankBadge = "🥈";\r
            else if (rank === 3) rankBadge = "🥉";\r
\r
            html += `\r
                <div class="leaderboard-item">\r
                    <div class="rank-user">\r
                        <span class="rank-badge">${rankBadge}</span>\r
                        <span class="user-name">@${username}</span>\r
                    </div>\r
                    <div class="earned-amount">₦${Number(amount).toLocaleString()}</div>\r
                </div>\r
            `;\r
            rank++;\r
        });\r
\r
        container.innerHTML = html;\r
\r
    } catch (error) {\r
        console.error("Error loading dashboard leaderboard:", error);\r
        container.innerHTML = `<p style="text-align: center; color: var(--muted); font-size: 13px;">Unable to load leaderboard.</p>`;\r
    }\r
}\r


