import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
    collection,
    query,
    orderBy,
    limit,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Helper: Calculate Active Week Date Range (Monday to Sunday)
function getActiveWeekDateRange() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday...
    
    // Calculate Monday of current week
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);

    // Calculate Sunday of current week
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

// Generic Renderer for Leaderboard Lists
function renderLeaderboardList(containerId, docs, earningsKey) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (docs.empty) {
        container.innerHTML = `<p style="text-align:center; color: var(--muted);">No records found for this period.</p>`;
        return;
    }

    let html = "";
    let rank = 1;

    docs.forEach((docSnap) => {
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

        // 1. Fetch Weekly Top Earners (Total)
        const weeklyQuery = query(usersRef, orderBy("weeklyEarnings", "desc"), limit(10));
        const weeklySnap = await getDocs(weeklyQuery);
        renderLeaderboardList("weeklyTopEarnersList", weeklySnap, "weeklyEarnings");

        // 2. Fetch Weekly Top Affiliate Earners
        const affiliateQuery = query(usersRef, orderBy("weeklyAffiliateEarnings", "desc"), limit(10));
        const affiliateSnap = await getDocs(affiliateQuery);
        renderLeaderboardList("weeklyAffiliateEarnersList", affiliateSnap, "weeklyAffiliateEarnings");

        // 3. Fetch Overall Lifetime Earners
        const lifetimeQuery = query(usersRef, orderBy("totalEarnings", "desc"), limit(10));
        const lifetimeSnap = await getDocs(lifetimeQuery);
        renderLeaderboardList("lifetimeTopEarnersList", lifetimeSnap, "totalEarnings");

    } catch (error) {
        console.error("Error loading leaderboards:", error);
    }
});


