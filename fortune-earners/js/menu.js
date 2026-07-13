const menuButton = document.getElementById("menuButton");
const menu = document.getElementById("menu");
const overlay = document.getElementById("menuOverlay");

// Open / Close Menu
menuButton.addEventListener("click", function (e) {

    e.stopPropagation();

    menu.classList.toggle("active");
    overlay.classList.toggle("active");

});

// Close Menu
overlay.addEventListener("click", function () {

    menu.classList.remove("active");
    overlay.classList.remove("active");

});

// Prevent Closing
menu.addEventListener("click", function (e) {

    e.stopPropagation();

});

// Close after selecting menu item
const menuLinks = menu.querySelectorAll("a");

menuLinks.forEach(link => {

    link.addEventListener("click", () => {

        menu.classList.remove("active");
        overlay.classList.remove("active");

    });

});
