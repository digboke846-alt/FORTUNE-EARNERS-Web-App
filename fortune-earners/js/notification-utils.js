import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

export async function createNotification({

    userId,

    title,

    message,

    type = "General"

}) {

    try {

        await addDoc(

            collection(db, "notifications"),

            {

                userId,

                title,

                message,

                type,

                isRead: false,

                createdAt: serverTimestamp()

            }

        );

    }

    catch (error) {

        console.error("Notification Error:", error);

    }

}
