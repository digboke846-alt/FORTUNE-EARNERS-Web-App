const menuButton = document.getElementById("menuButton");
const menu = document.getElementById("menu");

// Toggle menu
menuButton.addEventListener("click", function (e) {

    e.stopPropagation();

    menu.classList.toggle("active");

});

// Close menu when clicking outside
document.addEventListener("click", function (e) {

    if (
        !menu.contains(e.target) &&
        !menuButton.contains(e.target)
    ) {

        menu.classList.remove("active");

    }

});

// Prevent closing when clicking inside menu
menu.addEventListener("click", function (e) {

    e.stopPropagation();

});
