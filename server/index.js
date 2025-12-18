import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import connectCloudinary from './config/cloudinary.js';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';

// Load environment variables (only works locally, Vercel uses its own env system)
dotenv.config();

const app = express();

// Connect to database and Cloudinary (wrapped for serverless)
let isInitialized = false;
const initializeServices = async () => {
  if (!isInitialized) {
    await connectDB();
    connectCloudinary();
    isInitialized = true;
  }
};

// Initialize on first request (serverless-friendly)
app.use(async (req, res, next) => {
  try {
    await initializeServices();
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to connect to database'
    });
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'Event Platform API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB'
      });
    }
  }

  res.status(500).json({
    success: false,
    message: err.message || 'Something went wrong'
  });
});

const PORT = process.env.PORT || 5000;

// Only listen when running directly (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export app for Vercel serverless function
export default app;
