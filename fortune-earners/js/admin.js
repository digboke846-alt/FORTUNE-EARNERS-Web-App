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
    where
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// ======================================
// ADMIN AUTHENTICATION
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

            alert("User not found.");

            window.location.href = "login.html";

            return;

        }

        const userData = userSnap.data();

        if (userData.isAdmin !== true) {

            alert("Access Denied.");

            window.location.href = "dashboard.html";

            return;

        }

        // ======================================
// LOAD DASHBOARD STATISTICS
// ======================================

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Total Users
const usersSnapshot =
    await getDocs(collection(db, "users"));

document.getElementById("totalUsers").textContent =
    usersSnapshot.size;

// Active Members
const activeQuery =
    query(
        collection(db, "users"),
        where("memberStatus", "==", "Active")
    );

const activeSnapshot =
    await getDocs(activeQuery);

document.getElementById("activeMembers").textContent =
    activeSnapshot.size;

// Pending Activations
const activationQuery =
    query(
        collection(db, "activationRequests"),
        where("status", "==", "Pending")
    );

const activationSnapshot =
    await getDocs(activationQuery);

document.getElementById("pendingActivations").textContent =
    activationSnapshot.size;

// Pending Withdrawals
const withdrawalQuery =
    query(
        collection(db, "withdrawRequests"),
        where("status", "==", "Pending")
    );

const withdrawalSnapshot =
    await getDocs(withdrawalQuery);

document.getElementById("pendingWithdrawals").textContent =
    withdrawalSnapshot.size;

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});

// ======================================
// ADMIN LOGOUT
// ======================================

const adminLogoutBtn =
    document.getElementById("adminLogoutBtn");

adminLogoutBtn.addEventListener("click", async () => {

    await signOut(auth);

    window.location.href = "login.html";

});
