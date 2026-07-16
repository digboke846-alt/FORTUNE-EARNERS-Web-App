// ======================================
// IMPORTS
// ======================================

import { auth, db } from "./firebase.js";

import {

    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp

} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {

    onAuthStateChanged,
    signOut

} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// ======================================
// GLOBAL VARIABLES
// ======================================

let editingContentId = null;

const adsContainer =
    document.getElementById("adsContainer");

const tasksContainer =
    document.getElementById("tasksContainer");

const announcementsContainer =
    document.getElementById("announcementsContainer");

const contentModal =
    document.getElementById("contentModal");

const contentForm =
    document.getElementById("contentForm");

const modalTitle =
    document.getElementById("modalTitle");

const contentType =
    document.getElementById("contentType");

const maxUsersContainer =
    document.getElementById("maxUsersContainer");
// ======================================
// SHOW/HIDE MAXIMUM USERS
// ======================================

contentType.addEventListener("change", () => {

    if (contentType.value === "task") {

        maxUsersContainer.style.display = "block";

    } else {

        maxUsersContainer.style.display = "none";

    }

});

// Hide it by default
maxUsersContainer.style.display = "none";
// ======================================
// OPEN CONTENT MODAL
// ======================================

const addSponsoredAdBtn =
    document.getElementById("addSponsoredAdBtn");

const addTaskBtn =
    document.getElementById("addTaskBtn");

const addAnnouncementBtn =
    document.getElementById("addAnnouncementBtn");

const closeContentModal =
    document.getElementById("closeContentModal");

// ------------------------------
// Sponsored Ad
// ------------------------------

addSponsoredAdBtn.addEventListener("click", () => {

    editingContentId = null;

    contentForm.reset();

    modalTitle.textContent =
        "📢 Add Sponsored Ad";

    contentType.value = "ad";

    maxUsersContainer.style.display = "none";

    contentModal.style.display = "block";

});

// ------------------------------
// Daily Task
// ------------------------------

addTaskBtn.addEventListener("click", () => {

    editingContentId = null;

    contentForm.reset();

    modalTitle.textContent =
        "📝 Add Daily Task";

    contentType.value = "task";

    maxUsersContainer.style.display = "block";

    contentModal.style.display = "block";

});

// ------------------------------
// Announcement
// ------------------------------

addAnnouncementBtn.addEventListener("click", () => {

    editingContentId = null;

    contentForm.reset();

    modalTitle.textContent =
        "📣 Add Announcement";

    contentType.value = "announcement";

    maxUsersContainer.style.display = "none";

    contentModal.style.display = "block";

});

// ------------------------------
// Close Modal
// ------------------------------

closeContentModal.addEventListener("click", () => {

    contentModal.style.display = "none";

});

window.addEventListener("click", (e) => {

    if (e.target === contentModal) {

        contentModal.style.display = "none";

    }

});
// ======================================
// SAVE CONTENT
// ======================================

contentForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    try {

        const data = {

            type: contentType.value,

            title: document.getElementById("contentTitle").value.trim(),

            description: document.getElementById("contentDescription").value.trim(),

            link: document.getElementById("contentLink").value.trim(),

            reward: Number(
                document.getElementById("contentReward").value
            ) || 0,

            maxUsers:
                contentType.value === "task"
                ? Number(document.getElementById("maxUsers").value) || null
                : null,

            completedUsers: 0,

            status:
                document.getElementById("contentStatus").value,

            createdAt: serverTimestamp()

        };

        await addDoc(
            collection(db, "content"),
            data
        );

        alert("Content added successfully.");

        contentForm.reset();

        contentModal.style.display = "none";

        loadContent();

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});
