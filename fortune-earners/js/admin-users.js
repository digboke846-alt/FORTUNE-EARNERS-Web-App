import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    collection,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// ======================================
// GLOBAL VARIABLES
// ======================================

let allUsers = [];

let selectedUserId = "";

let selectedUserData = {};
// ======================================
// CHECK ADMIN AUTHENTICATION
// ======================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }

    try {

        const adminRef = doc(db, "users", user.uid);

        const adminSnap = await getDoc(adminRef);

        if (!adminSnap.exists()) {

            alert("User account not found.");

            window.location.href = "login.html";

            return;

        }

        const adminData = adminSnap.data();

        if (adminData.isAdmin !== true) {

            alert("Access denied.");

            window.location.href = "dashboard.html";

            return;

        }

        // Admin verified
        await loadUsers();

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});
// ======================================
// LOAD ALL USERS
// ======================================

async function loadUsers() {

    try {

        const usersContainer =
            document.getElementById("usersContainer");

        usersContainer.innerHTML = `
            <p>Loading users...</p>
        `;

        const usersSnapshot =
            await getDocs(collection(db, "users"));

        // Store users in memory
        allUsers = [];

        usersSnapshot.forEach((userDoc) => {

            allUsers.push({

                id: userDoc.id,

                ...userDoc.data()

            });

        });

        displayUsers(allUsers);

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}
// ======================================
// DISPLAY USERS
// ======================================

function displayUsers(users) {

    const usersContainer =
        document.getElementById("usersContainer");

    usersContainer.innerHTML = "";

    if (users.length === 0) {

        usersContainer.innerHTML = `

            <div class="dashboard-card">

                <h3>

                    No users found.

                </h3>

            </div>

        `;

        return;

    }

    users.forEach((user) => {

        const planStatus =
    user.memberStatus || "Pending Activation";

const accountStatus =
    user.accountStatus || "Active";

        const plan =
            user.plan || "Not Activated";

        const affiliateWallet =
            user.affiliateWallet || 0;

        const taskWallet =
            user.taskWallet || 0;

        const validReferrals =
            user.validReferrals || 0;

        usersContainer.innerHTML += `

        <div class="dashboard-card">

            <h3>

                👤 ${user.fullname}

            </h3>

            <p>

                <strong>Username:</strong>

                @${user.username}

            </p>

            <p>

<strong>Plan Status:</strong>

${planStatus}

</p>

<p>

<strong>Account Status:</strong>

${accountStatus}

</p>

            <p>

                <strong>Plan:</strong>

                ${plan}

            </p>

            <p>

                <strong>Affiliate Wallet:</strong>

                ₦${affiliateWallet.toLocaleString()}

            </p>

            <p>

                <strong>Task Wallet:</strong>

                ₦${taskWallet.toLocaleString()}

            </p>

            <p>

                <strong>Valid Referrals:</strong>

                ${validReferrals}

            </p>

            <button
                onclick="viewUser('${user.id}')">

                👁 View Details

            </button>

        </div>

        `;

    });

}
// ======================================
// VIEW USER DETAILS
// ======================================

window.viewUser = async function(userId) {

    try {

        const userRef =
            doc(db, "users", userId);

        const userSnap =
            await getDoc(userRef);

        if (!userSnap.exists()) {

            alert("User not found.");

            return;

        }

        selectedUserId = userId;

        selectedUserData = userSnap.data();

        const user = selectedUserData;

        const userDetails =
            document.getElementById("userDetails");

        userDetails.innerHTML = `

        <p><strong>Full Name:</strong>
        ${user.fullname}</p>

        <p><strong>Username:</strong>
        @${user.username}</p>

        <p><strong>Email:</strong>
        ${user.email}</p>

        <p><strong>Phone:</strong>
        ${user.phone}</p>

        <p><strong>Plan Status:</strong>
${user.memberStatus || "Pending Activation"}</p>

<p><strong>Account Status:</strong>
${user.accountStatus || "Active"}</p>

        <p><strong>Plan:</strong>
        ${user.plan || "Not Activated"}</p>

        <p><strong>Affiliate Wallet:</strong>
        ₦${(user.affiliateWallet || 0).toLocaleString()}</p>

        <p><strong>Task Wallet:</strong>
        ₦${(user.taskWallet || 0).toLocaleString()}</p>

        <p><strong>Valid Referrals:</strong>
        ${user.validReferrals || 0}</p>

        <p><strong>Referral Earnings:</strong>
        ₦${(user.referralEarnings || 0).toLocaleString()}</p>

        `;

        const suspendBtn =
            document.getElementById("suspendUserBtn");

        const activateBtn =
            document.getElementById("activateUserBtn");

        if (user.accountStatus === "Suspended") {

    suspendBtn.style.display = "none";

    activateBtn.style.display = "inline-block";

} else {

    suspendBtn.style.display = "inline-block";

    activateBtn.style.display = "none";

        }

        document
            .getElementById("userModal")
            .style.display = "block";

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

};
// ======================================
// SUSPEND USER
// ======================================

document
.getElementById("suspendUserBtn")
.addEventListener("click", async () => {

    if (!selectedUserId) return;

    const confirmSuspend = confirm(
        `Suspend ${selectedUserData.fullname}'s account?`
    );

    if (!confirmSuspend) return;

    try {

        await updateDoc(
            doc(db, "users", selectedUserId),
            {

                accountStatus: "Suspended",

                suspendedAt: serverTimestamp(),

                suspendedBy: auth.currentUser.uid

            }
        );

        alert("User suspended successfully.");

        document.getElementById("userModal").style.display = "none";

        await loadUsers();

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});
// ======================================
// REACTIVATE USER
// ======================================

document
.getElementById("activateUserBtn")
.addEventListener("click", async () => {

    if (!selectedUserId) return;

    const confirmActivate = confirm(
        `Reactivate ${selectedUserData.fullname}'s account?`
    );

    if (!confirmActivate) return;

    try {

        await updateDoc(
            doc(db, "users", selectedUserId),
            {

                accountStatus: "Active",

                suspendedAt: null,

                suspendedBy: null

            }
        );

        alert("User reactivated successfully.");

        document.getElementById("userModal").style.display = "none";

        await loadUsers();

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});
// ======================================
// DEACTIVATE USER
// ======================================

document
.getElementById("deactivateUserBtn")
.addEventListener("click", async () => {

    if (!selectedUserId) return;

    // Prevent admin from deactivating self
    if (selectedUserId === auth.currentUser.uid) {

        alert("You cannot deactivate your own admin account.");

        return;

    }

    const confirmDeactivate = confirm(

        `Are you sure you want to deactivate ${selectedUserData.fullname}'s account?\n\nThe account will no longer be able to log in, but all records will be kept.`

    );

    if (!confirmDeactivate) return;

    try {

        await updateDoc(

            doc(db, "users", selectedUserId),

            {

                accountStatus: "Deactivated",

                accountDeleted: true,

                deletedAt: serverTimestamp(),

                deletedBy: auth.currentUser.uid

            }

        );

        alert("User account has been deactivated successfully.");

        document
            .getElementById("userModal")
            .style.display = "none";

        await loadUsers();

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});
// ======================================
// LIVE SEARCH USERS
// ======================================

const searchInput =
    document.getElementById("searchUsers");

if (searchInput) {

    searchInput.addEventListener("input", () => {

        const search =
            searchInput.value
            .trim()
            .toLowerCase();

        if (search === "") {

            displayUsers(allUsers);

            return;

        }

        const filteredUsers = allUsers.filter((user) => {

            return (

                (user.fullname || "")
                .toLowerCase()
                .includes(search)

                ||

                (user.username || "")
                .toLowerCase()
                .includes(search)

                ||

                (user.email || "")
                .toLowerCase()
                .includes(search)

                ||

                (user.phone || "")
                .toLowerCase()
                .includes(search)

            );

        });

        displayUsers(filteredUsers);

    });

}
