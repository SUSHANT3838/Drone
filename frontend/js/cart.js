// Cart page - uses cart-storage.js for shared cart

let deliveryAddress = null;

function updateCartDisplay() {
    const cart = getCart();
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const emptyCart = document.getElementById('empty-cart');
    const cartContent = document.getElementById('cart-content');

    if (!cartItems) return;

    cartItems.innerHTML = '';
    let totalAmount = 0;

    if (cart.length === 0) {
        if (emptyCart) emptyCart.style.display = 'block';
        if (cartContent) cartContent.style.display = 'none';
        return;
    }

    if (emptyCart) emptyCart.style.display = 'none';
    if (cartContent) cartContent.style.display = 'block';

    cart.forEach((item, index) => {
        const row = document.createElement('tr');
        const total = item.total || (item.price * (item.days || 1) * (item.quantity || 1));
        totalAmount += total;
        row.innerHTML = `
            <td>
                <div class="cart-product">
                    ${item.image ? `<img src="${item.image}" alt="${item.productName}" onerror="this.style.display='none'">` : ''}
                    <span>${item.productName || 'Drone'}</span>
                </div>
            </td>
            <td>₹${item.price}</td>
            <td>${item.quantity || 1}</td>
            <td>${item.days}</td>
            <td>₹${total}</td>
            <td><button class="btn-remove" onclick="removeFromCart(${index}); updateCartDisplay();"><i class="fas fa-trash"></i></button></td>
        `;
        cartItems.appendChild(row);
    });

    if (cartTotal) cartTotal.textContent = `Total: ₹${totalAmount}`;
}

function showCartStep() {
    document.getElementById('cart-step').style.display = 'block';
    document.getElementById('address-step').style.display = 'none';
    document.getElementById('payment-step').style.display = 'none';
    document.getElementById('success-step').style.display = 'none';
}

function showAddressStep() {
    if (getCart().length === 0) {
        alert('Your cart is empty!');
        return;
    }
    document.getElementById('cart-step').style.display = 'none';
    document.getElementById('address-step').style.display = 'block';
    document.getElementById('payment-step').style.display = 'none';
    document.getElementById('success-step').style.display = 'none';
}

function showPaymentStep() {
    document.getElementById('cart-step').style.display = 'none';
    document.getElementById('address-step').style.display = 'none';
    document.getElementById('payment-step').style.display = 'block';
    document.getElementById('success-step').style.display = 'none';
    const total = getCart().reduce((sum, item) => sum + (item.total || 0), 0);
    const paymentTotal = document.getElementById('payment-total');
    if (paymentTotal) paymentTotal.textContent = `₹${total}`;
    const addrDisplay = document.getElementById('address-display');
    if (addrDisplay && deliveryAddress) {
        addrDisplay.innerHTML = `
            <p><strong>Deliver to:</strong></p>
            <p>${deliveryAddress.fullName}<br>${deliveryAddress.address}<br>${deliveryAddress.city}, ${deliveryAddress.state} - ${deliveryAddress.pincode}<br>${deliveryAddress.phone}</p>
        `;
    }
}

function showSuccessStep() {
    document.getElementById('cart-step').style.display = 'none';
    document.getElementById('address-step').style.display = 'none';
    document.getElementById('payment-step').style.display = 'none';
    document.getElementById('success-step').style.display = 'block';
}

document.getElementById('address-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    deliveryAddress = {
        fullName: form.fullName.value,
        phone: form.phone.value,
        email: form.email.value,
        address: form.address.value,
        city: form.city.value,
        state: form.state.value,
        pincode: form.pincode.value,
        notes: form.notes.value
    };
    showPaymentStep();
});

function placeOrder() {
    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
    if (!paymentMethod) {
        alert('Please select a payment method');
        return;
    }
    if (!deliveryAddress) {
        alert('Please fill in your delivery address');
        return;
    }
    clearCart();
    showSuccessStep();
}

// Init
document.addEventListener('DOMContentLoaded', updateCartDisplay);
