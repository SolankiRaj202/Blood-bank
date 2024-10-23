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
const receiverSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    address: String,
    phoneNumber: String,
    gender: String,
    bloodGroup: String,
    hospital: String,
    registrationDate: Date
});

const bloodStockSchema = new mongoose.Schema({
    blood_type: String,
    quantity: Number
});

// Create models
const Receiver = mongoose.model('Receiver', receiverSchema, 'receiver');
const BloodStock = mongoose.model('BloodStock', bloodStockSchema, 'blood_stock');

// Get all pending receiver requests
app.get('/api/receiver-requests', async (req, res) => {
    try {
        const receivers = await Receiver.find();
        res.status(200).json(receivers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching receiver requests', error: error.message });
    }
});

// Approve receiver request and update blood stock
app.post('/api/approve-receiver/:id', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Find the receiver
        const receiver = await Receiver.findById(req.params.id);
        if (!receiver) {
            throw new Error('Receiver not found');
        }

        // Update blood stock
        const bloodStock = await BloodStock.findOne({ blood_type: receiver.bloodGroup });
        if (!bloodStock) {
            throw new Error('Blood type not found in stock');
        }

        // Check if enough blood stock is available
        if (bloodStock.quantity < 1) {
            throw new Error('Insufficient blood stock');
        }

        // Decrement blood stock by 1 unit
        await BloodStock.findByIdAndUpdate(
            bloodStock._id,
            { $inc: { quantity: -1 } },
            { session }
        );

        // Remove receiver from requests
        await Receiver.findByIdAndDelete(req.params.id, { session });

        await session.commitTransaction();
        res.status(200).json({ message: 'Receiver request approved and blood stock updated' });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: 'Error processing approval', error: error.message });
    } finally {
        session.endSession();
    }
});

// Serve the approval page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'receiver-approval.html'));
});

const PORT = process.env.PORT || 3007;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});