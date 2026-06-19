import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import reportRoutes from './routes/reportRoutes.js';
import { connectDB } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve uploads directory statically
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/reports', reportRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'NCDN-CIP Backend is running' });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
