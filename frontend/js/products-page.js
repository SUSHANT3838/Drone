// Products page - load drones and add to cart

function updateCartBadge() {
    const badge = document.getElementById('cart-count');
    if (badge) badge.textContent = getCartCount();
}

function addProductToCart(product) {
    const daysInput = prompt(`How many days would you like to rent the ${product.name}?`);
    const numDays = parseInt(daysInput, 10);
    if (daysInput && !isNaN(numDays) && numDays > 0) {
        const cartItem = {
            id: product.id,
            productName: product.name,
            price: product.price,
            image: product.image,
            days: numDays,
            quantity: 1,
            total: product.price * numDays
        };
        addToCart(cartItem);
        updateCartBadge();
        alert(`${product.name} added to cart for ${numDays} days. Total: ₹${cartItem.total}`);
    } else if (daysInput !== null) {
        alert('Please enter a valid number of days.');
    }
}

function loadProducts() {
    const grid = document.getElementById('product-grid');
    if (!grid || typeof DRONE_PRODUCTS === 'undefined') return;

    grid.innerHTML = DRONE_PRODUCTS.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" onerror="this.src='https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=300&fit=crop'">
            <div class="des">
                <span>${product.purpose}</span>
                <h5>${product.name}</h5>
                <div class="star">
                    <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                </div>
                <h4>₹${product.price}/day</h4>
            </div>
            <button class="cart-btn" data-product-id="${product.id}"><i class="fas fa-shopping-cart"></i></button>
        </div>
    `).join('');

    grid.querySelectorAll('[data-product-id]').forEach(btn => {
        btn.addEventListener('click', () => {
            const product = DRONE_PRODUCTS.find(p => p.id === btn.dataset.productId);
            if (product) addProductToCart(product);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCartBadge();
});
