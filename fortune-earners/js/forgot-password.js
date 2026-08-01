import { auth } from "./firebase.js";

import {
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const form =
    document.getElementById("forgotPasswordForm");

const emailInput =
    document.getElementById("email");

const status =
    document.getElementById("resetStatus");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email =
        emailInput.value.trim();

    try {

        await sendPasswordResetEmail(auth, email);

        status.style.color = "#16a34a";

        status.innerHTML = `
✅ Password reset link has been sent to
<strong>${email}</strong>.<br><br>
Please check your inbox and don't forget to check Spam folder for the link.
`;

        form.reset();

    }

    catch (error) {

        status.style.color = "#dc2626";

        switch (error.code) {

            case "auth/user-not-found":

                status.textContent =
                    "❌ No account exists with that email address.";

                break;

            case "auth/invalid-email":

                status.textContent =
                    "❌ Please enter a valid email address.";

                break;

            case "auth/too-many-requests":

                status.textContent =
                    "❌ Too many attempts. Please try again later.";

                break;

            default:

                status.textContent =
                    error.message;

        }

    }

});
