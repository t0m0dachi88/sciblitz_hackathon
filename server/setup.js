import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function setup() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ncdn_cip');
    console.log('MongoDB connected');

    const name = process.argv[2] || 'Admin';
    const email = process.argv[3] || 'admin@ncdn.gov';
    const password = process.argv[4] || 'admin123';

    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`User ${email} already exists`);
      await mongoose.disconnect();
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const hashed = bcrypt.hashSync(password, salt);
    await User.create({ name, email, password: hashed, role: 'admin' });
    console.log(`Admin user created: ${name} / ${email} / ${password}`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Setup failed:', err);
    process.exit(1);
  }
}

setup();
