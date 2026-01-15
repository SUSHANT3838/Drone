// Toggle Mobile Menu
const mobileMenu = document.getElementById('mobile-menu');
const navMenu = document.querySelector('.nav-menu');

mobileMenu.addEventListener('click', () => {
    // Toggle the class 'active' on the nav menu
    navMenu.classList.toggle('active');
    
    // Optional: Animate the hamburger bars
    mobileMenu.classList.toggle('is-active');
});

// Close menu when a link is clicked
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// Shopping Cart Interaction
function addToCart(productName) {
    // Simple alert for demonstration
    // In a real app, this would update a cart counter or database
    alert(`${productName} has been added to your cart!`);
    
    // Optional: Console log for debugging
    console.log(`Product added: ${productName}`);
}

// Scroll Effect for Header
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 50) {
        header.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
    } else {
        header.style.boxShadow = "0 5px 15px rgba(0,0,0,0.1)";
    }
});