import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import testimonialRoutes from './routes/testimonialRoutes.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URI,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('join', (userId) => {
    console.log(`User ${userId} joined room`);
    socket.join(userId);
  });
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.set('io', io);
app.use(cors());
app.use(express.json());

// Health check endpoint to wake the server
app.get('/api/health', async (req, res) => {
  try {
    // Perform a lightweight database query to warm up the connection
    await mongoose.connection.db.admin().ping();
    res.status(200).json({ status: 'ok', message: 'Server is awake', timestamp: new Date() });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to wake server' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/testimonials', testimonialRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));