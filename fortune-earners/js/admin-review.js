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
    increment,
    addDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// ======================================
// CURRENT TAB
// ======================================

let currentReviewType = "task";

// ======================================
// ELEMENTS
// ======================================

const taskTab =
    document.getElementById("taskTab");

const adsTab =
    document.getElementById("adsTab");

const container =
    document.getElementById("submissionContainer");
// ======================================
// LOAD SUBMISSIONS
// ======================================

async function loadSubmissions(type) {

    currentReviewType = type;

    container.innerHTML = "<p>Loading...</p>";

    taskTab.classList.remove("active");

    adsTab.classList.remove("active");

    if (type === "task") {

        taskTab.classList.add("active");

    } else {

        adsTab.classList.add("active");

    }

    const collectionName =
        type === "task"
            ? "taskSubmissions"
            : "adSubmissions";

    const titleField =
        type === "task"
            ? "taskTitle"
            : "adTitle";

    const idField =
        type === "task"
            ? "taskId"
            : "adId";

    try {

        container.innerHTML = "";

        const submissionsQuery = query(

            collection(db, collectionName),

            where("status", "==", "Pending")

        );

        const snapshot =
            await getDocs(submissionsQuery);

        if (snapshot.empty) {

            container.innerHTML = `

<div class="dashboard-card">

<h3>

✅ No Pending ${type === "task" ? "Task" : "Sponsored Ad"} Submissions

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

<h3>

${type === "task" ? "📋" : "📺"}

${submission[titleField]}

</h3>

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

onclick="approveSubmission('${docSnap.id}','${type}')">

✅ Approve

</button>

<button

class="delete-btn"

onclick="rejectSubmission('${docSnap.id}','${type}')">

❌ Reject

</button>

</div>

`;

            container.appendChild(card);

        });

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}
// ======================================
// TAB EVENTS
// ======================================

taskTab.addEventListener("click", () => {

    loadSubmissions("task");

});

adsTab.addEventListener("click", () => {

    loadSubmissions("ad");

});

// ======================================
// CHECK LOGIN
// ======================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }

    loadSubmissions("task");

});
// ======================================
// APPROVE SUBMISSION
// ======================================

window.approveSubmission = async function(submissionId, type) {
    try {
        const collectionName = type === "task" ? "taskSubmissions" : "adSubmissions";
        const titleField = type === "task" ? "taskTitle" : "adTitle";
        const idField = type === "task" ? "taskId" : "adId";

        const submissionRef = doc(db, collectionName, submissionId);
        const submissionSnap = await getDoc(submissionRef);

        if (!submissionSnap.exists()) {
            alert("Submission not found.");
            return;
        }

        const submission = submissionSnap.data();
        const reward = Number(submission.reward || 0); // Fix 1: Defined reward variable

        const userRef = doc(db, "users", submission.userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            alert("User not found.");
            return;
        }

        const userData = userSnap.data();

        // Update User Balances
        await updateDoc(userRef, { 
            taskWallet: increment(reward),
            weeklyEarnings: increment(reward),
            totalEarnings: increment(reward),
            earnedToday: Number(userData.earnedToday || 0) + reward,
            completedTasksToday: Number(userData.completedTasksToday || 0) + 1,
            completedTasks: Number(userData.completedTasks || 0) + 1,
            lastTaskEarnedDate: new Date().toISOString().split("T")[0]
        });

        // Fix 2: Create Transaction using actual submission variables
        await addDoc(collection(db, "transactions"), {
            userId: submission.userId,
            title: submission[titleField] || "Task Reward",
            amount: reward,
            type: "credit",
            createdAt: serverTimestamp()
        });
        
        // Update Submission Status
        await updateDoc(submissionRef, {
            status: "Approved"
        });

        const contentRef = doc(db, "content", submission[idField]);
        const contentSnap = await getDoc(contentRef);

        if (contentSnap.exists()) {
            await updateDoc(contentRef, {
                completedUsers: increment(1)
            });
        }

        // Send Approval Notification
        await addDoc(collection(db, "notifications"), {
            userId: submission.userId,
            type: "Task",
            title: "🎉 Great Job!",
            message: `Your ${type === "task" ? "task" : "sponsored ad"} was approved successfully. ₦${reward.toLocaleString()} has been added to your wallet! 🚀`,
            isRead: false,
            createdAt: serverTimestamp()
        });

        alert(`✅ ${type === "task" ? "Task" : "Sponsored Ad"} approved successfully.`);
        loadSubmissions(currentReviewType);

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
};

// ======================================
// REJECT SUBMISSION
// ======================================

window.rejectSubmission = async function(submissionId, type) {
    try {
        const collectionName = type === "task" ? "taskSubmissions" : "adSubmissions";
        const submissionRef = doc(db, collectionName, submissionId);
        
        // Fix 3: Fetch submission data first so submission.userId works
        const submissionSnap = await getDoc(submissionRef);
        if (!submissionSnap.exists()) {
            alert("Submission not found.");
            return;
        }
        const submission = submissionSnap.data();

        await updateDoc(submissionRef, {
            status: "Rejected"
        });

        // Create Rejection Notification
        await addDoc(collection(db, "notifications"), {
            userId: submission.userId,
            type: "task",
            title: "❌ Submission Rejected",
            message: "Unfortunately, your submitted task was rejected. Please review the task requirements and try again. 💪",
            isRead: false,
            createdAt: serverTimestamp()
        });

        alert(`❌ ${type === "task" ? "Task" : "Sponsored Ad"} rejected successfully.`);
        loadSubmissions(currentReviewType);

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
};

    
