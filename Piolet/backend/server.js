const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3002;

// Shared images folder
const IMAGES_DIR = path.join(__dirname, '../../images');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));
// Serve images from shared images folder
app.use('/images', express.static(IMAGES_DIR));

// Data files
const PILOTS_FILE = path.join(__dirname, 'pilots.json');
const MISSIONS_FILE = path.join(__dirname, 'missions.json');

// Helper functions
function readJSON(file) {
    try {
        const data = fs.readFileSync(file, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Routes

// Register pilot
app.post('/register', async (req, res) => {
    try {
        const { name, email, phone, license, password } = req.body;
        const pilots = readJSON(PILOTS_FILE);

        // Check if pilot exists
        if (pilots.find(p => p.email === email)) {
            return res.status(400).json({ message: 'Pilot already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new pilot
        const newPilot = {
            id: Date.now().toString(),
            name,
            email,
            phone: phone || '',
            license: license || '',
            password: hashedPassword,
            certifications: [],
            skills: [],
            bankDetails: {},
            availability: 'available',
            totalFlights: 0,
            flightHours: 0,
            rating: 0,
            createdAt: new Date().toISOString()
        };

        pilots.push(newPilot);
        writeJSON(PILOTS_FILE, pilots);

        res.status(201).json({ message: 'Pilot registered successfully', pilotId: newPilot.id });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Login pilot
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const pilots = readJSON(PILOTS_FILE);

        const pilot = pilots.find(p => p.email === email);
        if (!pilot) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, pilot.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        res.json({ message: 'Login successful', pilotId: pilot.id, name: pilot.name });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get pilot profile
app.get('/api/pilot/profile/:email', (req, res) => {
    const pilots = readJSON(PILOTS_FILE);
    const pilot = pilots.find(p => p.email === req.params.email);

    if (!pilot) {
        return res.status(404).json({ message: 'Pilot not found' });
    }

    const { password, ...pilotData } = pilot;
    res.json(pilotData);
});

// Update pilot profile
app.put('/api/pilot/profile/:email', async (req, res) => {
    try {
        const pilots = readJSON(PILOTS_FILE);
        const index = pilots.findIndex(p => p.email === req.params.email);

        if (index === -1) {
            return res.status(404).json({ message: 'Pilot not found' });
        }

        const updates = req.body;
        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 10);
        }

        pilots[index] = { ...pilots[index], ...updates };
        writeJSON(PILOTS_FILE, pilots);

        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get all missions for a pilot
app.get('/api/pilot/missions/:email', (req, res) => {
    const missions = readJSON(MISSIONS_FILE);
    const pilotMissions = missions.filter(m => m.pilotEmail === req.params.email);
    res.json(pilotMissions);
});

// Get mission by ID
app.get('/api/pilot/mission/:id', (req, res) => {
    const missions = readJSON(MISSIONS_FILE);
    const mission = missions.find(m => m.id === req.params.id);

    if (!mission) {
        return res.status(404).json({ message: 'Mission not found' });
    }

    res.json(mission);
});

// Update mission status
app.put('/api/pilot/mission/:id', (req, res) => {
    const missions = readJSON(MISSIONS_FILE);
    const index = missions.findIndex(m => m.id === req.params.id);

    if (index === -1) {
        return res.status(404).json({ message: 'Mission not found' });
    }

    missions[index] = { ...missions[index], ...req.body };
    writeJSON(MISSIONS_FILE, missions);

    res.json({ message: 'Mission updated successfully' });
});

// Accept mission
app.post('/api/pilot/mission/:id/accept', (req, res) => {
    const { email } = req.body;
    const missions = readJSON(MISSIONS_FILE);
    const index = missions.findIndex(m => m.id === req.params.id);

    if (index === -1) {
        return res.status(404).json({ message: 'Mission not found' });
    }

    missions[index].status = 'accepted';
    missions[index].pilotEmail = email;
    missions[index].acceptedAt = new Date().toISOString();
    writeJSON(MISSIONS_FILE, missions);

    res.json({ message: 'Mission accepted successfully' });
});

// Start mission
app.post('/api/pilot/mission/:id/start', (req, res) => {
    const missions = readJSON(MISSIONS_FILE);
    const index = missions.findIndex(m => m.id === req.params.id);

    if (index === -1) {
        return res.status(404).json({ message: 'Mission not found' });
    }

    missions[index].status = 'in-progress';
    missions[index].startedAt = new Date().toISOString();
    writeJSON(MISSIONS_FILE, missions);

    res.json({ message: 'Mission started successfully' });
});

// Complete mission
app.post('/api/pilot/mission/:id/complete', (req, res) => {
    const missions = readJSON(MISSIONS_FILE);
    const pilots = readJSON(PILOTS_FILE);
    const index = missions.findIndex(m => m.id === req.params.id);

    if (index === -1) {
        return res.status(404).json({ message: 'Mission not found' });
    }

    const mission = missions[index];
    mission.status = 'completed';
    mission.completedAt = new Date().toISOString();
    writeJSON(MISSIONS_FILE, missions);

    // Update pilot stats
    const pilotIndex = pilots.findIndex(p => p.email === mission.pilotEmail);
    if (pilotIndex !== -1) {
        pilots[pilotIndex].totalFlights = (pilots[pilotIndex].totalFlights || 0) + 1;
        pilots[pilotIndex].flightHours = (pilots[pilotIndex].flightHours || 0) + (mission.duration || 1);
        writeJSON(PILOTS_FILE, pilots);
    }

    res.json({ message: 'Mission completed successfully' });
});

// Get pilot schedule
app.get('/api/pilot/schedule/:email', (req, res) => {
    const missions = readJSON(MISSIONS_FILE);
    const schedule = missions.filter(m => 
        m.pilotEmail === req.params.email && 
        ['scheduled', 'accepted', 'in-progress'].includes(m.status)
    ).sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

    res.json(schedule);
});

// Get pilot stats
app.get('/api/pilot/stats/:email', (req, res) => {
    const pilots = readJSON(PILOTS_FILE);
    const missions = readJSON(MISSIONS_FILE);

    const pilot = pilots.find(p => p.email === req.params.email);
    if (!pilot) {
        return res.status(404).json({ message: 'Pilot not found' });
    }

    const pilotMissions = missions.filter(m => m.pilotEmail === req.params.email);
    const completedMissions = pilotMissions.filter(m => m.status === 'completed');
    const activeMissions = pilotMissions.filter(m => m.status === 'in-progress');
    const scheduledMissions = pilotMissions.filter(m => ['scheduled', 'accepted'].includes(m.status));

    // Calculate earnings
    const totalEarnings = completedMissions.reduce((sum, m) => sum + (m.pilotFee || 0), 0);
    const thisMonthEarnings = completedMissions
        .filter(m => new Date(m.completedAt).getMonth() === new Date().getMonth())
        .reduce((sum, m) => sum + (m.pilotFee || 0), 0);

    res.json({
        totalFlights: pilot.totalFlights || 0,
        flightHours: pilot.flightHours || 0,
        rating: pilot.rating || 0,
        totalEarnings,
        thisMonthEarnings,
        completedMissions: completedMissions.length,
        activeMissions: activeMissions.length,
        scheduledMissions: scheduledMissions.length,
        availability: pilot.availability || 'available'
    });
});

// Update pilot availability
app.put('/api/pilot/availability/:email', (req, res) => {
    const { availability } = req.body;
    const pilots = readJSON(PILOTS_FILE);
    const index = pilots.findIndex(p => p.email === req.params.email);

    if (index === -1) {
        return res.status(404).json({ message: 'Pilot not found' });
    }

    pilots[index].availability = availability;
    writeJSON(PILOTS_FILE, pilots);

    res.json({ message: 'Availability updated successfully' });
});

// Get available missions (not assigned)
app.get('/api/pilot/available-missions', (req, res) => {
    const missions = readJSON(MISSIONS_FILE);
    const available = missions.filter(m => m.status === 'pending' && !m.pilotEmail);
    res.json(available);
});

// Add certification
app.post('/api/pilot/certifications/:email', (req, res) => {
    const { certification } = req.body;
    const pilots = readJSON(PILOTS_FILE);
    const index = pilots.findIndex(p => p.email === req.params.email);

    if (index === -1) {
        return res.status(404).json({ message: 'Pilot not found' });
    }

    if (!pilots[index].certifications) {
        pilots[index].certifications = [];
    }
    pilots[index].certifications.push(certification);
    writeJSON(PILOTS_FILE, pilots);

    res.json({ message: 'Certification added successfully' });
});

// Update skills
app.put('/api/pilot/skills/:email', (req, res) => {
    const { skills } = req.body;
    const pilots = readJSON(PILOTS_FILE);
    const index = pilots.findIndex(p => p.email === req.params.email);

    if (index === -1) {
        return res.status(404).json({ message: 'Pilot not found' });
    }

    pilots[index].skills = skills;
    writeJSON(PILOTS_FILE, pilots);

    res.json({ message: 'Skills updated successfully' });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('*', (req, res) => {
    const filePath = path.join(__dirname, '../frontend', req.path);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Pilot Portal server running on http://localhost:${PORT}`);
});
