import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User';
import config from './config';

async function seed() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB');

  const adminExists = await User.findOne({ email: 'admin@digitalheroes.com' });
  if (!adminExists) {
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@digitalheroes.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin',
    });
    console.log(`Admin created: admin@digitalheroes.com / admin123`);
  } else {
    console.log('Admin already exists');
  }

  const memberExists = await User.findOne({ email: 'member@digitalheroes.com' });
  if (!memberExists) {
    const member = await User.create({
      name: 'Member User',
      email: 'member@digitalheroes.com',
      password: await bcrypt.hash('member123', 10),
      role: 'member',
    });
    console.log(`Member created: member@digitalheroes.com / member123`);
  } else {
    console.log('Member already exists');
  }

  await mongoose.disconnect();
  console.log('Done');
}

seed().catch(console.error);