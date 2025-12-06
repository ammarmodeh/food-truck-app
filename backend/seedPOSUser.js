import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import { dbConnect } from './config/db.js';

dotenv.config();

const seedPOSUser = async () => {
  try {
    await dbConnect();

    const username = 'pos_admin';
    const password = 'pos_password_123';

    const userExists = await User.findOne({ username });

    if (userExists) {
      console.log('POS User already exists');
      process.exit();
    }

    const user = new User({
      name: 'POS Admin',
      username,
      password,
      role: 'pos',
      isAdmin: false,
      phoneVerified: true // Bypass phone verification for POS user
    });

    await user.save();
    console.log('POS User created successfully');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);

    process.exit();
  } catch (error) {
    console.error('Error seeding POS user:', error);
    process.exit(1);
  }
};

seedPOSUser();
