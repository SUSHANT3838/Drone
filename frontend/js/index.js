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

// Shopping Cart and Booking System
const cart = [];

function addToCart(productName, pricePerDay) {
    const rentalDays = prompt(`How many days would you like to rent the ${productName}?`);
    if (rentalDays && !isNaN(rentalDays) && rentalDays > 0) {
        const totalCost = pricePerDay * rentalDays;
        cart.push({ productName, rentalDays, totalCost });
        alert(`${productName} has been added to your cart for ${rentalDays} days. Total: ₹${totalCost}`);
        console.log(`Product added: ${productName}, Days: ${rentalDays}, Total: ₹${totalCost}`);
    } else {
        alert('Invalid input. Please enter a valid number of days.');
    }
}

function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    let receipt = '--- Rental Receipt ---\n';
    let grandTotal = 0;

    cart.forEach((item, index) => {
        receipt += `${index + 1}. ${item.productName} - ${item.rentalDays} days - ₹${item.totalCost}\n`;
        grandTotal += item.totalCost;
    });

    receipt += `----------------------\nTotal: ₹${grandTotal}\nThank you for renting with us!`;

    alert(receipt);
    console.log(receipt);

    // Clear the cart after checkout
    cart.length = 0;
}

// Fetch and display dynamic drone products
async function fetchDroneProducts() {
    try {
        const userLocation = await getUserLocation();
        const response = await fetch(`https://api.example.com/drones?location=${userLocation}`);
        const drones = await response.json();

        const dynamicProductsContainer = document.getElementById('dynamic-products');
        dynamicProductsContainer.innerHTML = '';

        drones.forEach(drone => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');

            productCard.innerHTML = `
                <div class="card-image">
                    <img src="${drone.image}" alt="${drone.name}">
                </div>
                <div class="card-details">
                    <h3>${drone.name}</h3>
                    <p class="price">₹${drone.price}/day</p>
                    <button class="add-to-cart" onclick="addToCart('${drone.name}', ${drone.price})">Rent Now</button>
                </div>
            `;

            dynamicProductsContainer.appendChild(productCard);
        });
    } catch (error) {
        console.error('Error fetching drone products:', error);
    }
}

// Get user location (mock implementation)
async function getUserLocation() {
    // In a real application, use geolocation API or IP-based location services
    return 'New York'; // Example location
}

// Call the fetch function on page load
window.addEventListener('load', fetchDroneProducts);

// Scroll Effect for Header
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 50) {
        header.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
    } else {
        header.style.boxShadow = "0 5px 15px rgba(0,0,0,0.1)";
    }
});