import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp,
    updateDoc,
    orderBy,
    runTransaction,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import { createNotification } from "./notification-utils.js";

// ======================================
// GLOBAL VARIABLES
// ======================================

let currentUserData = null;
let selectedWallet = "task";
let feePercentage = 10;
let minimumWithdrawal = 0;
let isSubmittingWithdrawal = false;
let notificationSoundUnlocked = false;

// ======================================
// ELEMENTS
// ======================================

const withdrawType = document.getElementById("withdrawType");
const withdrawAmount = document.getElementById("withdrawAmount");
const feeDisplay = document.getElementById("withdrawFee");
const receiveDisplay = document.getElementById("amountToReceive");
const minimumDisplay = document.getElementById("minimumWithdrawal");
const taskWallet = document.getElementById("taskWallet");
const affiliateWallet = document.getElementById("affiliateWallet");

// ======================================
// CHECK LOGIN
// ======================================

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            alert("User account not found.");
            return;
        }

        currentUserData = userSnap.data();

        // =========================
        // LOAD WALLETS
        // =========================

        if (taskWallet) {
            taskWallet.textContent = "₦" + Number(currentUserData.taskWallet || 0).toLocaleString();
        }

        if (affiliateWallet) {
            affiliateWallet.textContent = "₦" + Number(currentUserData.affiliateWallet || 0).toLocaleString();
        }

        // =========================
        // LOAD BANK DETAILS
        // =========================

        const bankInput = document.getElementById("bankName");
        const accNameInput = document.getElementById("accountName");
        const accNumInput = document.getElementById("accountNumber");

        if (bankInput) bankInput.value = currentUserData.bankName || "";
        if (accNameInput) accNameInput.value = currentUserData.accountName || "";
        if (accNumInput) accNumInput.value = currentUserData.accountNumber || "";

        // =========================
        // SET DEFAULT MINIMUM & SETTINGS
        // =========================

        await loadUserDataAndSettings();

        // =========================
        // LOAD HISTORY & NOTIFICATIONS
        // =========================

        loadWithdrawalHistory(user.uid);
        loadNotificationBadge(user.uid);

    } catch (error) {
        console.error("Error during initial load:", error);
        alert(error.message);
    }
});

// ======================================
// UPDATE WITHDRAWAL SETTINGS
// ======================================

async function loadUserDataAndSettings() {
    try {
        const settingsSnap = await getDoc(doc(db, "settings", "global"));

        let settings = {};
        if (settingsSnap.exists()) {
            settings = settingsSnap.data();

            // 1. CHECK WITHDRAWAL PORTAL TOGGLE
            if (settings.allowWithdrawals === false) {
                alert("🔒 The Withdrawal portal is currently closed. Please check back later.");
                const withdrawBtn = document.getElementById("submitWithdrawalBtn");
                if (withdrawBtn) {
                    withdrawBtn.disabled = true;
                    withdrawBtn.textContent = "Withdrawals Closed";
                }
                return;
            }
        }

        // 2. DETERMINE DYNAMIC MINIMUM WITHDRAWAL BY WALLET & USER PLAN
        if (selectedWallet === "task") {
            const userPlan = (currentUserData?.plan || "").toUpperCase();

            if (userPlan === "NEWBIE") {
                minimumWithdrawal = settings.minTaskNewbie ?? 5000;
            } else if (userPlan === "SILVER") {
                minimumWithdrawal = settings.minTaskSilver ?? 4000;
            } else if (userPlan === "GOLD") {
                minimumWithdrawal = settings.minTaskGold ?? 3000;
            } else if (userPlan === "DIAMOND") {
                minimumWithdrawal = settings.minTaskDiamond ?? 2000;
            } else if (userPlan === "PREMIUM") {
                minimumWithdrawal = settings.minTaskPremium ?? 1000;
            } else {
                minimumWithdrawal = settings.minTaskNewbie ?? 5000;
            }
        } else {
            // General Affiliate Wallet Minimum for all plans
            minimumWithdrawal = settings.minAffiliateWithdrawal ?? 1000;
        }

        if (minimumDisplay) {
            minimumDisplay.textContent = "₦" + minimumWithdrawal.toLocaleString();
        }

        calculateWithdrawal();

    } catch (error) {
        console.error("Error loading withdrawal settings:", error);
    }
}

// ======================================
// CALCULATE WITHDRAWAL
// ======================================

function calculateWithdrawal() {
    if (!withdrawAmount) return;

    const amount = Number(withdrawAmount.value) || 0;
    const fee = (amount * feePercentage) / 100;
    const receive = Math.max(0, amount - fee);

    if (feeDisplay) feeDisplay.textContent = "₦" + fee.toLocaleString();
    if (receiveDisplay) receiveDisplay.textContent = "₦" + receive.toLocaleString();
}

if (withdrawType) {
    withdrawType.addEventListener("change", (e) => {
        selectedWallet = e.target.value;
        loadUserDataAndSettings();
    });
}

if (withdrawAmount) {
    withdrawAmount.addEventListener("input", calculateWithdrawal);
}

// ======================================
// SUBMIT WITHDRAWAL
// ======================================

const submitBtn = document.getElementById("submitWithdrawalBtn");
if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
        if (isSubmittingWithdrawal) return;

        isSubmittingWithdrawal = true;

        // ======================================
        // CHECK BANK DETAILS
        // ======================================
        const latestUserSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
        const latestUser = latestUserSnap.data();

        if (
            !latestUser.bankName ||
            !latestUser.accountName ||
            !latestUser.accountNumber
        ) {
            alert(
                "⚠️ Please add your bank details before requesting a withdrawal.\n\nYou will now be redirected to your profile to update your bank details."
            );
            window.location.href = "profile.html";
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "⏳ Processing...";

        try {
            const amount = Number(withdrawAmount.value);

            if (!amount || amount <= 0) {
                submitBtn.disabled = false;
                submitBtn.textContent = "💸 Submit Withdrawal";
                isSubmittingWithdrawal = false;
                alert("Enter a valid withdrawal amount.");
                return;
            }

            if (amount < minimumWithdrawal) {
                submitBtn.disabled = false;
                submitBtn.textContent = "💸 Submit Withdrawal";
                isSubmittingWithdrawal = false;
                alert(`Minimum withdrawal is ₦${minimumWithdrawal.toLocaleString()}`);
                return;
            }

            const walletBalance =
                selectedWallet === "task"
                    ? Number(currentUserData.taskWallet || 0)
                    : Number(currentUserData.affiliateWallet || 0);

            if (amount > walletBalance) {
                submitBtn.disabled = false;
                submitBtn.textContent = "💸 Submit Withdrawal";
                isSubmittingWithdrawal = false;
                alert("Insufficient wallet balance.");
                return;
            }

            const fee = (amount * feePercentage) / 100;
            const receive = amount - fee;

            // ======================================
            // GENERATE WITHDRAWAL REFERENCE
            // ======================================

            const now = new Date();
            const datePart =
                now.getFullYear().toString() +
                String(now.getMonth() + 1).padStart(2, "0") +
                String(now.getDate()).padStart(2, "0");

            const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
            const withdrawalReference = `FEW-${datePart}-${randomPart}`;

            const withdrawalRef = doc(collection(db, "withdrawals"));

            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, "users", auth.currentUser.uid);
                const userSnap = await transaction.get(userRef);

                if (!userSnap.exists()) {
                    throw new Error("User account not found.");
                }

                const freshUser = userSnap.data();
                const currentBalance =
                    selectedWallet === "task"
                        ? Number(freshUser.taskWallet || 0)
                        : Number(freshUser.affiliateWallet || 0);

                if (currentBalance < amount) {
                    throw new Error("Insufficient wallet balance.");
                }

                transaction.update(userRef, {
                    ...(selectedWallet === "task"
                        ? { taskWallet: currentBalance - amount }
                        : { affiliateWallet: currentBalance - amount })
                });

                transaction.set(withdrawalRef, {
                    reference: withdrawalReference,
                    userId: auth.currentUser.uid,
                    username: freshUser.username || "",
                    fullName: freshUser.fullname || "",
                    walletType: selectedWallet,
                    amountRequested: amount,
                    feePercentage: feePercentage,
                    feeAmount: fee,
                    amountToReceive: receive,
                    bankName: freshUser.bankName || "",
                    accountName: freshUser.accountName || "",
                    accountNumber: freshUser.accountNumber || "",
                    status: "Pending",
                    refundStatus: "Not Applicable",
                    adminComment: "",
                    processedBy: "",
                    processedAt: null,
                    submittedAt: serverTimestamp(),
                    requestDate: new Date().toLocaleString()
                });

                currentUserData = {
                    ...freshUser,
                    ...(selectedWallet === "task"
                        ? { taskWallet: currentBalance - amount }
                        : { affiliateWallet: currentBalance - amount })
                };
            });

            await createNotification({
                userId: auth.currentUser.uid,
                title: "💸 Withdrawal Submitted",
                message: `Your ₦${amount.toLocaleString()} withdrawal request has been submitted successfully and is awaiting admin review.`,
                type: "Withdrawal"
            });

            submitBtn.textContent = "✅ Withdrawal Submitted";

            alert(
                selectedWallet === "task"
                    ? "✅ Withdrawal request submitted successfully."
                    : "✅ Affiliate withdrawal processed successfully."
            );

            withdrawAmount.value = "";
            calculateWithdrawal();

            // ======================================
            // REFRESH WALLET DISPLAY
            // ======================================

            if (taskWallet) {
                taskWallet.textContent = "₦" + Number(currentUserData.taskWallet || 0).toLocaleString();
            }
            if (affiliateWallet) {
                affiliateWallet.textContent = "₦" + Number(currentUserData.affiliateWallet || 0).toLocaleString();
            }

            loadWithdrawalHistory(auth.currentUser.uid);

        } catch (error) {
            submitBtn.disabled = false;
            submitBtn.textContent = "💸 Submit Withdrawal";
            isSubmittingWithdrawal = false;
            console.error(error);
            alert(error.message);
        }
    });
}

// ======================================
// LOAD WITHDRAWAL HISTORY
// ======================================

async function loadWithdrawalHistory(userId) {
    try {
        const historyContainer = document.getElementById("withdrawHistory");
        if (!historyContainer) return;

        historyContainer.innerHTML = "";

        const q = query(
            collection(db, "withdrawals"),
            where("userId", "==", userId),
            orderBy("submittedAt", "desc")
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            historyContainer.innerHTML = `<p style="text-align: center; color: var(--muted); padding: 15px 0;">No withdrawal history available.</p>`;
            return;
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();

            historyContainer.innerHTML += `
                <div class="dashboard-card" style="margin-bottom: 10px; padding: 12px;">
                    <h3>${data.walletType === "task" ? "📋 Task Withdrawal" : "👥 Affiliate Withdrawal"}</h3>
                    <p><strong>💸 Amount Withdrawn:</strong> ₦${Number(data.amountRequested || 0).toLocaleString()}</p>
                    <p><strong>🧾 Reference:</strong> ${data.reference || "Not Available"}</p>
                    <p><strong>📅 Date:</strong> ${data.requestDate || "-"}</p>
                    <p>
                        <strong>📌 Status:</strong>
                        <span class="status-badge ${
                            data.status === "Pending"
                                ? "pending"
                                : data.status === "Successful" || data.status === "Approved"
                                ? "paid"
                                : "rejected"
                        }">
                            ${data.status}
                        </span>
                    </p>
                    ${data.adminComment ? `<p><strong>📝 Admin Comment:</strong> ${data.adminComment}</p>` : ""}
                </div>
            `;
        });
    } catch (error) {
        console.error("Error loading withdrawal history:", error);
    }
}

// ======================================
// LOG OUT
// ======================================

const logoutLink = document.getElementById("logoutBtn");
if (logoutLink) {
    logoutLink.addEventListener("click", async (e) => {
        e.preventDefault();

        const confirmLogout = confirm("Are you sure you want to log out?");
        if (!confirmLogout) return;

        try {
            await signOut(auth);
            window.location.href = "login.html";
        } catch (error) {
            console.error("Logout error:", error);
            alert("Logout failed.");
        }
    });
}

// ======================================
// LOAD NOTIFICATION BADGE
// ======================================

let previousUnreadCount = 0;

function loadNotificationBadge(userId) {
    const badge = document.getElementById("notificationBadge");
    if (!badge) return;

    const q = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        where("isRead", "==", false),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {
        const unreadCount = snapshot.size;

        if (unreadCount > previousUnreadCount && unreadCount > 0) {
            const newestNotification = snapshot.docs[0]?.data();
            if (newestNotification) {
                showNotificationToast(
                    newestNotification.title,
                    newestNotification.message
                );
            }
        }

        previousUnreadCount = unreadCount;

        if (unreadCount === 0) {
            badge.classList.add("hidden");
            return;
        }

        badge.classList.remove("hidden");
        badge.textContent = unreadCount > 9 ? "9+" : unreadCount;
    });
}

function showNotificationToast(title, message) {
    const toast = document.getElementById("notificationToast");
    const toastTitle = document.getElementById("toastTitle");
    const toastMessage = document.getElementById("toastMessage");

    if (!toast) return;

    if (toastTitle) toastTitle.textContent = title;
    if (toastMessage) toastMessage.textContent = message;

    toast.classList.remove("hidden");
    toast.classList.add("show");

    const sound = document.getElementById("notificationSound");

    if (sound && notificationSoundUnlocked) {
        sound.currentTime = 0;
        sound.play().catch(() => {});
    }

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
            toast.classList.add("hidden");
        }, 350);
    }, 5000);
}

// ======================================
// OPEN NOTIFICATIONS PAGE
// ======================================

const notificationButton = document.getElementById("notificationButton");
if (notificationButton) {
    notificationButton.addEventListener("click", () => {
        window.location.href = "notifications.html";
    });
}


