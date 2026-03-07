const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;
const USERS_FILE = path.join(__dirname, 'users.json');
const USERS_FILE_TMP = path.join(__dirname, 'users.json.tmp');
const ORDERS_FILE = path.join(__dirname, 'orders.json');
const ORDERS_FILE_TMP = path.join(__dirname, 'orders.json.tmp');

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Validate user input
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPassword = (password) => typeof password === 'string' && password.length >= 6;
const isValidPhone = (phone) => /^[0-9]{10}$/.test(phone);

// Helper function to read users from file
const readUsers = () => {
    try {
        if (!fs.existsSync(USERS_FILE)) {
            return [];
        }
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        const users = JSON.parse(data);
        if (!Array.isArray(users)) {
            console.error('users.json is corrupted: expected array');
            return [];
        }
        return users;
    } catch (err) {
        console.error('Error reading users file:', err.message);
        return [];
    }
};

// Helper function to write users to file (atomic write)
const writeUsers = (users) => {
    if (!Array.isArray(users)) {
        throw new Error('users must be an array');
    }
    const json = JSON.stringify(users, null, 2);
    fs.writeFileSync(USERS_FILE_TMP, json, { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(USERS_FILE_TMP, USERS_FILE);
};

// Helper function to read orders from file
const readOrders = () => {
    try {
        if (!fs.existsSync(ORDERS_FILE)) {
            return [];
        }
        const data = fs.readFileSync(ORDERS_FILE, 'utf8');
        const orders = JSON.parse(data);
        if (!Array.isArray(orders)) {
            console.error('orders.json is corrupted: expected array');
            return [];
        }
        return orders;
    } catch (err) {
        console.error('Error reading orders file:', err.message);
        return [];
    }
};

// Helper function to write orders to file (atomic write)
const writeOrders = (orders) => {
    if (!Array.isArray(orders)) {
        throw new Error('orders must be an array');
    }
    const json = JSON.stringify(orders, null, 2);
    fs.writeFileSync(ORDERS_FILE_TMP, json, { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(ORDERS_FILE_TMP, ORDERS_FILE);
};

// Generate unique order ID
const generateOrderId = () => {
    return 'DRN' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
};

// Routes

// User registration
app.post('/register', async (req, res) => {
    try {
        let { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        email = String(email).trim().toLowerCase();
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        if (!isValidPassword(password)) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const users = readUsers();
        if (users.find(user => user.email === email)) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        users.push({ email, password: hashedPassword });
        writeUsers(users);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Failed to register user' });
    }
});

// User login
app.post('/login', async (req, res) => {
    try {
        let { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        email = String(email).trim().toLowerCase();

        const users = readUsers();
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        res.status(200).json({ message: 'Login successful', email: user.email });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Login failed' });
    }
});

// Create new order
app.post('/api/orders', async (req, res) => {
    try {
        const { items, address, paymentMethod, totals } = req.body;

        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Order must contain at least one item' });
        }
        if (!address || !address.fullName || !address.phone || !address.email || !address.address || !address.city || !address.state || !address.pincode) {
            return res.status(400).json({ message: 'Complete delivery address is required' });
        }
        if (!paymentMethod) {
            return res.status(400).json({ message: 'Payment method is required' });
        }

        // Validate phone and email
        if (!isValidPhone(address.phone)) {
            return res.status(400).json({ message: 'Invalid phone number' });
        }
        if (!isValidEmail(address.email)) {
            return res.status(400).json({ message: 'Invalid email address' });
        }

        const orders = readOrders();
        const newOrder = {
            orderId: generateOrderId(),
            items: items.map(item => ({
                productId: item.id,
                productName: item.productName,
                price: item.price,
                days: item.days,
                quantity: item.quantity,
                startDate: item.startDate,
                endDate: item.endDate,
                total: item.total
            })),
            address: {
                fullName: address.fullName,
                phone: address.phone,
                email: address.email,
                address: address.address,
                landmark: address.landmark || '',
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                notes: address.notes || ''
            },
            paymentMethod: paymentMethod,
            totals: totals || {},
            status: paymentMethod === 'cod' ? 'confirmed' : 'pending_payment',
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'completed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        orders.push(newOrder);
        writeOrders(orders);

        res.status(201).json({
            message: 'Order placed successfully',
            orderId: newOrder.orderId,
            order: newOrder
        });
    } catch (err) {
        console.error('Order creation error:', err);
        res.status(500).json({ message: 'Failed to create order' });
    }
});

// Get order by ID
app.get('/api/orders/:orderId', (req, res) => {
    try {
        const { orderId } = req.params;
        const orders = readOrders();
        const order = orders.find(o => o.orderId === orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json({ order });
    } catch (err) {
        console.error('Get order error:', err);
        res.status(500).json({ message: 'Failed to retrieve order' });
    }
});

// Get all orders (for admin - you should add authentication)
app.get('/api/orders', (req, res) => {
    try {
        const orders = readOrders();
        res.status(200).json({ orders });
    } catch (err) {
        console.error('Get orders error:', err);
        res.status(500).json({ message: 'Failed to retrieve orders' });
    }
});

// Update order status
app.patch('/api/orders/:orderId/status', (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, paymentStatus } = req.body;

        const orders = readOrders();
        const orderIndex = orders.findIndex(o => o.orderId === orderId);

        if (orderIndex === -1) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (status) {
            orders[orderIndex].status = status;
        }
        if (paymentStatus) {
            orders[orderIndex].paymentStatus = paymentStatus;
        }
        orders[orderIndex].updatedAt = new Date().toISOString();

        writeOrders(orders);

        res.status(200).json({
            message: 'Order updated successfully',
            order: orders[orderIndex]
        });
    } catch (err) {
        console.error('Update order error:', err);
        res.status(500).json({ message: 'Failed to update order' });
    }
});

// Get orders by email
app.get('/api/orders/user/:email', (req, res) => {
    try {
        const { email } = req.params;
        const orders = readOrders();
        const userOrders = orders.filter(o => o.address.email.toLowerCase() === email.toLowerCase());

        res.status(200).json({ orders: userOrders });
    } catch (err) {
        console.error('Get user orders error:', err);
        res.status(500).json({ message: 'Failed to retrieve orders' });
    }
});

// Cancel order
app.post('/api/orders/:orderId/cancel', (req, res) => {
    try {
        const { orderId } = req.params;
        const orders = readOrders();
        const orderIndex = orders.findIndex(o => o.orderId === orderId);

        if (orderIndex === -1) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = orders[orderIndex];

        // Check if order can be cancelled
        const cancellableStatuses = ['confirmed', 'pending_payment', 'processing'];
        if (!cancellableStatuses.includes(order.status)) {
            return res.status(400).json({ 
                message: `Order cannot be cancelled. Current status: ${order.status}` 
            });
        }

        // Update order status
        orders[orderIndex].status = 'cancelled';
        orders[orderIndex].cancelledAt = new Date().toISOString();
        orders[orderIndex].updatedAt = new Date().toISOString();

        writeOrders(orders);

        res.status(200).json({
            message: 'Order cancelled successfully',
            order: orders[orderIndex]
        });
    } catch (err) {
        console.error('Cancel order error:', err);
        res.status(500).json({ message: 'Failed to cancel order' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});