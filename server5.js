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

// Define schemas
const donorSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    age: Number,
    gender: String,
    bloodGroup: String,
    phoneNumber: String,
    email: String,
    address: String,
    disease: String
});

const bloodStockSchema = new mongoose.Schema({
    blood_type: String,
    quantity: Number
});

// Create models
const Donor = mongoose.model('Donor', donorSchema, 'donner');
const BloodStock = mongoose.model('BloodStock', bloodStockSchema, 'blood_stock');

// Get all pending donor requests
app.get('/api/donor-requests', async (req, res) => {
    try {
        const donors = await Donor.find();
        res.status(200).json(donors);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching donor requests', error: error.message });
    }
});

// Approve donor request and update blood stock
app.post('/api/approve-donor/:id', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Find the donor
        const donor = await Donor.findById(req.params.id);
        if (!donor) {
            throw new Error('Donor not found');
        }

        // Update blood stock
        const bloodStock = await BloodStock.findOne({ blood_type: donor.bloodGroup });
        if (!bloodStock) {
            throw new Error('Blood type not found in stock');
        }

        // Increment blood stock by 1 unit
        await BloodStock.findByIdAndUpdate(
            bloodStock._id,
            { $inc: { quantity: 1 } },
            { session }
        );

        // Remove donor from requests
        await Donor.findByIdAndDelete(req.params.id, { session });

        await session.commitTransaction();
        res.status(200).json({ message: 'Donor request approved and blood stock updated' });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: 'Error processing approval', error: error.message });
    } finally {
        session.endSession();
    }
});

// Serve the approval page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'donor-approval.html'));
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});