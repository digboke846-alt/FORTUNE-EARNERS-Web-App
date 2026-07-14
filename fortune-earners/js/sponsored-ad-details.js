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

        const params =
            new URLSearchParams(window.location.search);

        const adId =
            params.get("id");

        if (!adId) {

            alert("Sponsored Ad not found.");

            window.location.href =
                "sponsored-ads.html";

            return;

        }

        const adRef =
            doc(db, "sponsoredAds", adId);

        const adSnap =
            await getDoc(adRef);

        if (!adSnap.exists()) {

            alert("Sponsored Ad not found.");

            window.location.href =
                "sponsored-ads.html";

            return;

        }

        const ad =
            adSnap.data();

        // ======================================
        // DISPLAY AD
        // ======================================

        document.getElementById("adTitle").textContent =
            ad.title;

        document.getElementById("adDescription").textContent =
            ad.description;

        document.getElementById("adReward").textContent =
            "₦" + Number(ad.reward || 0).toLocaleString();

        document.getElementById("visitAdBtn").href =
            ad.link;

        // ======================================
// IMAGE PREVIEW
// ======================================

const screenshotInput =
    document.getElementById("adScreenshot");

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

        if (!file.type.startsWith("image/")) return;

        const reader = new FileReader();

        reader.onload = function (e) {

            const img =
                document.createElement("img");

            img.src = e.target.result;

            img.style.width = "100px";

            img.style.height = "100px";

            img.style.objectFit = "cover";

            img.style.margin = "8px";

            img.style.borderRadius = "12px";

            img.style.border =
                "2px solid #FFC107";

            preview.appendChild(img);

        };

        reader.readAsDataURL(file);

    });

});

// ======================================
// CHECK FOR EXISTING SUBMISSION
// ======================================

const submitBtn =
    document.getElementById("submitAdBtn");

const submissionId =
    user.uid + "_" + adId;

const submissionRef =
    doc(db, "sponsoredAdSubmissions", submissionId);

const submissionSnap =
    await getDoc(submissionRef);

if (submissionSnap.exists()) {

    const submission =
        submissionSnap.data();

    submitBtn.disabled = true;

    submitBtn.textContent =
        "Already Submitted";

    document.getElementById("uploadStatus").textContent =
        "Status: " + submission.status;

} else {

    submitBtn.addEventListener("click", async () => {

        await setDoc(submissionRef, {

            userId: user.uid,

            adId: adId,

            adTitle: ad.title,

            status: "Pending",

            screenshotURLs: [],

            adminRemark: "",

            submittedAt: serverTimestamp()

        });

        alert(
            "✅ Sponsored Ad submitted successfully.\n\nImage upload will be activated later when Storage is enabled."
        );

        submitBtn.disabled = true;

        submitBtn.textContent =
            "Submitted";

    });

}

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

});
