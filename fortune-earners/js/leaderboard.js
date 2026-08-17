import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Helper: Get Current Monday's Date String (YYYY-MM-DD)
function getCurrentMonday() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday...
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);
    return monday.toISOString().split("T")[0];
}

// Helper: Calculate Active Week Date Range (Monday to Sunday)
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
    const yearStr = sunday.getFullYear();

    return `${mondayStr} – ${sundayStr}, ${yearStr}`;
}

// Display Date Range in UI
document.addEventListener("DOMContentLoaded", () => {
    const dateRangeEl = document.getElementById("contestDateRange");
    if (dateRangeEl) {
        dateRangeEl.textContent = `📅 Current Contest: ${getActiveWeekDateRange()}`;
    }
});

// Render Leaderboard List with Custom Headers
function renderLeaderboardList(containerId, docs, earningsKey, userHeader, amountHeader) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Filter out users with 0 or missing earnings
    const validDocs = docs.docs.filter(docSnap => (docSnap.data()[earningsKey] || 0) > 0);

    // If no records exist, show empty state message
    if (validDocs.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--muted); padding: 15px 0;">No records found for this week.</p>`;
        return;
    }

    let html = `
        <div class="leaderboard-header">
            <span class="col-user">${userHeader}</span>
            <span class="col-amount">${amountHeader}</span>
        </div>
    `;

    let rank = 1;

    validDocs.forEach((docSnap) => {
        const data = docSnap.data();
        const username = data.username || "Anonymous";
        const amount = data[earningsKey] || 0;

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
}

// Check Authentication & Fetch Leaderboards
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    try {
        const usersRef = collection(db, "users");
        const activeMonday = getCurrentMonday();

        // 1. Fetch Weekly Top Earners (Active Week Only)
        const weeklyQuery = query(
            usersRef,
            where("lastWeeklyReset", "==", activeMonday),
            orderBy("weeklyEarnings", "desc"),
            limit(10)
        );
        const weeklySnap = await getDocs(weeklyQuery);
        renderLeaderboardList(
            "weeklyTopEarnersList", 
            weeklySnap, 
            "weeklyEarnings", 
            "TOP EARNERS", 
            "EARNINGS"
        );

        // 2. Fetch Weekly Top Affiliate Earners (Active Week Only)
        const affiliateQuery = query(
            usersRef,
            where("lastWeeklyReset", "==", activeMonday),
            orderBy("weeklyAffiliateEarnings", "desc"),
            limit(10)
        );
        const affiliateSnap = await getDocs(affiliateQuery);
        renderLeaderboardList(
            "weeklyAffiliateEarnersList", 
            affiliateSnap, 
            "weeklyAffiliateEarnings", 
            "RANK & USER", 
            "REWARD EARNED"
        );

        // 3. Fetch Overall Lifetime Earners (Unfiltered)
        const lifetimeQuery = query(
            usersRef,
            orderBy("totalEarnings", "desc"),
            limit(10)
        );
        const lifetimeSnap = await getDocs(lifetimeQuery);
        renderLeaderboardList(
            "lifetimeTopEarnersList", 
            lifetimeSnap, 
            "totalEarnings", 
            "TOP EARNERS", 
            "LIFETIME EARNINGS"
        );

    } catch (error) {
        console.error("Error loading leaderboards:", error);
    }
});

