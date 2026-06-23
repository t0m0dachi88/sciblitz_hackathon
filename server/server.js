import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import reportRoutes from './routes/reportRoutes.js';
import authRoutes from './routes/authRoutes.js';
import areaRoutes from './routes/areaRoutes.js';
import { connectDB } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not defined in .env');
  process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve uploads directory statically
app.use('/uploads', express.static('uploads'));

// API routes
app.use('/api/reports', reportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/areas', areaRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'UrbanEye Backend is running' });
});

// Serve built frontend
app.use(express.static('public'));
app.get('/{*path}', (req, res) => {
  res.sendFile(path.resolve('public', 'index.html'));
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
