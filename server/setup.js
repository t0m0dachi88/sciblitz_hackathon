import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function setup() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ncdn_cip');
    console.log('MongoDB connected');

    const email = process.argv[2] || 'admin@ncdn.gov';
    const password = process.argv[3] || 'admin123';

    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`User ${email} already exists`);
      await mongoose.disconnect();
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const hashed = bcrypt.hashSync(password, salt);
    await User.create({ email, password: hashed });
    console.log(`Admin user created: ${email} / ${password}`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Setup failed:', err);
    process.exit(1);
  }
}

setup();
