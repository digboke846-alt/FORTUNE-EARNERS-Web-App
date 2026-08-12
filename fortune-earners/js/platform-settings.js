import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const settingsRef = doc(db, "settings", "global");

// UI Elements
const withdrawalToggle = document.getElementById("withdrawalToggle");
const registrationToggle = document.getElementById("registrationToggle");
const referralToggle = document.getElementById("referralToggle");
const maintenanceToggle = document.getElementById("maintenanceToggle");

const minTaskWithdrawal = document.getElementById("minTaskWithdrawal");
const minAffiliateWithdrawal = document.getElementById("minAffiliateWithdrawal");
const planPriceInput = document.getElementById("planPriceInput");
const referralBonusInput = document.getElementById("referralBonusInput");
const announcementInput = document.getElementById("announcementInput");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");

// Verify Admin Auth & Load Current Settings
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (!userSnap.exists() || !userSnap.data().isAdmin) {
            alert("Access Denied.");
            window.location.href = "dashboard.html";
            return;
        }

        // Load Firestore Settings
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
            const data = settingsSnap.data();

            withdrawalToggle.checked = data.allowWithdrawals ?? true;
            registrationToggle.checked = data.allowRegistration ?? true;
            referralToggle.checked = data.allowReferrals ?? true;
            maintenanceToggle.checked = data.maintenanceMode ?? false;

            minTaskWithdrawal.value = data.minTaskWithdrawal || 3000;
            minAffiliateWithdrawal.value = data.minAffiliateWithdrawal || 1000;
            planPriceInput.value = data.planActivationCost || 3000;
            referralBonusInput.value = data.referralCommission || 1000;
            announcementInput.value = data.announcementText || "";
        }
    } catch (error) {
        console.error("Error loading settings:", error);
        alert("Failed to load platform settings.");
    }
});

// Save Settings
saveSettingsBtn.addEventListener("click", async () => {
    saveSettingsBtn.disabled = true;
    saveSettingsBtn.textContent = "Saving...";

    try {
        await setDoc(settingsRef, {
            allowWithdrawals: withdrawalToggle.checked,
            allowRegistration: registrationToggle.checked,
            allowReferrals: referralToggle.checked,
            maintenanceMode: maintenanceToggle.checked,

            minTaskWithdrawal: Number(minTaskWithdrawal.value) || 0,
            minAffiliateWithdrawal: Number(minAffiliateWithdrawal.value) || 0,
            planActivationCost: Number(planPriceInput.value) || 0,
            referralCommission: Number(referralBonusInput.value) || 0,
            announcementText: announcementInput.value.trim()
        }, { merge: true });

        alert("✅ Platform settings saved successfully!");
    } catch (error) {
        console.error("Error saving settings:", error);
        alert("❌ Failed to save settings: " + error.message);
    } finally {
        saveSettingsBtn.disabled = false;
        saveSettingsBtn.textContent = "💾 Save Settings";
    }
});


