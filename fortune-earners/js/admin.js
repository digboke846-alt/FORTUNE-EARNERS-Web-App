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

        // Part 2 starts here...

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
