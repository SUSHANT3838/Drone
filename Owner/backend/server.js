const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = 3001;

// Image upload directory - shared images folder
const IMAGES_DIR = path.join(__dirname, '../../images');
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Multer configuration for image uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, IMAGES_DIR);
    },
    filename: function(req, file, cb) {
        const uniqueName = 'drone-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function(req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed'));
    }
});

// File paths
const OWNERS_FILE = path.join(__dirname, 'owners.json');
const OWNERS_FILE_TMP = path.join(__dirname, 'owners.json.tmp');
const DRONES_FILE = path.join(__dirname, 'drones.json');
const DRONES_FILE_TMP = path.join(__dirname, 'drones.json.tmp');
const BOOKINGS_FILE = path.join(__dirname, 'bookings.json');
const BOOKINGS_FILE_TMP = path.join(__dirname, 'bookings.json.tmp');

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../frontend')));
// Serve images from shared images folder
app.use('/images', express.static(IMAGES_DIR));

// Validation helpers
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPassword = (password) => typeof password === 'string' && password.length >= 6;
const isValidPhone = (phone) => /^[0-9]{10}$/.test(phone);

// File helpers
const readJsonFile = (filePath) => {
    try {
        if (!fs.existsSync(filePath)) return [];
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data) || [];
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err.message);
        return [];
    }
};

const writeJsonFile = (filePath, tmpPath, data) => {
    const json = JSON.stringify(data, null, 2);
    fs.writeFileSync(tmpPath, json, { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(tmpPath, filePath);
};

// Generate unique ID
const generateId = (prefix) => {
    return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
};

// ============ IMAGE UPLOAD ROUTE ============

// Upload drone image
app.post('/api/upload-image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }
        const imagePath = '/images/' + req.file.filename;
        res.json({ message: 'Image uploaded successfully', imagePath: imagePath });
    } catch (err) {
        console.error('Image upload error:', err);
        res.status(500).json({ message: 'Failed to upload image' });
    }
});

// Get all drones (public API for User section)
app.get('/api/drones', (req, res) => {
    const drones = readJsonFile(DRONES_FILE);
    res.json(drones);
});

// ============ OWNER ROUTES ============

// Register owner
app.post('/register', async (req, res) => {
    try {
        let { name, email, phone, password } = req.body;
        
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

        const owners = readJsonFile(OWNERS_FILE);
        if (owners.find(o => o.email === email)) {
            return res.status(400).json({ message: 'Owner already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newOwner = {
            id: generateId('OWN'),
            name: name || '',
            email,
            phone: phone || '',
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        owners.push(newOwner);
        writeJsonFile(OWNERS_FILE, OWNERS_FILE_TMP, owners);

        res.status(201).json({ message: 'Owner registered successfully', ownerId: newOwner.id });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Failed to register' });
    }
});

// Login owner
app.post('/login', async (req, res) => {
    try {
        let { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        email = String(email).trim().toLowerCase();

        const owners = readJsonFile(OWNERS_FILE);
        const owner = owners.find(o => o.email === email);
        
        if (!owner) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, owner.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        res.status(200).json({ 
            message: 'Login successful', 
            ownerId: owner.id,
            email: owner.email,
            name: owner.name 
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Login failed' });
    }
});

// ============ DRONE ROUTES ============

// Get all drones for owner
app.get('/api/owner/drones', (req, res) => {
    const ownerId = req.query.ownerId;
    const drones = readJsonFile(DRONES_FILE);
    const ownerDrones = ownerId ? drones.filter(d => d.ownerId === ownerId) : drones;
    res.json(ownerDrones);
});

// Add new drone
app.post('/api/owner/drones', (req, res) => {
    try {
        const { ownerId, name, category, description, price, quantity, image, flightTime, payload, features } = req.body;

        if (!name || !category || !price) {
            return res.status(400).json({ message: 'Name, category, and price are required' });
        }

        const drones = readJsonFile(DRONES_FILE);
        const newDrone = {
            id: generateId('DRN'),
            ownerId: ownerId || 'default',
            name,
            category,
            description: description || '',
            price: parseInt(price),
            quantity: parseInt(quantity) || 1,
            image: image || '',
            flightTime: flightTime || '',
            payload: payload || '',
            features: features || '',
            status: 'available',
            rating: 0,
            totalRentals: 0,
            createdAt: new Date().toISOString()
        };

        drones.push(newDrone);
        writeJsonFile(DRONES_FILE, DRONES_FILE_TMP, drones);

        res.status(201).json({ message: 'Drone added successfully', drone: newDrone });
    } catch (err) {
        console.error('Add drone error:', err);
        res.status(500).json({ message: 'Failed to add drone' });
    }
});

// Update drone
app.put('/api/owner/drones/:id', (req, res) => {
    try {
        const droneId = req.params.id;
        const updates = req.body;

        const drones = readJsonFile(DRONES_FILE);
        const index = drones.findIndex(d => d.id === droneId);

        if (index === -1) {
            return res.status(404).json({ message: 'Drone not found' });
        }

        drones[index] = { ...drones[index], ...updates, updatedAt: new Date().toISOString() };
        writeJsonFile(DRONES_FILE, DRONES_FILE_TMP, drones);

        res.json({ message: 'Drone updated successfully', drone: drones[index] });
    } catch (err) {
        console.error('Update drone error:', err);
        res.status(500).json({ message: 'Failed to update drone' });
    }
});

// Delete drone
app.delete('/api/owner/drones/:id', (req, res) => {
    try {
        const droneId = req.params.id;
        let drones = readJsonFile(DRONES_FILE);
        const initialLength = drones.length;

        drones = drones.filter(d => d.id !== droneId);

        if (drones.length === initialLength) {
            return res.status(404).json({ message: 'Drone not found' });
        }

        writeJsonFile(DRONES_FILE, DRONES_FILE_TMP, drones);
        res.json({ message: 'Drone deleted successfully' });
    } catch (err) {
        console.error('Delete drone error:', err);
        res.status(500).json({ message: 'Failed to delete drone' });
    }
});

// ============ BOOKING ROUTES ============

// Get bookings for owner
app.get('/api/owner/bookings', (req, res) => {
    const ownerId = req.query.ownerId;
    const limit = parseInt(req.query.limit) || 100;
    
    const bookings = readJsonFile(BOOKINGS_FILE);
    let ownerBookings = ownerId ? bookings.filter(b => b.ownerId === ownerId) : bookings;
    ownerBookings = ownerBookings.slice(0, limit);
    
    res.json(ownerBookings);
});

// Update booking status
app.put('/api/owner/bookings/:id', (req, res) => {
    try {
        const bookingId = req.params.id;
        const { status } = req.body;

        const bookings = readJsonFile(BOOKINGS_FILE);
        const index = bookings.findIndex(b => b.orderId === bookingId);

        if (index === -1) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        bookings[index].status = status;
        bookings[index].updatedAt = new Date().toISOString();
        writeJsonFile(BOOKINGS_FILE, BOOKINGS_FILE_TMP, bookings);

        res.json({ message: 'Booking updated successfully', booking: bookings[index] });
    } catch (err) {
        console.error('Update booking error:', err);
        res.status(500).json({ message: 'Failed to update booking' });
    }
});

// ============ STATS ROUTES ============

// Get owner stats
app.get('/api/owner/stats', (req, res) => {
    const ownerId = req.query.ownerId;
    
    const drones = readJsonFile(DRONES_FILE);
    const bookings = readJsonFile(BOOKINGS_FILE);
    
    const ownerDrones = ownerId ? drones.filter(d => d.ownerId === ownerId) : drones;
    const ownerBookings = ownerId ? bookings.filter(b => b.ownerId === ownerId) : bookings;
    
    const activeBookings = ownerBookings.filter(b => ['confirmed', 'active'].includes(b.status)).length;
    const totalEarnings = ownerBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.amount || 0), 0);
    
    const avgRating = ownerDrones.length > 0 
        ? ownerDrones.reduce((sum, d) => sum + (d.rating || 0), 0) / ownerDrones.length 
        : 0;

    res.json({
        totalDrones: ownerDrones.length,
        activeBookings,
        totalEarnings,
        avgRating: avgRating.toFixed(1)
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Owner Portal server running on http://localhost:${PORT}`);
});
