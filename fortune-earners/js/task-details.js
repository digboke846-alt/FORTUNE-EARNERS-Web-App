import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// ======================================
// GET TASK ID FROM URL
// ======================================

const params = new URLSearchParams(window.location.search);

const taskId = params.get("id");

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

            return;

        }

        const userData =
            userSnap.data();

        // ======================================
// LOAD TASK
// ======================================

const taskRef =
    doc(db, "tasks", taskId);

const taskSnap =
    await getDoc(taskRef);

if (!taskSnap.exists()) {

    alert("Task not found.");

    window.location.href =
        "daily-tasks.html";

    return;

}

const task =
    taskSnap.data();

// ======================================
// DISPLAY TASK
// ======================================

document.getElementById("taskTitle").textContent =
    task.title;

document.getElementById("taskDescription").textContent =
    task.description;

document.getElementById("taskStatus").textContent =
    task.active ? "🟢 Available" : "🔴 Closed";

// ======================================
// REWARD BASED ON USER PLAN
// ======================================

let reward = 0;

switch (userData.plan) {

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

document.getElementById("taskReward").textContent =
    "₦" + reward.toLocaleString();

// ======================================
// OPEN TASK BUTTON
// ======================================

document.getElementById("startTaskBtn")
.addEventListener("click", () => {

    window.open(task.link, "_blank");

});
      // ======================================
// SUBMIT TASK
// ======================================

const submitBtn =
    document.getElementById("submitTaskBtn");

const screenshotInput =
    document.getElementById("taskScreenshot");

submitBtn.addEventListener("click", async () => {

    if (screenshotInput.files.length === 0) {

        alert("Please select at least one screenshot.");

        return;

    }

    if (screenshotInput.files.length > 3) {

        alert("You can upload a maximum of 3 screenshots.");

        return;

    }

    alert(
        "✅ Screenshots selected successfully.\n\nUpload to Firebase Storage will be added in the next part."
    );

});

    }
        // ======================================
// IMAGE PREVIEW
// ======================================

const preview =
    document.getElementById("imagePreview");

screenshotInput.addEventListener("change", () => {

    preview.innerHTML = "";

    const files =
        Array.from(screenshotInput.files);

    if (files.length > 3) {

        alert("You can only select a maximum of 3 screenshots.");

        screenshotInput.value = "";

        return;

    }

    files.forEach(file => {

        if (!file.type.startsWith("image/")) {

            return;

        }

        const reader =
            new FileReader();

        reader.onload = function(e){

            const img =
                document.createElement("img");

            img.src = e.target.result;

            img.style.width = "100px";

            img.style.height = "100px";

            img.style.objectFit = "cover";

            img.style.borderRadius = "12px";

            img.style.margin = "8px";

            img.style.border =
                "2px solid #FFC107";

            preview.appendChild(img);

        };

        reader.readAsDataURL(file);

    });

});

    catch(error){

        console.error(error);

        alert(error.message);

    }

});

