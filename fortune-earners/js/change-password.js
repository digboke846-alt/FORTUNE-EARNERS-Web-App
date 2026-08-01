import { auth } from "./firebase.js";

import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const form =
    document.getElementById("changePasswordForm");

const status =
    document.getElementById("passwordStatus");

const newPasswordInput =
    document.getElementById("new-password");

const strength =
    document.getElementById("passwordStrength");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const submitBtn =
    form.querySelector("button[type='submit']");

submitBtn.disabled = true;

submitBtn.textContent =
    "⏳ Changing Password...";

    const currentPassword =
        document.getElementById("current-password").value;

    const newPassword =
        document.getElementById("new-password").value;

    const confirmPassword =
        document.getElementById("confirm-password").value;

    if (newPassword !== confirmPassword) {

        status.style.color = "#dc2626";

        status.textContent =
            "❌ New passwords do not match.";

        return;

    }

    if (newPassword.length < 8) {

        status.style.color = "#dc2626";

        status.textContent =
            "❌ Password must be at least 8 characters.";

        return;

    }

    try {

        const user =
            auth.currentUser;

        const credential =
            EmailAuthProvider.credential(

                user.email,

                currentPassword

            );

        await reauthenticateWithCredential(

            user,

            credential

        );

        await updatePassword(

            user,

            newPassword

        );

        submitBtn.textContent =
    "✅ Password Changed";

        status.style.color = "#16a34a";

        status.innerHTML =
            `✅ Your password has been changed successfully.`;

        form.reset();

    }

    catch (error) {

        status.style.color = "#dc2626";

        switch (error.code) {

            case "auth/wrong-password":

            case "auth/invalid-credential":

                status.textContent =
                    "❌ Your current password is incorrect.";

                break;

            case "auth/weak-password":

                status.textContent =
                    "❌ Choose a stronger password.";

                break;

            case "auth/requires-recent-login":

                status.textContent =
                    "❌ Please log in again and try changing your password.";

                break;

            default:

                status.textContent =
                    error.message;

                submitBtn.disabled = false;

submitBtn.textContent =
    "Change Password";

        }

    }

});

