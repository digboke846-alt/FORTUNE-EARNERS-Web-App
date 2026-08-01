import { auth } from "./firebase.js";

import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const form =
    document.getElementById("changePasswordForm");

const status =
    document.getElementById("passwordStatus");

const newPasswordInput =
    document.getElementById("new-password");

const strength =
    document.getElementById("passwordStrength");

const confirmPasswordInput =
    document.getElementById("confirm-password");

const passwordMatch =
    document.getElementById("passwordMatch");

newPasswordInput.addEventListener("input", () => {

    const password =
        newPasswordInput.value;

    let score = 0;

    if (password.length >= 8) score++;

    if (/[A-Z]/.test(password)) score++;

    if (/[0-9]/.test(password)) score++;

    if (/[^A-Za-z0-9]/.test(password)) score++;

    switch (score) {

        case 0:

        case 1:

            strength.style.color = "#ef4444";

            strength.textContent =
                "🔴 Weak Password";

            break;

        case 2:

            strength.style.color = "#f59e0b";

            strength.textContent =
                "🟡 Medium Password";

            break;

        case 3:

            strength.style.color = "#22c55e";

            strength.textContent =
                "🟢 Strong Password";

            break;

        case 4:

            strength.style.color = "#16a34a";

            strength.textContent =
                "🟢 Very Strong Password";

            break;

    }

    if (!password) {

        strength.textContent = "";

    }

});

confirmPasswordInput.addEventListener("input", () => {

    const newPassword =
        newPasswordInput.value;

    const confirmPassword =
        confirmPasswordInput.value;

    if (!confirmPassword) {

        passwordMatch.textContent = "";

        return;

    }

    if (newPassword === confirmPassword) {

        passwordMatch.style.color = "#16a34a";

        passwordMatch.textContent =
            "✅ Passwords match";

    }

    else {

        passwordMatch.style.color = "#dc2626";

        passwordMatch.textContent =
            "Passwords do not match";

    }

});

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
`✅ Password changed successfully.<br>
Redirecting to Login...`;

form.reset();

setTimeout(async () => {

    await signOut(auth);

    window.location.href = "login.html";

}, 2000);

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

