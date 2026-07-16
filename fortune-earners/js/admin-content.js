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

        if (editingContentId) {

    await updateDoc(

        doc(db, "content", editingContentId),

        data

    );

    alert("Content updated successfully.");

    editingContentId = null;

    document.getElementById("saveContentBtn").textContent =
        "💾 Save";

}

else {

    await addDoc(

        collection(db, "content"),

        data

    );

    alert("Content added successfully.");

}

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
// ======================================
// LOAD ALL CONTENT
// ======================================

async function loadContent() {

    adsContainer.innerHTML = "";

    tasksContainer.innerHTML = "";

    announcementsContainer.innerHTML = "";

    try {

        const snapshot =
            await getDocs(collection(db, "content"));

        if (snapshot.empty) {

            adsContainer.innerHTML =
                "<p>No Sponsored Ads.</p>";

            tasksContainer.innerHTML =
                "<p>No Daily Tasks.</p>";

            announcementsContainer.innerHTML =
                "<p>No Announcements.</p>";

            return;

        }

        snapshot.forEach(docSnap => {

            const data = docSnap.data();

            const card = document.createElement("div");

            card.className = "dashboard-card";

            card.innerHTML = `

<h3>${data.title}</h3>

<p>${data.description}</p>

<p><strong>Status:</strong> ${data.status}</p>

${data.reward ? `<p><strong>Reward:</strong> ₦${data.reward.toLocaleString()}</p>` : ""}

${data.type === "task"
? `<p><strong>Completed:</strong> ${data.completedUsers || 0}/${data.maxUsers ?? "Unlimited"}</p>`
: ""}

<div class="dashboard-grid">

<button onclick="editContent('${docSnap.id}')">

✏ Edit

</button>

<button onclick="deleteContent('${docSnap.id}')">

🗑 Delete

</button>

</div>

`;

            if (data.type === "ad") {

                adsContainer.appendChild(card);

            }

            else if (data.type === "task") {

                tasksContainer.appendChild(card);

            }

            else {

                announcementsContainer.appendChild(card);

            }

        });

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}
// ======================================
// DELETE CONTENT
// ======================================

window.deleteContent = async function(contentId) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this content?"
    );

    if (!confirmDelete) return;

    try {

        await deleteDoc(
            doc(db, "content", contentId)
        );

        alert("Content deleted successfully.");

        loadContent();

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

};
// ======================================
// EDIT CONTENT
// ======================================

window.editContent = async function(contentId) {

    try {

        const contentRef = doc(db, "content", contentId);

        const contentSnap = await getDoc(contentRef);

        if (!contentSnap.exists()) {

            alert("Content not found.");

            return;

        }

        const data = contentSnap.data();

        editingContentId = contentId;

        modalTitle.textContent = "✏ Edit Content";

        document.getElementById("contentTitle").value =
            data.title || "";

        document.getElementById("contentDescription").value =
            data.description || "";

        document.getElementById("contentLink").value =
            data.link || "";

        document.getElementById("contentReward").value =
            data.reward || 0;

        document.getElementById("contentStatus").value =
            data.status || "Active";

        contentType.value =
            data.type;

        if (data.type === "task") {

            maxUsersContainer.style.display = "block";

            document.getElementById("maxUsers").value =
                data.maxUsers || "";

        } else {

            maxUsersContainer.style.display = "none";

        }

        document.getElementById("saveContentBtn").textContent =
            "💾 Update";

        contentModal.style.display = "block";

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

};
