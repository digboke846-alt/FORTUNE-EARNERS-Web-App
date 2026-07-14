import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs,
    orderBy
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

        const submissionList =
            document.getElementById("submissionList");

        submissionList.innerHTML =
            "<p>Loading submissions...</p>";

        // We will load the user's submissions
        // in Part 2.

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

});
