import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dns from 'dns';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { Project } from '../models/Project.js';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    console.log('✅ Connected to MongoDB for seeding initial accounts');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password123!', salt);

    const initialUsers = [
      {
        name: 'Rahul Sharma',
        email: 'rahul.dev@example.com',
        password: hashedPassword,
        role: 'developer',
        title: 'Full Stack MERN Developer',
        about: 'Passionate MERN stack developer with 3+ years experience building scalable SaaS products.',
        skills: ['React', 'Node.js', 'Express', 'MongoDB', 'TypeScript'],
      },
      {
        name: 'Priya Patel',
        email: 'priya.dev@example.com',
        password: hashedPassword,
        role: 'developer',
        title: 'Frontend & UI/UX Specialist',
        about: 'UI/UX engineer specializing in React, Next.js, and modern responsive web design.',
        skills: ['React', 'Next.js', 'TailwindCSS', 'Redux', 'JavaScript'],
      },
      {
        name: 'Vikram Mehta',
        email: 'vikram.client@example.com',
        password: hashedPassword,
        role: 'client',
        title: 'Product Owner & Startup Founder',
        about: 'Founder of FinTech and EdTech startups hiring top freelance engineering talent.',
        skills: ['Product Management', 'Agile', 'Scrum'],
      },
      {
        name: 'Sneha Reddy',
        email: 'sneha.client@example.com',
        password: hashedPassword,
        role: 'client',
        title: 'E-Commerce Business Manager',
        about: 'Managing digital transformation projects and e-commerce platforms.',
        skills: ['E-Commerce', 'Project Management', 'Stripe'],
      },
    ];

    for (const userData of initialUsers) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = await User.create({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: userData.role,
        });

        await Profile.create({
          user: user._id,
          title: userData.title,
          about: userData.about,
          skills: userData.skills,
          contactEmail: userData.email,
        });

        console.log(`👤 Created ${userData.role} account: ${userData.email}`);
      } else {
        console.log(`ℹ️ Account already exists: ${userData.email}`);
      }
    }

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
};

seedUsers();
