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

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Validate user input
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPassword = (password) => typeof password === 'string' && password.length >= 6;

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

        res.status(200).json({ message: 'Login successful' });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Login failed' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});