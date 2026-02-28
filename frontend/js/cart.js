const cart = [];

function addToCart(productName, price) {
    const quantity = prompt(`Enter quantity for ${productName}:`);
    const days = prompt(`Enter rental duration (in days) for ${productName}:`);

    if (quantity > 0 && days > 0) {
        const total = price * quantity * days;
        cart.push({ productName, price, quantity, days, total });
        alert(`${productName} added to cart! Total: ₹${total}`);
        updateCartDisplay();
    } else {
        alert('Invalid input. Please enter valid quantity and days.');
    }
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    cartItems.innerHTML = '';
    let totalAmount = 0;

    cart.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.productName}</td>
            <td>₹${item.price}</td>
            <td>${item.quantity}</td>
            <td>${item.days}</td>
            <td>₹${item.total}</td>
            <td><button onclick="removeFromCart(${index})">Remove</button></td>
        `;
        cartItems.appendChild(row);
        totalAmount += item.total;
    });

    cartTotal.textContent = `Total: ₹${totalAmount}`;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartDisplay();
}

function proceedToPayment() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    const paymentMethod = prompt('Choose payment method: 1. Online 2. Cash on Delivery');

    if (paymentMethod === '1') {
        alert('Redirecting to online payment...');
    } else if (paymentMethod === '2') {
        alert('Order placed with Cash on Delivery option.');
    } else {
        alert('Invalid payment method selected.');
    }

    cart.length = 0;
    updateCartDisplay();
}