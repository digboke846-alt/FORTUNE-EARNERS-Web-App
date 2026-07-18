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
// GET AD ID
// ======================================

const params =
    new URLSearchParams(window.location.search);

const adId =
    params.get("id");

// ======================================
// CHECK LOGIN
// ======================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }

    try {

        // ======================================
        // LOAD USER
        // ======================================

        const userRef =
            doc(db, "users", user.uid);

        const userSnap =
            await getDoc(userRef);

        if (!userSnap.exists()) {

            alert("User account not found.");

            return;

        }

        const userData =
            userSnap.data();
                // ======================================
        // LOAD SPONSORED AD
        // ======================================

        const adRef =
            doc(db, "content", adId);

        const adSnap =
            await getDoc(adRef);

        if (!adSnap.exists()) {

            alert("Sponsored Advertisement not found.");

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

        document.getElementById("adStatus").textContent =
            "🟢 Available";

        // ======================================
        // REWARD BASED ON USER PLAN
        // ======================================

        let reward = 0;

        switch (userData.plan) {

            case "NEWBIE":

                reward = ad.rewardNewbie || 0;

                break;

            case "SILVER":

                reward = ad.rewardSilver || 0;

                break;

            case "GOLD":

                reward = ad.rewardGold || 0;

                break;

            case "DIAMOND":

                reward = ad.rewardDiamond || 0;

                break;

            case "PREMIUM":

                reward = ad.rewardPremium || 0;

                break;

            default:

                reward = 0;

        }

        document.getElementById("adReward").textContent =
            "₦" + reward.toLocaleString();

        // ======================================
        // OPEN AD BUTTON
        // ======================================

        document.getElementById("openAdBtn")
        .addEventListener("click", () => {

            if (ad.link) {

                window.open(ad.link, "_blank");

            }

            else {

                alert("No advertisement link available.");

            }

        });
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

                alert("You can only upload a maximum of 3 screenshots.");

                screenshotInput.value = "";

                return;

            }

            files.forEach(file => {

                if (!file.type.startsWith("image/")) {

                    return;

                }

                const reader =
                    new FileReader();

                reader.onload = (e) => {

                    const img =
                        document.createElement("img");

                    img.src = e.target.result;

                    img.style.width = "100px";

                    img.style.height = "100px";

                    img.style.objectFit = "cover";

                    img.style.margin = "8px";

                    img.style.borderRadius = "12px";

                    img.style.border =
                        "2px solid #FFD700";

                    preview.appendChild(img);

                };

                reader.readAsDataURL(file);

            });

        });

        // ======================================
        // CHECK EXISTING SUBMISSION
        // ======================================

        const submissionId =
            user.uid + "_" + adId;

        const submissionRef =
            doc(db, "adSubmissions", submissionId);

        const submissionSnap =
            await getDoc(submissionRef);

        const submitBtn =
            document.getElementById("submitAdBtn");

        if (submissionSnap.exists()) {

            const submission =
                submissionSnap.data();

            document.getElementById("adStatus").textContent =
                "🟡 " + submission.status;

            submitBtn.disabled = true;

            submitBtn.textContent =
                "✅ Already Submitted";

        }

        else {

            submitBtn.addEventListener("click", async () => {

                if (screenshotInput.files.length === 0) {

                    alert("Please select at least one screenshot.");

                    return;

                }

                await setDoc(submissionRef, {

                    userId: user.uid,

                    adId: adId,

                    adTitle: ad.title,

                    reward: reward,

                    status: "Pending",

                    screenshotURLs: [],

                    submittedAt: serverTimestamp()

                });

                alert("✅ Sponsored Ad submitted successfully and is awaiting admin review.");

                submitBtn.disabled = true;

                submitBtn.textContent =
                    "✅ Submitted";

                document.getElementById("adStatus").textContent =
                    "🟡 Pending";

            });

}   
    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});
