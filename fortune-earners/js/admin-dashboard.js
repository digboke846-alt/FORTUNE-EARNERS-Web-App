import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    collection,
    getDocs,
    addDoc,
    doc,
    getDoc,
    query,
    where,
    updateDoc,
serverTimestamp
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
// ======================================
// LOAD ACTIVATION REQUESTS
// ======================================

async function loadActivationRequests() {

    try {

        const activationContainer =
            document.getElementById(
                "activationRequestsList"
            );

        activationContainer.innerHTML =
            "<p>Loading activation requests...</p>";

        const activationQuery =
            query(

                collection(db, "activationRequests"),

                where(
                    "status",
                    "==",
                    "Pending"
                )

            );

        const activationSnapshot =
            await getDocs(
                activationQuery
            );

        activationContainer.innerHTML = "";

        if (activationSnapshot.empty) {

            activationContainer.innerHTML = `

            <p>

            ✅ No pending activation requests.

            </p>

            `;

            return;

        }

        activationSnapshot.forEach((requestDoc) => {

            const request =
                requestDoc.data();

            activationContainer.innerHTML += `

            <div class="dashboard-card">

                <h3>

                👤 ${request.fullname}

                </h3>

                <p>

                Username:
                @${request.username}

                </p>

                <p>

                Plan:
                ${request.selectedPlan}

                </p>

                <p>

                Amount:
                ₦${Number(request.amount).toLocaleString()}

                </p>

                <p>

                Status:
                ${request.status}

                </p>

                <button

                class="viewProofBtn"

                data-id="${requestDoc.id}">

                📷 View Proof

                </button>

                <button

                class="approveActivationBtn"

                data-id="${requestDoc.id}">

                ✅ Approve

                </button>

                <button

                class="rejectActivationBtn"

                data-id="${requestDoc.id}">

                ❌ Reject

                </button>

            </div>

            `;

        });

    }

    catch (error) {

        console.error(error);

    }

}
// ======================================
// VIEW PAYMENT PROOF
// ======================================

document.addEventListener("click", async (e) => {

    if (!e.target.classList.contains("viewProofBtn")) {

        return;

    }

    try {

        const requestId =
            e.target.dataset.id;

        const requestRef =
            doc(db, "activationRequests", requestId);

        const requestSnap =
            await getDoc(requestRef);

        if (!requestSnap.exists()) {

            alert("Activation request not found.");

            return;

        }

        const request =
            requestSnap.data();

        if (!request.paymentProofURL) {

            alert("No payment proof uploaded.");

            return;

        }

        window.open(
            request.paymentProofURL,
            "_blank"
        );

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});
// ======================================
// ACTIVATE USER PLAN
// ======================================
async function activatePlan(userId, selectedPlan) {

    try {

        const userRef = doc(db, "users", userId);

        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {

            throw new Error("User not found.");

        }

        const userData = userSnap.data();

        // ======================================
        // ACTIVATE USER
        // ======================================

        await updateDoc(userRef, {

            plan: selectedPlan,

            memberStatus: "Activated",

            accountStatus: "Active",

            planActivatedOn: serverTimestamp(),

            lastPlanUpgrade: serverTimestamp(),

            activationHistory: [

                ...(userData.activationHistory || []),

                {

                    plan: selectedPlan,

                    activatedAt: new Date().toISOString()

                }

            ]

        });

        // ======================================
        // CREDIT REFERRER
        // ======================================

        if (userData.referredBy) {

            const referrerQuery = query(

                collection(db, "users"),

                where("username", "==", userData.referredBy)

            );

            const referrerSnapshot = await getDocs(referrerQuery);

            if (!referrerSnapshot.empty) {

                const referrerDoc = referrerSnapshot.docs[0];

                const referrerData = referrerDoc.data();

                let commission = 0;

                switch (selectedPlan) {

                    case "NEWBIE":
                        commission = 400;
                        break;

                    case "SILVER":
                        commission = 700;
                        break;

                    case "GOLD":
                        commission = 1050;
                        break;

                    case "DIAMOND":
                        commission = 2100;
                        break;

                    case "PREMIUM":
                        commission = 3300;
                        break;

                }

                await updateDoc(referrerDoc.ref, {

                    affiliateWallet:

                        Number(referrerData.affiliateWallet || 0) + commission,

                    referralEarnings:

                        Number(referrerData.referralEarnings || 0) + commission,

                    validReferrals:

                        Number(referrerData.validReferrals || 0) + 1

                });

                // ======================================
                // CREATE REFERRAL NOTIFICATION
                // ======================================

                await addDoc(

                    collection(db, "notifications"),

                    {

                        userId: referrerDoc.id,

                        title: "🎉 Referral Bonus Received!",

                        message:
`🎉 Congratulations!

Your referral ${userData.fullname} has activated a plan.

₦${commission.toLocaleString()} has been credited to your Affiliate Wallet.

Keep encouraging your team to activate their accounts. 🚀`,

                        type: "Referral Bonus",

                        isRead: false,

                        createdAt: serverTimestamp()

                    }

                );

            }

        }

        // ======================================
        // USER ACTIVATION NOTIFICATION
        // ======================================

        await addDoc(

            collection(db, "notifications"),

            {

                userId: userId,

                title: "🎉 Plan Activated Successfully!",

                message:
`🎉 Congratulations!

Your ${selectedPlan} plan has been activated successfully.

You can now start completing Daily Tasks and Sponsored Ads to earn money.

Welcome to Fortune Earners! 🚀`,

                type: "Plan Activation",

                isRead: false,

                createdAt: serverTimestamp()

            }

        );

    }

    catch (error) {

        console.error(error);

        throw error;

    }

}

// ======================================
// APPROVE ACTIVATION
// ======================================

document.addEventListener("click", async (e) => {

    if (!e.target.classList.contains("approveActivationBtn")) {

        return;

    }

    try {

        const requestId = e.target.dataset.id;

        const requestRef = doc(db, "activationRequests", requestId);

        const requestSnap = await getDoc(requestRef);

        if (!requestSnap.exists()) {

            alert("Activation request not found.");

            return;

        }

        const request = requestSnap.data();

        // ======================================
        // PREVENT DOUBLE APPROVAL
        // ======================================

        if (request.status === "Approved") {

            alert("✅ This activation request has already been approved.");

            return;

        }

        // ======================================
        // ACTIVATE USER
        // ======================================

        await activatePlan(

            request.userId,

            request.selectedPlan

        );

        // ======================================
        // UPDATE REQUEST
        // ======================================

        await updateDoc(requestRef, {

            status: "Approved",

            paymentStatus: "Approved",

            reviewedAt: serverTimestamp(),

            reviewedBy: auth.currentUser.uid

        });

        alert("✅ Plan activated successfully.");

        await loadActivationRequests();

        await loadDashboard();

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});

// ======================================
// REJECT ACTIVATION
// ======================================

document.addEventListener("click", async (e) => {

    if (!e.target.classList.contains("rejectActivationBtn")) {

        return;

    }

    try {

        const requestId = e.target.dataset.id;

        const requestRef = doc(db, "activationRequests", requestId);

        const requestSnap = await getDoc(requestRef);

        if (!requestSnap.exists()) {

            alert("Activation request not found.");

            return;

        }

        const request = requestSnap.data();

        // ======================================
        // PREVENT DOUBLE REJECTION
        // ======================================

        if (request.status === "Rejected") {

            alert("❌ This activation request has already been rejected.");

            return;

        }

        if (!confirm("Are you sure you want to reject this activation request?")) {

            return;

        }

        // ======================================
        // UPDATE REQUEST
        // ======================================

        await updateDoc(requestRef, {

            status: "Rejected",

            paymentStatus: "Rejected",

            reviewedAt: serverTimestamp(),

            reviewedBy: auth.currentUser.uid

        });

        // ======================================
        // CREATE USER NOTIFICATION
        // ======================================

        await addDoc(

            collection(db, "notifications"),

            {

                userId: request.userId,

                title: "❌ Plan Activation Rejected",

                message:
`Unfortunately, your ${request.selectedPlan} plan activation request was rejected.

Please verify your payment proof and submit a new activation request if necessary.

If you believe this was a mistake, contact Fortune Earners support.`,

                type: "Plan Rejection",

                isRead: false,

                createdAt: serverTimestamp()

            }

        );

        alert("❌ Activation request rejected successfully.");

        await loadActivationRequests();

        await loadDashboard();

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});
