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

            return;

        }

        const userData = userSnap.data();

        // User plan

        const currentPlan =
            userData.plan || "Not Activated";

        // ======================================
// CHECK PLAN ACTIVATION
// ======================================

if (
    userData.plan === "None" ||
    userData.memberStatus !== "Active"
) {

    document.getElementById("taskList").innerHTML = `

        <div class="dashboard-card">

            <h2>🔒 Daily Tasks Locked</h2>

            <p>

                Activate your membership plan to unlock Daily Tasks and start earning.

            </p>

            <button onclick="location.href='activate-plan.html'">

                💎 Activate Plan

            </button>

        </div>

    `;

    document.getElementById("availableTasks").textContent = "0";

    return;

}
        // ======================================
// LOAD TASKS
// ======================================

const taskList =
    document.getElementById("taskList");

taskList.innerHTML = "";

const tasksQuery =
    query(

        collection(db, "content"),

        where("type", "==", "task"),

        where("status", "==", "Active")

    );

const taskSnapshot =
    await getDocs(tasksQuery);

let availableCount = 0;

taskSnapshot.forEach((taskDoc) => {

    const task = taskDoc.data();
    // Hide tasks that have reached maximum users

if (

    task.maxUsers !== null &&

    task.maxUsers !== undefined &&

    (task.completedUsers || 0) >= task.maxUsers

) {

    return;

}

    availableCount++;

    let reward = 0;

    switch(currentPlan){

        case "NEWBIE":

            reward = task.rewardNewbie || 0;

            break;

        case "SILVER":

            reward = task.rewardSilver || 0;

            break;

        case "GOLD":

            reward = task.rewardGold || 0;

            break;

        case "DIAMOND":

            reward = task.rewardDiamond || 0;

            break;

        case "PREMIUM":

            reward = task.rewardPremium || 0;

            break;

        default:

            reward = 0;

    }

    taskList.innerHTML += `

    <div class="task-card">

        <h3>${task.title}</h3>

        <p>${task.description}</p>

        <div class="task-info">

            <span>

                💰 Reward:
                <strong>₦${reward}</strong>

            </span>

            <span class="task-status available">

                🟢 Available

            </span>

        </div>

        <button
            onclick="location.href='task-details.html?id=${taskDoc.id}'">

            🚀 Start Task

        </button>

    </div>

    `;

});

document.getElementById("availableTasks").textContent =
    availableCount;

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

});

