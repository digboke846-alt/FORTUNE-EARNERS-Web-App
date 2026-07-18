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
// LOAD BANK DETAILS
// ======================================

document.getElementById("bankName").value =
    userData.bankName || "";

document.getElementById("accountNumber").value =
    userData.accountNumber || "";

document.getElementById("accountName").value =
    userData.accountName || "";

        // ======================================
        // PROFILE INFORMATION
        // ======================================

        document.getElementById("profileFullName").textContent =
            data.fullname || "Member";

        document.getElementById("profileUsername").textContent =
            "@" + (data.username || "username");

        document.getElementById("profileEmail").textContent =
            data.email || "Not Available";

        document.getElementById("profilePhone").textContent =
            data.phone || "Not Available";

        document.getElementById("profilePlan").textContent =
            data.plan || "Not Activated";

        document.getElementById("profileStatus").textContent =
            data.memberStatus || "Active";
              // ======================================
        // USER ID & MEMBER SINCE
        // ======================================

        document.getElementById("profileUserId").textContent =
            "FE-" + user.uid.substring(0, 8).toUpperCase();

        if (data.createdAt?.toDate) {

            const joinedDate = data.createdAt
                .toDate()
                .toLocaleDateString();

            document.getElementById("memberSince").textContent =
                joinedDate;

        } else {

            document.getElementById("memberSince").textContent =
                "Not Available";

        }

        // ======================================
        // BANK DETAILS
        // ======================================

        document.getElementById("bankName").textContent =
            data.bankName || "Not Added";

        document.getElementById("accountNumber").textContent =
            data.accountNumber || "Not Added";

        document.getElementById("accountName").textContent =
            data.accountName || "Not Added";

        // ======================================
        // ACCOUNT STATISTICS
        // ======================================

        document.getElementById("profileReferrals").textContent =
            data.totalReferrals || 0;

        document.getElementById("profileTasks").textContent =
            data.tasksCompleted || 0;

        document.getElementById("profileAds").textContent =
            data.sponsoredAdsViewed || 0;

        document.getElementById("profileWithdrawals").textContent =
            "₦" +
            Number(data.totalWithdrawals || 0).toLocaleString();

        // ======================================
        // ACHIEVEMENTS
        // ======================================

        if (
            data.achievements &&
            data.achievements.length > 0
        ) {

            document.getElementById("profileAchievements").textContent =
                data.achievements.join(", ");

        }
              // ======================================
        // EDIT BANK DETAILS
        // ======================================

        const editBankBtn =
            document.getElementById("editBankBtn");

        if (editBankBtn) {

            editBankBtn.addEventListener("click", () => {

                alert(
                    "Bank Details editing will be available in the next update."
                );

            });

        }

        // ======================================
        // LOG OUT BUTTON
        // ======================================

        const logoutBtn =
            document.getElementById("logoutBtn");

        if (logoutBtn) {

            logoutBtn.addEventListener("click", async (e) => {

                e.preventDefault();

                const confirmLogout = confirm(
                    "Are you sure you want to log out?"
                );

                if (!confirmLogout) return;

                await signOut(auth);

                window.location.href = "login.html";

            });

        }

    } catch (error) {

        console.error(error);

        alert("Failed to load profile.");

    }

});
