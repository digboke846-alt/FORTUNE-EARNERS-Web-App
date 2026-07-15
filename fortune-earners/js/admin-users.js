import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// ======================================
// CHECK ADMIN ACCESS
// ======================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }

    try {

        const adminRef =
            doc(db, "users", user.uid);

        const adminSnap =
            await getDoc(adminRef);

        if (!adminSnap.exists()) {

            alert("Admin account not found.");

            window.location.href =
                "dashboard.html";

            return;

        }

        const adminData =
            adminSnap.data();

        if (!adminData.isAdmin) {

            alert("Access denied.");

            window.location.href =
                "dashboard.html";

            return;

        }

        loadUsers();

    }

    catch(error){

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

        usersContainer.innerHTML =
            "<p>Loading users...</p>";

        const usersSnapshot =
            await getDocs(collection(db, "users"));

        usersContainer.innerHTML = "";

        if (usersSnapshot.empty) {

            usersContainer.innerHTML = `

                <div class="dashboard-card">

                    <h3>No Users Found</h3>

                </div>

            `;

            return;

        }

        usersSnapshot.forEach((userDoc) => {

            const user =
                userDoc.data();

            const status =
                user.memberStatus || "Pending Activation";

            const plan =
                user.plan || "Not Activated";

            const affiliateWallet =
                user.affiliateWallet || 0;

            const taskWallet =
                user.taskWallet || 0;

            const referrals =
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

                    <strong>Email:</strong>

                    ${user.email}

                </p>

                <p>

                    <strong>Phone:</strong>

                    ${user.phone}

                </p>

                <p>

                    <strong>Status:</strong>

                    ${status}

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

                    ${referrals}

                </p>

                <br>

                <button
                    onclick="viewUser('${userDoc.id}')">

                    👁 View

                </button>

            </div>

            `;

        });

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

}
// ======================================
// VIEW USER DETAILS
// ======================================

window.viewUser = async function(userId){

    try{

        const modal =
            document.getElementById("userModal");

        const userDetails =
            document.getElementById("userDetails");

        const userRef =
            doc(db, "users", userId);

        const userSnap =
            await getDoc(userRef);

        if(!userSnap.exists()){

            alert("User not found.");

            return;

        }

        const user =
            userSnap.data();
        selectedUserId = userId;

selectedUserData = user;

        userDetails.innerHTML = `

        <p><strong>Full Name:</strong>
        ${user.fullname}</p>

        <p><strong>Username:</strong>
        @${user.username}</p>

        <p><strong>Email:</strong>
        ${user.email}</p>

        <p><strong>Phone:</strong>
        ${user.phone}</p>

        <p><strong>Status:</strong>
        ${user.memberStatus || "Pending Activation"}</p>

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

if(user.memberStatus === "Suspended"){

    suspendBtn.style.display = "none";

    activateBtn.style.display = "inline-block";

}else{

    suspendBtn.style.display = "inline-block";

    activateBtn.style.display = "none";

}
        modal.style.display = "block";

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

}
// ======================================
// CLOSE MODAL
// ======================================

document
.getElementById("closeModal")
.onclick = function(){

    document
    .getElementById("userModal")
    .style.display = "none";

};

window.onclick = function(event){

    const modal =
        document.getElementById("userModal");

    if(event.target === modal){

        modal.style.display = "none";

    }

};
// ======================================
// CURRENTLY SELECTED USER
// ======================================

let selectedUserId = "";

let selectedUserData = {};
