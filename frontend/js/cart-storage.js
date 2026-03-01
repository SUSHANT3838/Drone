// Shared cart storage - persists across all pages via localStorage
const CART_KEY = 'drone_rental_cart';

function getCart() {
    try {
        const data = localStorage.getItem(CART_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(product) {
    const cart = getCart();
    const existing = cart.find(item => item.id === product.id && item.days === product.days);
    if (existing) {
        existing.quantity = (existing.quantity || 1) + (product.quantity || 1);
        existing.total = existing.price * existing.days * existing.quantity;
    } else {
        const qty = product.quantity || 1;
        cart.push({
            ...product,
            quantity: qty,
            total: (product.price || 0) * (product.days || 1) * qty
        });
    }
    saveCart(cart);
    return cart;
}

function removeFromCart(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    return cart;
}

function clearCart() {
    saveCart([]);
}

function getCartCount() {
    return getCart().reduce((sum, item) => sum + (item.quantity || 1), 0);
}
