import { auth } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }

    if (user.email !== "freshguy177@gmail.com") {

        alert("⛔ Access Denied.\n\nAdministrator access only.");

        window.location.href = "dashboard.html";

    }

});
