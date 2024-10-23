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

const bloodStockSchema = new mongoose.Schema({
    blood_type: { type: String, required: true },
    quantity: { type: Number, required: true }
});

// Create models
const Donor = mongoose.model('Donor', donorSchema, 'donner');
const Receiver = mongoose.model('Receiver', receiverSchema, 'receiver');
const BloodStock = mongoose.model('BloodStock', bloodStockSchema, 'blood_stock');

// Blood Stock Routes
app.get('/api/blood-stock', async (req, res) => {
    try {
        const bloodStock = await BloodStock.find();
        res.status(200).json(bloodStock);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching blood stock data', error });
    }
});

app.put('/api/blood-stock/:id', async (req, res) => {
    try {
        const { quantity } = req.body;
        const updatedStock = await BloodStock.findByIdAndUpdate(
            req.params.id,
            { quantity },
            { new: true }
        );
        res.status(200).json(updatedStock);
    } catch (error) {
        res.status(500).json({ message: 'Error updating blood stock', error });
    }
});

// Donor Routes
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

app.get('/api/donor-requests', async (req, res) => {
    try {
        const donors = await Donor.find();
        res.status(200).json(donors);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching donor requests', error: error.message });
    }
});

app.post('/api/approve-donor/:id', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const donor = await Donor.findById(req.params.id);
        if (!donor) {
            throw new Error('Donor not found');
        }

        const bloodStock = await BloodStock.findOne({ blood_type: donor.bloodGroup });
        if (!bloodStock) {
            throw new Error('Blood type not found in stock');
        }

        await BloodStock.findByIdAndUpdate(
            bloodStock._id,
            { $inc: { quantity: 1 } },
            { session }
        );

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

// Receiver Routes
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

app.get('/api/receiver-requests', async (req, res) => {
    try {
        const receivers = await Receiver.find();
        res.status(200).json(receivers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching receiver requests', error: error.message });
    }
});

app.post('/api/approve-receiver/:id', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const receiver = await Receiver.findById(req.params.id);
        if (!receiver) {
            throw new Error('Receiver not found');
        }

        const bloodStock = await BloodStock.findOne({ blood_type: receiver.bloodGroup });
        if (!bloodStock) {
            throw new Error('Blood type not found in stock');
        }

        if (bloodStock.quantity < 1) {
            throw new Error('Insufficient blood stock');
        }

        await BloodStock.findByIdAndUpdate(
            bloodStock._id,
            { $inc: { quantity: -1 } },
            { session }
        );

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

// Route handlers for serving HTML pages
app.get('/donor-registration', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'don_form.html'));
});

app.get('/receiver-registration', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'receiver-registration.html'));
});

app.get('/donor-approval', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'donor-approval.html'));
});

app.get('/receiver-approval', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'receiver-approval.html'));
});

// Default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3009;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});