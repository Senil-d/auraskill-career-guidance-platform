const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/userRoute');
const leadershipAssessRoutes = require('./routes/leadershipAssess.route');
const careerRoutes = require('./routes/careerRoute');
const problemSolvingAssessRoutes = require('./routes/problemSolvingAssess.route');

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


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leadership', leadershipAssessRoutes);
app.use('/api/career', careerRoutes);


//Problem-solving routes
app.use('/problemsolving', problemSolvingAssessRoutes);

// Start server
const PORT = process.env.PORT || 5005;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

