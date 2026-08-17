import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc,
    addDoc,
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    updateDoc,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

let notificationSoundUnlocked = false;

document.addEventListener("click", () => {
    if (notificationSoundUnlocked) return;

    const sound = document.getElementById("notificationSound");

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
// CHECK LOGIN & LOAD DASHBOARD
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

        // ======================================
        // 🚨 PLATFORM SETTINGS CHECK
        // ======================================
        try {
            const settingsSnap = await getDoc(doc(db, "settings", "global"));
            if (settingsSnap.exists()) {
                const settings = settingsSnap.data();

                // 1. Check Maintenance Mode (Admins bypass maintenance)
                if (settings.maintenanceMode === true && !data.isAdmin) {
                    window.location.href = "maintenance.html";
                    return;
                }

                // 2. Display Announcement Banner
                const announcementEl = document.getElementById("systemAnnouncementBanner");
                if (announcementEl && settings.announcementText) {
                    announcementEl.textContent = settings.announcementText;
                    if (announcementEl.parentElement) {
                        announcementEl.parentElement.style.display = "block";
                    }
                }
            }
        } catch (settingsErr) {
            console.error("Error checking platform settings:", settingsErr);
        }

        // Load Leaderboard Preview
        loadDashboardLeaderboard();

         // 📜 Load Recent Transactions for logged-in user
        loadRecentTransactions(user.uid);
        

        // ======================================
        // DAILY RESET
        // ======================================

        const today = new Date().toISOString().split("T")[0];

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

        ======================================
        // WEEKLY RESET
        // ======================================

        const currentMonday = getCurrentMonday();

        if (data.lastWeeklyReset !== currentMonday) {
            await updateDoc(userRef, {
                weeklyEarnings: 0,
                weeklyAffiliateEarnings: 0,
                lastWeeklyReset: currentMonday
            });

            data.weeklyEarnings = 0;
            data.weeklyAffiliateEarnings = 0;
            data.lastWeeklyReset = currentMonday;
        }



        const dashboardAvatar = document.getElementById("dashboardAvatar");
        if (dashboardAvatar) {
            dashboardAvatar.textContent = data.profileAvatar || "👤";
            dashboardAvatar.onclick = () => {
                window.location.href = "profile.html";
            };
        }

        // ======================================
        // USER INFORMATION
        // ======================================

        const dashboardUsername = document.getElementById("dashboardUsername");
        const popupUserName = document.getElementById("popupUserName");
        const currentPlan = document.getElementById("currentPlan");
        const memberStatus = document.getElementById("memberStatus");

        if (dashboardUsername) dashboardUsername.textContent = data.fullname || "Member";
        if (popupUserName) popupUserName.textContent = data.fullname || "Member";
        if (currentPlan) currentPlan.textContent = data.plan || "Not Activated";
        if (memberStatus) memberStatus.textContent = data.memberStatus || "🟢 Active";

        // ======================================
        // LOAD WALLETS
        // ======================================

        const affiliateWallet = Number(data.affiliateWallet || 0);
        const taskWallet = Number(data.taskWallet || 0);
        const totalBalance = affiliateWallet + taskWallet;

        const affiliateEl = document.getElementById("affiliateWallet");
        const taskEl = document.getElementById("taskWallet");
        const totalEl = document.getElementById("totalBalance");

        if (affiliateEl) affiliateEl.textContent = "₦" + affiliateWallet.toLocaleString();
        if (taskEl) taskEl.textContent = "₦" + taskWallet.toLocaleString();
        if (totalEl) totalEl.textContent = "₦" + totalBalance.toLocaleString();

        // ======================================
        // TODAY SUMMARY
        // ======================================

        const tasksTodayEl = document.getElementById("tasksCompletedToday");
        const adsTodayEl = document.getElementById("adsViewedToday");
        const refTodayEl = document.getElementById("referralsToday");
        const earnedTodayEl = document.getElementById("earnedToday");

        if (tasksTodayEl) tasksTodayEl.textContent = (data.completedTasksToday || 0) + "/5";
        if (adsTodayEl) adsTodayEl.textContent = (data.sponsoredAdsToday || 0) + "/5";
        if (refTodayEl) refTodayEl.textContent = data.referralsToday || 0;
        if (earnedTodayEl) earnedTodayEl.textContent = "₦" + Number(data.earnedToday || 0).toLocaleString();

        // ======================================
        // REFERRAL LINK
        // ======================================

        const username = data.username || "USERNAME";
        const referralLink = "https://fortunearner.netlify.app/signup?ref=" + username;

        const refInput = document.getElementById("referralLink");
        if (refInput) refInput.value = referralLink;

        // ======================================
        // COPY REFERRAL LINK
        // ======================================

        document.getElementById("copyReferralBtn")?.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(referralLink);
                alert("✅ Referral link copied successfully!");
            } catch {
                alert("Unable to copy referral link.");
            }
        });

        // ======================================
        // LOAD STATISTICS
        // ======================================

        const totalRefEl = document.getElementById("totalReferrals");
        const tasksCompEl = document.getElementById("tasksCompleted");
        const adsViewedEl = document.getElementById("adsViewed");
        const totalWithEl = document.getElementById("totalWithdrawals");

        if (totalRefEl) totalRefEl.textContent = data.totalReferrals || 0;
        if (tasksCompEl) tasksCompEl.textContent = data.completedTasks || 0;
        if (adsViewedEl) adsViewedEl.textContent = data.sponsoredAdsViewed || 0;
        if (totalWithEl) totalWithEl.textContent = "₦" + Number(data.totalWithdrawals || 0).toLocaleString();

        // ======================================
        // TELEGRAM & WHATSAPP
        // ======================================

        const tgChan = document.getElementById("telegramChannelBtn");
        const tgGrp = document.getElementById("telegramGroupBtn");
        const waChan = document.getElementById("whatsappChannelBtn");

        if (tgChan) tgChan.href = "https://t.me/TgEarnVault";
        if (tgGrp) tgGrp.href = "https://t.me/EarnVaultCHAT";
        if (waChan) waChan.href = "https://chat.whatsapp.com/CKJ2Awq0F5F8xpaq31JJlP?s=cl&p=a&ilr=1";

        // ======================================
        // WELCOME POPUP
        // ======================================

        const welcomePopup = document.getElementById("welcomePopup");
        const hidePopup = document.getElementById("hidePopup");
        const continueBtn = document.getElementById("continueDashboard");

        if (welcomePopup && hidePopup && continueBtn) {
            if (localStorage.getItem("hideWelcomePopup") !== "true") {
                welcomePopup.style.display = "flex";

                continueBtn.onclick = () => {
                    if (hidePopup.checked) {
                        localStorage.setItem("hideWelcomePopup", "true");
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

        const announcementBox = document.getElementById("announcementBox");

        if (announcementBox) {
            announcementBox.innerHTML = "";

            const announcementQuery = query(
                collection(db, "content"),
                where("type", "==", "announcement"),
                where("status", "==", "Active"),
                orderBy("createdAt", "desc")
            );

            const announcementSnapshot = await getDocs(announcementQuery);

            if (announcementSnapshot.empty) {
                announcementBox.innerHTML = "<p>No announcements available.</p>";
            } else {
                for (const announcementDoc of announcementSnapshot.docs) {
                    const announcement = announcementDoc.data();
                    const viewedBy = announcement.viewedBy || {};

                    if (!viewedBy[user.uid]) {
                        viewedBy[user.uid] = true;
                        await updateDoc(announcementDoc.ref, {
                            viewedBy,
                            viewCount: Object.keys(viewedBy).length
                        });
                    }

                    const card = document.createElement("div");
                    card.className = "dashboard-card";
                    card.innerHTML = `
                        <h3>📢 ${announcement.title}</h3>
                        <p>${announcement.description}</p>
                    `;
                    announcementBox.appendChild(card);
                }
            }
        }

    } catch (error) {
        console.error("Dashboard initialization error:", error);
        alert(error.message);
    }
});

// ======================================
// DAILY ANNOUNCEMENT POPUP
// ======================================

async function showAnnouncementPopup() {
    const popup = document.getElementById("announcementPopup");
    const title = document.getElementById("popupAnnouncementTitle");
    const message = document.getElementById("popupAnnouncementMessage");
    const continueBtn = document.getElementById("closeAnnouncementPopup");

    if (!popup || !title || !message || !continueBtn) return;

    const today = new Date().toISOString().split("T")[0];

    try {
        const latestAnnouncementQuery = query(
            collection(db, "content"),
            where("type", "==", "announcement"),
            where("status", "==", "Active"),
            orderBy("createdAt", "desc"),
            limit(1)
        );

        const snapshot = await getDocs(latestAnnouncementQuery);
        if (snapshot.empty) return;

        const latestDoc = snapshot.docs[0];
        const announcement = latestDoc.data();

        if (
            localStorage.getItem("lastAnnouncementDate") === today &&
            localStorage.getItem("lastAnnouncementId") === latestDoc.id
        ) {
            return;
        }

        title.textContent = announcement.title;
        message.textContent = announcement.description;
        popup.style.display = "flex";

        continueBtn.onclick = () => {
            popup.style.display = "none";
            localStorage.setItem("lastAnnouncementDate", today);
            localStorage.setItem("lastAnnouncementId", latestDoc.id);
        };
    } catch (error) {
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
        const confirmLogout = confirm("Are you sure you want to log out?");
        if (!confirmLogout) return;

        try {
            await signOut(auth);
            window.location.href = "login.html";
        } catch (error) {
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
    const badge = document.getElementById("notificationBadge");
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
        badge.textContent = unreadCount > 9 ? "9+" : unreadCount;
    });
}

function showNotificationToast(title, message) {
    const toast = document.getElementById("notificationToast");
    const toastTitle = document.getElementById("toastTitle");
    const toastMessage = document.getElementById("toastMessage");

    if (!toast) return;

    if (toastTitle) toastTitle.textContent = title;
    if (toastMessage) toastMessage.textContent = message;

    toast.classList.remove("hidden");
    toast.classList.add("show");

    const sound = document.getElementById("notificationSound");

    if (sound && notificationSoundUnlocked) {
        sound.currentTime = 0;
        sound.play().catch(() => {});
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

const notificationButton = document.getElementById("notificationButton");
if (notificationButton) {
    notificationButton.addEventListener("click", () => {
        window.location.href = "notifications.html";
    });
}

// ======================================
// DASHBOARD TOP EARNERS PREVIEW (TOP 3)
// ======================================

function getActiveWeekDateRange() {
    const now = new Date();
    const dayOfWeek = now.getDay();

    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const options = { month: 'short', day: 'numeric' };
    const mondayStr = monday.toLocaleDateString('en-US', options);
    const sundayStr = sunday.toLocaleDateString('en-US', options);

    return `${mondayStr} – ${sundayStr}`;
}

async function loadDashboardLeaderboard() {
    const dateRangeEl = document.getElementById("widgetDateRange");
    const container = document.getElementById("dashboardLeaderboardPreview");

    if (dateRangeEl) {
        dateRangeEl.textContent = getActiveWeekDateRange();
    }

    if (!container) return;

    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("weeklyEarnings", "desc"), limit(3));
        const snapshot = await getDocs(q);

        const validDocs = snapshot.docs.filter(docSnap => (docSnap.data().weeklyEarnings || 0) > 0);

        if (validDocs.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: var(--muted); font-size: 13px;">No earnings recorded this week yet.</p>`;
            return;
        }

        let html = `
            <div class="leaderboard-header">
                <span class="col-user">RANK</span>
                <span class="col-amount">EARNINGS</span>
            </div>
        `;
        let rank = 1;

        validDocs.forEach((docSnap) => {
            const data = docSnap.data();
            const username = data.username || "Anonymous";
            const amount = data.weeklyEarnings || 0;

            let rankBadge = `#${rank}`;
            if (rank === 1) rankBadge = "🥇";
            else if (rank === 2) rankBadge = "🥈";
            else if (rank === 3) rankBadge = "🥉";

            html += `
                <div class="leaderboard-item">
                    <div class="rank-user">
                        <span class="rank-badge">${rankBadge}</span>
                        <span class="user-name">@${username}</span>
                    </div>
                    <div class="earned-amount">₦${Number(amount).toLocaleString()}</div>
                </div>
            `;
            rank++;
        });

        container.innerHTML = html;

    } catch (error) {
        console.error("Error loading dashboard leaderboard:", error);
        if (container) {
            container.innerHTML = `<p style="text-align: center; color: var(--muted); font-size: 13px;">Unable to load leaderboard.</p>`;
        }
    }
}



// ======================================
// RECENT TRANSACTIONS
// ======================================

function loadRecentTransactions(userId) {
    const container = document.getElementById("recentTransactionsList");
    if (!container) return;

    const q = query(
        collection(db, "transactions"),
        where("userId", "==", userId)
    );

    // Live Real-Time Listener
    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            container.innerHTML = `<p style="text-align: center; color: var(--muted, #8a99ad); font-size: 14px;">No transactions yet.</p>`;
            return;
        }

        const docsArray = snapshot.docs.map(doc => doc.data());
        
        // Sort newest first
        docsArray.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        const recentFive = docsArray.slice(0, 5);

        let html = "";
        recentFive.forEach((tx) => {
            const isCredit = tx.type === "credit";
            const amountPrefix = isCredit ? "+" : "-";
            const amountClass = isCredit ? "credit" : "debit";
            const formattedDate = tx.createdAt?.toDate 
                ? tx.createdAt.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric" }) 
                : "Today";

            html += `
                <div class="transaction-item">
                    <div class="transaction-details">
                        <span class="transaction-title">${tx.title}</span>
                        <span class="transaction-date">${formattedDate}</span>
                    </div>
                    <div class="transaction-amount ${amountClass}">
                        ${amountPrefix}₦${Number(tx.amount).toLocaleString()}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }, (error) => {
        console.error("Error loading transactions:", error);
        container.innerHTML = `<p style="text-align: center; color: var(--muted, #8a99ad); font-size: 13px;">Unable to load transactions.</p>`;
    });
}


function getCurrentMonday() {
    const now = new Date();
    const day = now.getDay();
    const distanceToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);
    return monday.toISOString().split("T")[0];
}


