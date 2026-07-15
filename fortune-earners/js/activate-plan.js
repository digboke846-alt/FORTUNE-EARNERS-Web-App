import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
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

    try {

        const userRef =
            doc(db, "users", user.uid);

        const userSnap =
            await getDoc(userRef);

        if (!userSnap.exists()) {

            alert("User not found.");

            return;

        }

        const userData =
            userSnap.data();

        // If already activated
        if (userData.plan !== "None") {

            alert("Your account is already activated.");

            window.location.href =
                "dashboard.html";

            return;

        }

       // ======================================
// PLAN SELECTION
// ======================================

const paymentSection =
    document.getElementById("paymentSection");

const selectedPlan =
    document.getElementById("selectedPlan");

const selectedAmount =
    document.getElementById("selectedAmount");

let chosenPlan = "";

let chosenAmount = 0;

const planButtons =
    document.querySelectorAll(".activatePlanBtn");

planButtons.forEach(button => {

    button.addEventListener("click", () => {

        chosenPlan =
            button.dataset.plan;

        chosenAmount =
            Number(button.dataset.price);

        selectedPlan.textContent =
            chosenPlan;

        selectedAmount.textContent =
            "₦" + chosenAmount.toLocaleString();

        paymentSection.style.display =
            "block";

        paymentSection.scrollIntoView({

            behavior: "smooth"

        });

    });

});
      // ======================================
// SUBMIT ACTIVATION REQUEST
// ======================================

const submitPaymentBtn =
    document.getElementById("submitPaymentBtn");

submitPaymentBtn.addEventListener("click", async () => {

    if (!chosenPlan) {

        alert("Please select a plan.");

        return;

    }

    const proof =
        document.getElementById("paymentProof").files[0];

    if (!proof) {

        alert("Please upload your payment proof.");

        return;

    }

    const activationRef =
        doc(db, "activationRequests", user.uid);

    await setDoc(activationRef, {

        userId: user.uid,

        fullname: userData.fullname,

        username: userData.username,

        email: userData.email,

        selectedPlan: chosenPlan,

        amount: chosenAmount,

        status: "Pending",

        paymentProofUploaded: true,

        submittedAt: serverTimestamp()

    });

    alert(
        "✅ Your activation request has been submitted successfully.\n\nOur admin will review your payment and activate your account."
    );

    submitPaymentBtn.disabled = true;

    submitPaymentBtn.textContent =
        "Request Submitted";

});
    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});
