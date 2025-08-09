require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const MedicalAid = require('./models/MedicalAid');
const TransportAid = require('./models/TransportAid');
const multer = require('multer');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

const upload = multer();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// Routes
app.post('/api/medical-aid', upload.none(), async (req, res) => {
    try {
        // Create medical aid request from form data
        const medicalAid = new MedicalAid({
            patientName: req.body.patientName,
            condition: req.body.condition,
            location: req.body.location,
            contactNumber: req.body.contactNumber,
            urgency: req.body.urgency,
            additionalInfo: req.body.additionalInfo
        });

        // Save to database
        await medicalAid.save();

        // Send response
        res.status(201).json({ 
            message: 'Medical aid request submitted successfully', 
            data: medicalAid 
        });
    } catch (error) {
        console.error('Server Error:', error);
        res.status(400).json({ 
            message: 'Error submitting medical aid request', 
            error: error.message 
        });
    }
});

// Get all medical aid requests
app.get('/api/medical-aid', async (req, res) => {
    try {
        const medicalAids = await MedicalAid.find().sort({ createdAt: -1 });
        res.json(medicalAids);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching medical aid requests', 
            error: error.message 
        });
    }
});

// Transport Aid Routes
app.post('/api/transport-aid', upload.none(), async (req, res) => {
    try {
        const transportAid = new TransportAid(req.body);
        await transportAid.save();
        res.status(201).json({ 
            message: 'Transport aid request submitted successfully', 
            data: transportAid 
        });
    } catch (error) {
        console.error('Server Error:', error);
        res.status(400).json({ 
            message: 'Error submitting transport aid request', 
            error: error.message 
        });
    }
});

app.get('/api/transport-aid', async (req, res) => {
    try {
        const transportAids = await TransportAid.find().sort({ createdAt: -1 });
        res.json(transportAids);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching transport aid requests', 
            error: error.message 
        });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
