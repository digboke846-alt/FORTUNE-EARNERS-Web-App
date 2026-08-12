import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const settingsRef = doc(db, "settings", "global");

// UI Elements - Toggles
const withdrawalToggle = document.getElementById("withdrawalToggle");
const registrationToggle = document.getElementById("registrationToggle");
const referralToggle = document.getElementById("referralToggle");
const maintenanceToggle = document.getElementById("maintenanceToggle");

// UI Elements - Task Wallet Minimums per Plan
const minTaskNewbie = document.getElementById("minTaskNewbie");
const minTaskSilver = document.getElementById("minTaskSilver");
const minTaskGold = document.getElementById("minTaskGold");
const minTaskDiamond = document.getElementById("minTaskDiamond");
const minTaskPremium = document.getElementById("minTaskPremium");

// UI Elements - Affiliate & Pricing Settings
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

            // Toggles
            withdrawalToggle.checked = data.allowWithdrawals ?? true;
            registrationToggle.checked = data.allowRegistration ?? true;
            referralToggle.checked = data.allowReferrals ?? true;
            maintenanceToggle.checked = data.maintenanceMode ?? false;

            // Task Wallet Minimum Limits per Plan
            minTaskNewbie.value = data.minTaskNewbie ?? 5000;
            minTaskSilver.value = data.minTaskSilver ?? 4000;
            minTaskGold.value = data.minTaskGold ?? 3000;
            minTaskDiamond.value = data.minTaskDiamond ?? 2000;
            minTaskPremium.value = data.minTaskPremium ?? 1000;

            // Affiliate Minimum & Pricing Settings
            minAffiliateWithdrawal.value = data.minAffiliateWithdrawal ?? 1000;
            planPriceInput.value = data.planActivationCost ?? 3000;
            referralBonusInput.value = data.referralCommission ?? 1000;
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
            // Toggles
            allowWithdrawals: withdrawalToggle.checked,
            allowRegistration: registrationToggle.checked,
            allowReferrals: referralToggle.checked,
            maintenanceMode: maintenanceToggle.checked,

            // Minimum Task Wallet Limits by Plan
            minTaskNewbie: Number(minTaskNewbie.value) || 0,
            minTaskSilver: Number(minTaskSilver.value) || 0,
            minTaskGold: Number(minTaskGold.value) || 0,
            minTaskDiamond: Number(minTaskDiamond.value) || 0,
            minTaskPremium: Number(minTaskPremium.value) || 0,

            // General Affiliate Wallet Minimum & Pricing
            minAffiliateWithdrawal: Number(minAffiliateWithdrawal.value) || 0,
            planActivationCost: Number(planPriceInput.value) || 0,
            referralCommission: Number(referralBonusInput.value) || 0,

            // Announcements
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


