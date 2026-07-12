const menuButton = document.getElementById("menuButton");
const menu = document.getElementById("menu");

menu.style.display = "none";

menuButton.addEventListener("click", function () {
    if (menu.style.display === "none") {
        menu.style.display = "block";
    } else {
        menu.style.display = "none";
    }
});