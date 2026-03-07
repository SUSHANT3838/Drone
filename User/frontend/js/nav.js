// Shared nav - mobile menu toggle
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    if (mobileMenu && navMenu) {
        mobileMenu.addEventListener('click', () => navMenu.classList.toggle('active'));
    }
});
