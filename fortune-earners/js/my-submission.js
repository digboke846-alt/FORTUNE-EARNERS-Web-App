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

        /// ======================================
// LOAD USER SUBMISSIONS
// ======================================

const submissionsQuery = query(

    collection(db, "taskSubmissions"),

    where("userId", "==", user.uid),

    orderBy("submittedAt", "desc")

);

const querySnapshot = await getDocs(submissionsQuery);

submissionList.innerHTML = "";

if (querySnapshot.empty) {

    submissionList.innerHTML = `

        <div class="dashboard-card">

            <h3>No submissions yet.</h3>

            <p>
                Complete a task and submit it to see it here.
            </p>

        </div>

    `;

    return;

}

querySnapshot.forEach((doc) => {

    const submission = doc.data();

    let statusColor = "🟡";

    if (submission.status === "Approved") {

        statusColor = "✅";

    }

    if (submission.status === "Rejected") {

        statusColor = "❌";

    }

    const submittedDate = submission.submittedAt
        ? submission.submittedAt.toDate().toLocaleDateString()
        : "Unknown";

    submissionList.innerHTML += `

        <div class="dashboard-card">

            <h3>${submission.taskTitle}</h3>

            <p>

                <strong>Status:</strong>

                ${statusColor} ${submission.status}

            </p>

            <p>

                <strong>Submitted:</strong>

                ${submittedDate}

            </p>

            <p>

                <strong>Admin Remark:</strong>

                ${submission.adminRemark || "No remark yet."}

            </p>

        </div>

    `;

});

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

});
