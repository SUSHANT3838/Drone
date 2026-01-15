// --- Mobile Menu Toggle ---
const bar = document.getElementById('mobile-menu');
const nav = document.querySelector('.nav-menu');

if (bar) {
    bar.addEventListener('click', () => {
        nav.classList.toggle('active');
    });
}

// --- Product Filtering (For Products Page) ---
function filterProducts(category) {
    let cards = document.querySelectorAll('.product-card');
    
    cards.forEach(card => {
        // If category is 'all', show everything
        if (category === 'all') {
            card.style.display = 'block';
        } else {
            // Check if card has the matching category class
            if (card.getAttribute('data-category') === category) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        }
    });

    // Update active button style
    let buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active-btn');
    });
    // Note: To highlight the clicked button accurately, we'd typically pass 'this' 
    // but for simplicity, we focus on functionality here.
}

// --- Add to Cart Interaction ---
function addToCart(productName) {
    alert(productName + " added to cart!");
}

// --- Contact Form Submission ---
function submitForm(event) {
    event.preventDefault(); // Stop page reload
    alert("Thank you! Your message has been sent.");
    // Clear inputs
    event.target.reset();
}