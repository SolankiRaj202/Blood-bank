const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware setup
app.use(bodyParser.json());
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection string pointing to the 'blood_bank' database
const dbURI = 'mongodb+srv://rajsolanki:2024@cluster0.m9gm0.mongodb.net/blood_bank';

// Connect to MongoDB with proper options
mongoose.connect(dbURI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
    .then(() => console.log('Connected to MongoDB: blood_bank'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Define schema for donors with validations
const donorSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    age: { type: Number, required: true, min: 18, max: 65 },
    gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
    bloodGroup: { 
        type: String, 
        required: true, 
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] 
    },
    phoneNumber: { type: String, required: true, match: /^[0-9]{10}$/ },
    email: { type: String, required: true },
    address: { type: String, required: true },
    disease: { type: String, default: 'None' }
});

// Create the 'Donor' model using the 'donor' collection
const Donor = mongoose.model('Donor', donorSchema, 'donner');

// API endpoint to save donor information
app.post('/api/donors', async (req, res) => {
    try {
        const donor = new Donor(req.body);
        await donor.save();
        res.status(201).json({ message: 'Donor information saved successfully' });
    } catch (error) {
        console.error('Error saving donor information:', error);
        res.status(500).json({ 
            message: 'Error saving donor information', 
            error: error.message 
        });
    }
});

// Serve the donor form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'don_form.html'));
});

// Start the server
const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
