const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware setup
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
const dbURI = 'mongodb+srv://rajsolanki:2024@cluster0.m9gm0.mongodb.net/blood_bank';

mongoose.connect(dbURI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
    .then(() => console.log('Connected to MongoDB: blood_bank'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Define schema for receivers
const receiverSchema = new mongoose.Schema({
    firstName: { 
        type: String, 
        required: true,
        minlength: 2,
        maxlength: 50
    },
    lastName: { 
        type: String, 
        required: true,
        minlength: 2,
        maxlength: 50
    },
    email: { 
        type: String, 
        required: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    address: { 
        type: String, 
        required: true,
        minlength: 5,
        maxlength: 100
    },
    phoneNumber: { 
        type: String, 
        required: true,
        match: /^[0-9]{10}$/
    },
    gender: { 
        type: String, 
        required: true,
        enum: ['Male', 'Female', 'Rather Not Say']
    },
    bloodGroup: { 
        type: String, 
        required: true,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    hospital: { 
        type: String, 
        required: true,
        enum: ['A HOSPITAL', 'B HOSPITAL', 'C HOSPITAL', 'D HOSPITAL']
    },
    registrationDate: {
        type: Date,
        default: Date.now
    }
});

// Create the Receiver model
const Receiver = mongoose.model('Receiver', receiverSchema, 'receiver');

// API endpoint to save receiver information
app.post('/api/receivers', async (req, res) => {
    try {
        const receiver = new Receiver(req.body);
        await receiver.save();
        res.status(201).json({ message: 'Receiver information saved successfully' });
    } catch (error) {
        console.error('Error saving receiver information:', error);
        res.status(500).json({ 
            message: 'Error saving receiver information', 
            error: error.message 
        });
    }
});

// Serve the receiver registration form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'receiver-registration.html'));
});

// Start the server
const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});