const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const idCardRoutes = require('./routes/idCardRoutes');
const path = require('path');


dotenv.config();

const app = express();



// Middleware
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use(cors());

// DB Config
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

connectDB();


// here auth url config 
// After all middleware
app.use('/api/auth', authRoutes);
app.use('/api/idcards', idCardRoutes);



// Default Route
app.get('/', (req, res) => {
  res.send('ID Card Backend is Running ✅');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
