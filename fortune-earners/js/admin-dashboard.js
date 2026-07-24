import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// ======================================
// CHECK ADMIN ACCESS
// ======================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }

    try {

        const adminRef =
            doc(db, "users", user.uid);

        const adminSnap =
            await getDoc(adminRef);

        if (!adminSnap.exists()) {

            alert("Admin account not found.");

            window.location.href =
                "dashboard.html";

            return;

        }

        const adminData =
            adminSnap.data();

        if (!adminData.isAdmin) {

            alert("Access denied.");

            window.location.href =
                "dashboard.html";

            return;

        }

        // ======================================
        // ADMIN VERIFIED
        // ======================================

        await loadDashboard();

        await loadActivationRequests();

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});
// ======================================
// LOAD DASHBOARD
// ======================================

async function loadDashboard() {

    try {

        // ======================================
        // TOTAL USERS
        // ======================================

        const usersSnapshot =
            await getDocs(
                collection(db, "users")
            );

        document.getElementById(
            "totalUsers"
        ).textContent =
            usersSnapshot.size;

        let activeUsers = 0;

        let pendingUsers = 0;

        let totalRevenue = 0;

        usersSnapshot.forEach((userDoc) => {

            const user =
                userDoc.data();

            if (user.memberStatus === "Activated") {

                activeUsers++;

            }

            if (user.memberStatus === "Pending Activation") {

                pendingUsers++;

            }

            switch (user.plan) {

                case "NEWBIE":

                    totalRevenue += 750;

                    break;

                case "SILVER":

                    totalRevenue += 1500;

                    break;

                case "GOLD":

                    totalRevenue += 3000;

                    break;

                case "DIAMOND":

                    totalRevenue += 5000;

                    break;

                case "PREMIUM":

                    totalRevenue += 7000;

                    break;

            }

        });

        document.getElementById(
            "activeUsers"
        ).textContent =
            activeUsers;

        document.getElementById(
            "pendingUsers"
        ).textContent =
            pendingUsers;

        document.getElementById(
            "totalRevenue"
        ).textContent =
            "₦" +
            totalRevenue.toLocaleString();

        // ======================================
        // TOTAL TASKS
        // ======================================

        const taskSnapshot =
            await getDocs(
                collection(db, "tasks")
            );

        document.getElementById(
            "totalTasks"
        ).textContent =
            taskSnapshot.size;

        // ======================================
        // TOTAL ADS
        // ======================================

        const adsSnapshot =
            await getDocs(
                collection(db, "sponsoredAds")
            );

        document.getElementById(
            "totalAds"
        ).textContent =
            adsSnapshot.size;

        // ======================================
        // PENDING WITHDRAWALS
        // ======================================

        const withdrawalQuery =
            query(

                collection(db, "withdrawals"),

                where(
                    "status",
                    "==",
                    "Pending"
                )

            );

        const withdrawalSnapshot =
            await getDocs(
                withdrawalQuery
            );

        document.getElementById(
            "pendingWithdrawals"
        ).textContent =
            withdrawalSnapshot.size;

        // ======================================
        // PLACE ADS REQUESTS
        // ======================================

        const adsRequestQuery =
            query(

                collection(db, "placeAds"),

                where(
                    "status",
                    "==",
                    "Pending"
                )

            );

        const adsRequestSnapshot =
            await getDocs(
                adsRequestQuery
            );

        document.getElementById(
            "placeAdsRequests"
        ).textContent =
            adsRequestSnapshot.size;

        // ======================================
        // RECENT ACTIVITIES
        // ======================================

        const recentActivities =
            document.getElementById(
                "recentActivities"
            );

        recentActivities.innerHTML = "";

        usersSnapshot.docs

            .slice(-5)

            .reverse()

            .forEach((userDoc) => {

                const user =
                    userDoc.data();

                recentActivities.innerHTML += `

                <p>

                👤

                <strong>${user.fullname}</strong>

                joined Fortune Earners.

                </p>

                `;

            });

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}
