const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(bodyParser.json());
app.use(cors());

const dbURI = 'mongodb+srv://rajsolanki:2024@cluster0.m9gm0.mongodb.net/blood_bank';

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.log('Error connecting to MongoDB:', err));

const bloodStockSchema = new mongoose.Schema({
    blood_type: { type: String, required: true },
    quantity: { type: Number, required: true }
});

const BloodStock = mongoose.model('BloodStock', bloodStockSchema, 'blood_stock');
// Get all blood stock
app.get('/api/blood-stock', async (req, res) => {
    try {
        const bloodStock = await BloodStock.find();
        res.status(200).json(bloodStock);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching blood stock data', error });
    }
});

// Update blood stock
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

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});