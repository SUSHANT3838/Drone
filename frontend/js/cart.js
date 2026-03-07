// Cart page - uses cart-storage.js for shared cart

let deliveryAddress = null;
let orderDetails = null;

// Calculate cart totals
function calculateTotals() {
    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => sum + (item.total || 0), 0);
    const deposit = Math.round(subtotal * 0.2); // 20% security deposit
    const tax = Math.round(subtotal * 0.18); // 18% GST
    const total = subtotal + deposit + tax;
    return { subtotal, deposit, tax, total };
}

function updateCartDisplay() {
    const cart = getCart();
    const cartItems = document.getElementById('cart-items');
    const emptyCart = document.getElementById('empty-cart');
    const cartContent = document.getElementById('cart-content');

    if (!cartItems) return;

    cartItems.innerHTML = '';

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
        
        // Format dates for display
        const startDate = item.startDate ? new Date(item.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
        const endDate = item.endDate ? new Date(item.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
        const dateRange = startDate && endDate ? `${startDate} - ${endDate}` : `${item.days} days`;
        
        row.innerHTML = `
            <td>
                <div class="cart-product">
                    ${item.image ? `<img src="${item.image}" alt="${item.productName}" onerror="this.style.display='none'">` : ''}
                    <div class="product-info">
                        <span class="product-name">${item.productName || 'Drone'}</span>
                    </div>
                </div>
            </td>
            <td>₹${item.price}/day</td>
            <td>
                <span class="rental-period">${dateRange}</span>
                <span class="days-count">(${item.days} days)</span>
            </td>
            <td>
                <div class="qty-control">
                    <button onclick="updateQuantity(${index}, -1)" class="qty-btn">-</button>
                    <span>${item.quantity || 1}</span>
                    <button onclick="updateQuantity(${index}, 1)" class="qty-btn">+</button>
                </div>
            </td>
            <td class="item-total">₹${total.toLocaleString()}</td>
            <td>
                <button class="btn-remove" onclick="removeFromCart(${index}); updateCartDisplay();">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        cartItems.appendChild(row);
    });

    // Update totals
    const { subtotal, deposit, tax, total } = calculateTotals();
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartDeposit = document.getElementById('cart-deposit');
    const cartTax = document.getElementById('cart-tax');
    const cartTotal = document.getElementById('cart-total');
    
    if (cartSubtotal) cartSubtotal.textContent = `₹${subtotal.toLocaleString()}`;
    if (cartDeposit) cartDeposit.textContent = `₹${deposit.toLocaleString()}`;
    if (cartTax) cartTax.textContent = `₹${tax.toLocaleString()}`;
    if (cartTotal) cartTotal.textContent = `₹${total.toLocaleString()}`;
    
    // Update cart badge
    const badge = document.getElementById('cart-count');
    if (badge) badge.textContent = getCartCount();
}

// Update quantity
function updateQuantity(index, change) {
    const cart = getCart();
    if (cart[index]) {
        const newQty = (cart[index].quantity || 1) + change;
        if (newQty >= 1 && newQty <= 10) {
            cart[index].quantity = newQty;
            cart[index].total = cart[index].price * cart[index].days * newQty;
            saveCart(cart);
            updateCartDisplay();
        }
    }
}

// Update progress bar
function updateProgress(step) {
    const steps = ['cart', 'address', 'payment', 'success'];
    const currentIndex = steps.indexOf(step);
    
    document.querySelectorAll('.progress-step').forEach((el, index) => {
        el.classList.remove('active', 'completed');
        if (index < currentIndex) {
            el.classList.add('completed');
        } else if (index === currentIndex) {
            el.classList.add('active');
        }
    });
}

function showCartStep() {
    document.getElementById('cart-step').style.display = 'block';
    document.getElementById('address-step').style.display = 'none';
    document.getElementById('payment-step').style.display = 'none';
    document.getElementById('success-step').style.display = 'none';
    updateProgress('cart');
}

function showAddressStep() {
    if (getCart().length === 0) {
        alert('Your cart is empty!');
        return;
    }
    // Check if user is logged in before proceeding to checkout
    if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
        if (typeof openLoginModal === 'function') {
            openLoginModal();
            setTimeout(() => {
                const loginError = document.getElementById('login-error');
                if (loginError) {
                    loginError.style.color = '#088178';
                    loginError.textContent = 'Please login or sign up to complete your order';
                }
            }, 100);
        } else {
            alert('Please login or sign up to complete your order');
        }
        return;
    }
    document.getElementById('cart-step').style.display = 'none';
    document.getElementById('address-step').style.display = 'block';
    document.getElementById('payment-step').style.display = 'none';
    document.getElementById('success-step').style.display = 'none';
    updateProgress('address');
    window.scrollTo(0, 0);
}

function showPaymentStep() {
    document.getElementById('cart-step').style.display = 'none';
    document.getElementById('address-step').style.display = 'none';
    document.getElementById('payment-step').style.display = 'block';
    document.getElementById('success-step').style.display = 'none';
    updateProgress('payment');
    
    const { subtotal, deposit, tax, total } = calculateTotals();
    
    // Update payment summary
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryDeposit = document.getElementById('summary-deposit');
    const summaryTax = document.getElementById('summary-tax');
    const paymentTotal = document.getElementById('payment-total');
    
    if (summarySubtotal) summarySubtotal.textContent = `₹${subtotal.toLocaleString()}`;
    if (summaryDeposit) summaryDeposit.textContent = `₹${deposit.toLocaleString()}`;
    if (summaryTax) summaryTax.textContent = `₹${tax.toLocaleString()}`;
    if (paymentTotal) paymentTotal.textContent = `₹${total.toLocaleString()}`;
    
    // Update order items summary
    const orderItemsSummary = document.getElementById('order-items-summary');
    if (orderItemsSummary) {
        const cart = getCart();
        orderItemsSummary.innerHTML = cart.map(item => `
            <div class="order-item">
                <span class="item-name">${item.productName} x${item.quantity || 1}</span>
                <span class="item-days">${item.days} days</span>
                <span class="item-price">₹${(item.total || 0).toLocaleString()}</span>
            </div>
        `).join('');
    }
    
    // Update address display
    const addrDisplay = document.getElementById('address-display');
    if (addrDisplay && deliveryAddress) {
        addrDisplay.innerHTML = `
            <h5><i class="fas fa-map-marker-alt"></i> Delivery Address</h5>
            <p>
                <strong>${deliveryAddress.fullName}</strong><br>
                ${deliveryAddress.address}${deliveryAddress.landmark ? ', ' + deliveryAddress.landmark : ''}<br>
                ${deliveryAddress.city}, ${deliveryAddress.state} - ${deliveryAddress.pincode}<br>
                <i class="fas fa-phone"></i> ${deliveryAddress.phone}<br>
                <i class="fas fa-envelope"></i> ${deliveryAddress.email}
            </p>
        `;
    }
    
    window.scrollTo(0, 0);
}

function showSuccessStep() {
    document.getElementById('cart-step').style.display = 'none';
    document.getElementById('address-step').style.display = 'none';
    document.getElementById('payment-step').style.display = 'none';
    document.getElementById('success-step').style.display = 'block';
    updateProgress('success');
    
    // Generate order ID
    const orderId = 'DRN' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
    const orderIdDisplay = document.getElementById('order-id-display');
    if (orderIdDisplay) orderIdDisplay.textContent = orderId;
    
    // Display order summary
    const successSummary = document.getElementById('success-order-summary');
    if (successSummary && orderDetails) {
        successSummary.innerHTML = `
            <div class="booking-info">
                <p><strong>Items:</strong> ${orderDetails.items.map(i => i.productName).join(', ')}</p>
                <p><strong>Total Amount:</strong> ₹${orderDetails.total.toLocaleString()}</p>
                <p><strong>Payment:</strong> ${orderDetails.paymentMethod}</p>
                <p><strong>Delivery To:</strong> ${orderDetails.address.fullName}, ${orderDetails.address.city}</p>
            </div>
        `;
    }
    
    window.scrollTo(0, 0);
}

// Payment method switching
function setupPaymentMethodHandlers() {
    const paymentOptions = document.querySelectorAll('input[name="payment"]');
    const sections = {
        upi: document.getElementById('upi-section'),
        card: document.getElementById('card-section'),
        netbanking: document.getElementById('netbanking-section'),
        cod: document.getElementById('cod-section')
    };
    
    paymentOptions.forEach(option => {
        option.addEventListener('change', () => {
            // Hide all sections
            Object.values(sections).forEach(section => {
                if (section) section.style.display = 'none';
            });
            
            // Show selected section
            const selectedSection = sections[option.value];
            if (selectedSection) selectedSection.style.display = 'block';
        });
    });
}

// Card number formatting
function setupCardFormatting() {
    const cardNumber = document.getElementById('card-number');
    const cardExpiry = document.getElementById('card-expiry');
    
    if (cardNumber) {
        cardNumber.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
            e.target.value = value.substring(0, 19);
        });
    }
    
    if (cardExpiry) {
        cardExpiry.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }
}

// Process payment
function processPayment() {
    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
    
    if (!paymentMethod) {
        alert('Please select a payment method');
        return;
    }
    
    if (!deliveryAddress) {
        alert('Please fill in your delivery address');
        showAddressStep();
        return;
    }
    
    // Validate payment details based on method
    if (paymentMethod === 'upi') {
        const upiId = document.getElementById('upi-id')?.value;
        if (!upiId || !upiId.includes('@')) {
            alert('Please enter a valid UPI ID');
            return;
        }
    } else if (paymentMethod === 'card') {
        const cardNumber = document.getElementById('card-number')?.value.replace(/\s/g, '');
        const cardExpiry = document.getElementById('card-expiry')?.value;
        const cardCvv = document.getElementById('card-cvv')?.value;
        const cardName = document.getElementById('card-name')?.value;
        
        if (!cardNumber || cardNumber.length < 16) {
            alert('Please enter a valid card number');
            return;
        }
        if (!cardExpiry || cardExpiry.length < 5) {
            alert('Please enter a valid expiry date');
            return;
        }
        if (!cardCvv || cardCvv.length < 3) {
            alert('Please enter a valid CVV');
            return;
        }
        if (!cardName) {
            alert('Please enter cardholder name');
            return;
        }
    } else if (paymentMethod === 'netbanking') {
        const bank = document.querySelector('input[name="bank"]:checked')?.value;
        if (!bank) {
            alert('Please select a bank');
            return;
        }
    }
    
    // Simulate payment processing
    const payButton = document.querySelector('.btn-pay');
    if (payButton) {
        payButton.disabled = true;
        payButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }
    
    // Store order details before clearing cart
    const cart = getCart();
    const { total } = calculateTotals();
    const paymentLabels = {
        upi: 'UPI Payment',
        card: 'Credit/Debit Card',
        netbanking: 'Net Banking',
        cod: 'Cash on Delivery'
    };
    
    orderDetails = {
        items: [...cart],
        total: total,
        paymentMethod: paymentLabels[paymentMethod],
        address: {...deliveryAddress}
    };
    
    // Simulate API call delay
    setTimeout(() => {
        clearCart();
        showSuccessStep();
    }, 2000);
}

// Address form submission
document.getElementById('address-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    deliveryAddress = {
        fullName: form.fullName.value,
        phone: form.phone.value,
        email: form.email.value,
        address: form.address.value,
        landmark: form.landmark?.value || '',
        city: form.city.value,
        state: form.state.value,
        pincode: form.pincode.value,
        notes: form.notes.value
    };
    showPaymentStep();
});

// Init
document.addEventListener('DOMContentLoaded', () => {
    updateCartDisplay();
    setupPaymentMethodHandlers();
    setupCardFormatting();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('step') === 'address' && getCart().length > 0) {
        showAddressStep();
    }
});
