import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    updateDoc,
    increment
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

        const container =
            document.getElementById("submissionContainer");

        container.innerHTML = "";

        const submissionsQuery = query(

            collection(db, "taskSubmissions"),

            where("status", "==", "Pending")

        );

        const snapshot =
            await getDocs(submissionsQuery);

        if (snapshot.empty) {

            container.innerHTML = `

<div class="dashboard-card">

<h3>

✅ No Pending Submissions

</h3>

</div>

`;

            return;

        }
        snapshot.forEach((docSnap) => {

            const submission =
                docSnap.data();

            const card =
                document.createElement("div");

            card.className =
                "dashboard-card";

            card.innerHTML = `

<h3>📋 ${submission.taskTitle}</h3>

<p>

<strong>User ID:</strong><br>

${submission.userId}

</p>

<p>

<strong>Reward:</strong>

₦${Number(submission.reward || 0).toLocaleString()}

</p>

<p>

<strong>Status:</strong>

🟡 ${submission.status}

</p>

<div class="dashboard-grid">

<button
class="approve-btn"
onclick="approveSubmission('${docSnap.id}')">

✅ Approve

</button>

<button
class="delete-btn"
onclick="rejectSubmission('${docSnap.id}')">

❌ Reject

</button>

</div>

`;

            container.appendChild(card);

        });
        
