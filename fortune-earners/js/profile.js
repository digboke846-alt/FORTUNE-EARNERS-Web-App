import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc,
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

        const userRef =
            doc(db, "users", user.uid);

        const userSnap =
            await getDoc(userRef);

        if (!userSnap.exists()) {

            alert("User account not found.");

            await signOut(auth);

            window.location.href = "login.html";

            return;

        }

        const data =
            userSnap.data();
        // ======================================
// PERSONAL INFORMATION
// ======================================

document.getElementById("profileTopUsername").textContent =
    "@" + (data.username || "username");

        document.getElementById("profileFullName").textContent =
    data.fullName || "Not Available";
    
document.getElementById("profileEmail").textContent =
    data.email || "Not Available";

document.getElementById("profilePhone").textContent =
    data.phone || "Not Available";

// ======================================
// USER ID
// ======================================

document.getElementById("profileUserId").textContent =
    "FE-" + user.uid.substring(0, 8).toUpperCase();

// ======================================
// MEMBER SINCE
// ======================================

if (data.createdAt?.toDate) {

    document.getElementById("memberSince").textContent =
        data.createdAt.toDate().toLocaleDateString();

} else {

    document.getElementById("memberSince").textContent =
        "Not Available";

}

// ======================================
// PLAN & STATUS
// ======================================

if (document.getElementById("profilePlan")) {

    document.getElementById("profilePlan").textContent =
        data.plan || "Not Activated";

}

if (document.getElementById("profileStatus")) {

    document.getElementById("profileStatus").textContent =
        data.memberStatus || "Active";

}

// ======================================
// ACCOUNT STATISTICS
// ======================================

if (document.getElementById("profileReferrals")) {

    document.getElementById("profileReferrals").textContent =
        data.totalReferrals || 0;

}

if (document.getElementById("profileTasks")) {

    document.getElementById("profileTasks").textContent =
        data.tasksCompleted || 0;

}

if (document.getElementById("profileAds")) {

    document.getElementById("profileAds").textContent =
        data.sponsoredAdsViewed || 0;

}

if (document.getElementById("profileWithdrawals")) {

    document.getElementById("profileWithdrawals").textContent =
        "₦" + Number(
            data.totalWithdrawals || 0
        ).toLocaleString();

}
        // ======================================
// LOAD BANK DETAILS
// ======================================

const bankName =
    document.getElementById("bankName");

const accountNumber =
    document.getElementById("accountNumber");

const accountName =
    document.getElementById("accountName");

if (bankName) {

    bankName.value =
        data.bankName || "";

}

if (accountNumber) {

    accountNumber.value =
        data.accountNumber || "";

}

if (accountName) {

    accountName.value =
        data.accountName || "";

}
        // ======================================
// SAVE BANK DETAILS
// ======================================

const saveBankBtn =
    document.getElementById("saveBankBtn");

if (saveBankBtn) {

    saveBankBtn.addEventListener("click", async () => {

        try {

            const bank =
                bankName.value;

            const accountNo =
                accountNumber.value.trim();

            const accountHolder =
                accountName.value.trim();

            if (!bank) {

                alert("Please select your bank.");

                return;

            }

            if (!/^\d{10}$/.test(accountNo)) {

                alert("Account number must be exactly 10 digits.");

                return;

            }

            if (!accountHolder) {

                alert("Please enter the account name.");

                return;

            }

            await updateDoc(doc(db, "users", user.uid), {

                bankName: bank,

                accountNumber: accountNo,

                accountName: accountHolder

            });

            const status =
                document.getElementById("bankSaveStatus");

            if (status) {

                status.textContent =
                    "✅ Bank details saved successfully.";

                setTimeout(() => {

                    status.textContent = "";

                }, 3000);

            }

        }

        catch (error) {

            console.error(error);

            alert(error.message);

        }

    });

                }
        // ======================================
// LOG OUT
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

    }

    catch (error) {

        console.error(error);

        alert("Failed to load profile.");

    }

});
