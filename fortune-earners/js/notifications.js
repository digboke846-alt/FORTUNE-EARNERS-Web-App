import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    addDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// ======================================
// CHECK LOGIN
// ======================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }

    await markAllNotificationsAsRead(user.uid);

loadNotifications(user.uid);

});

// ======================================
// MARK ALL AS READ AUTOMATICALLY
// ======================================

async function markAllNotificationsAsRead(userId) {

    try {

        const q = query(

            collection(db, "notifications"),

            where("userId", "==", userId),

            where("isRead", "==", false)

        );

        const snapshot = await getDocs(q);

        for (const notification of snapshot.docs) {

            await updateDoc(

                doc(db, "notifications", notification.id),

                {

                    isRead: true

                }

            );

        }

    }

    catch (error) {

        console.error(error);

    }

}
// ======================================
// LOAD NOTIFICATIONS
// ======================================

async function loadNotifications(userId) {

    try {

        const notificationList =
            document.getElementById("notificationList");

        notificationList.innerHTML = "";

        const q = query(

            collection(db, "notifications"),

            where("userId", "==", userId),

            orderBy("createdAt", "desc")

        );

        const snapshot =
            await getDocs(q);

        if (snapshot.empty) {

            notificationList.innerHTML = `

<p>

No notifications available.

</p>

`;

            return;

        }

        snapshot.forEach((docSnap) => {

            const data = docSnap.data();

            const card =
                document.createElement("div");

            card.className =
                `notification-card ${
                    data.isRead
                        ? "notification-read"
                        : "notification-unread"
                }`;

            card.dataset.id = docSnap.id;

            card.innerHTML = `

<div class="notification-status">

${data.type || "Notification"}

</div>

<div class="notification-title">

${data.title}

<button
class="deleteNotificationBtn"

data-id="${notification.id}">

🗑️

</button>

</div>

<div class="notification-message">

${data.message}

</div>

<div class="notification-date">

${data.createdAt?.toDate
    ? data.createdAt.toDate().toLocaleString()
    : ""}

</div>

`;

            notificationList.appendChild(card);

        });

    }

    catch (error) {

    alert(error.message);

    console.error(error);

    }

}

document.querySelectorAll(".deleteNotificationBtn")
.forEach(button => {

    button.addEventListener("click", async () => {

        const notificationId =
            button.dataset.id;

        const confirmDelete =
            confirm("Delete this notification?");

        if (!confirmDelete) return;

        try {

            await deleteDoc(

                doc(db, "notifications", notificationId)

            );

            button.closest(".notification-card").remove();

        }

        catch (error) {

            console.error(error);

            alert(error.message);

        }

    });

});
// ======================================
// MARK NOTIFICATION AS READ
// ======================================

document.addEventListener("click", async (e) => {

    const card = e.target.closest(".notification-card");

    if (!card) return;

    const notificationId = card.dataset.id;

    try {

        await updateDoc(

            doc(db, "notifications", notificationId),

            {

                isRead: true

            }

        );

        card.classList.remove("notification-unread");

        card.classList.add("notification-read");

    }

    catch (error) {

        console.error(error);

    }

});
// ======================================
// MARK ALL AS READ
// ======================================

document
.getElementById("markAllReadBtn")
.addEventListener("click", async () => {

    const user = auth.currentUser;

    if (!user) return;

    try {

        const q = query(

            collection(db, "notifications"),

            where("userId", "==", user.uid),

            where("isRead", "==", false)

        );

        const snapshot = await getDocs(q);

        for (const notification of snapshot.docs) {

            await updateDoc(

                doc(db, "notifications", notification.id),

                {

                    isRead: true

                }

            );

        }

        loadNotifications(user.uid);

    }

    catch (error) {

        console.error(error);

    }

});

// ======================================
// CLEAR READ NOTIFICATIONS
// ======================================

document
.getElementById("clearReadBtn")
.addEventListener("click", async () => {

    const user = auth.currentUser;

    if (!user) return;

    const confirmDelete = confirm(

        "Delete all read notifications?"

    );

    if (!confirmDelete) return;

    try {

        const q = query(

            collection(db, "notifications"),

            where("userId", "==", user.uid),

            where("isRead", "==", true)

        );

        const snapshot = await getDocs(q);

        for (const notification of snapshot.docs) {

            await deleteDoc(

                doc(db, "notifications", notification.id)

            );

        }

        loadNotifications(user.uid);

    }

    catch (error) {

        console.error(error);

    }

});
export async function createNotification({

    userId,

    title,

    message,

    type = "General"

}){

    try{

        await addDoc(

            collection(db,"notifications"),

            {

                userId,

                title,

                message,

                type,

                isRead:false,

                createdAt:serverTimestamp()

            }

        );

    }

    catch(error){

        console.error(error);

    }

}
