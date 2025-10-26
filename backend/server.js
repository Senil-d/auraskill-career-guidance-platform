const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/userRoute');
const careerRoutes = require('./routes/careerRoute');
const problemSolvingAssessRoutes = require('./routes/problemSolvingAssess.route');

// Leadership assessment routes
const leadershipRoutes = require('./routes/leadership.route');

// // Leadership assessment routes
// const leadershipRoutes = require('./routes/leadership.route');


// Analytical assessment routes
const analyticalRoutes = require("./routes/analytical.route");

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));


// Common Routes
app.use('/api/auth', authRoutes);
app.use('/api/career', careerRoutes);


//Problem-solving routes
app.use('/api/problemsolving', problemSolvingAssessRoutes);
// Leadership assessment routes
app.use('/api/leadership', leadershipRoutes);

// Analytical assessment routes
app.use("/api/analytical", analyticalRoutes);

// Start server
const PORT = process.env.PORT || 5005;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

