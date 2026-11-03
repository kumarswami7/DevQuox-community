import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Post } from '../models/Post.js';
import { Project } from '../models/Project.js';
import { User } from '../models/User.js';

dotenv.config({ path: 'server/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  let devUser = await User.findOne({ role: { $in: ['developer', 'client'] } });
  if (!devUser) {
    devUser = await User.create({
      name: 'Kumara Swami',
      username: 'kumaraswami',
      email: 'kumaraswami@devconnect.io',
      password: 'Password123!',
      role: 'developer',
      status: 'active',
      headline: 'Full-Stack Developer & Innovator',
    });
  }

  // Check how many idea posts exist
  const existingIdeas = await Post.find({ postType: 'idea' });
  console.log('Current idea posts count:', existingIdeas.length);

  // If less than 2, create 2 rich Idea Posts
  if (existingIdeas.length < 2) {
    await Post.create([
      {
        author: devUser._id,
        postType: 'idea',
        title: 'AI Code Reviewer & Security Vulnerability Scanner for Pull Requests',
        content:
          'What if developers had an automated companion that comments line-by-line security and performance recommendations on GitHub pull requests before merging? Looking for community feedback on feasibility and what models work best.',
        tags: ['ai', 'devtools', 'security', 'github', 'saas'],
        ideaDetails: {
          targetAudience: 'Software engineering teams, open-source maintainers, and indie hackers',
          estimatedBudget: '$800 - $2,000',
          rolesNeeded: ['React / Vite Frontend', 'FastAPI / Python Engineer', 'DevOps / GitHub Apps Specialist'],
          feedbackQuestions: [
            'Would you connect this to your private GitHub repos?',
            'Should we use local Ollama models or Claude/Gemini API?',
            'What pricing would make sense for small teams?',
          ],
          status: 'seeking_feedback',
        },
        likes: [devUser._id],
        upvotes: 12,
        commentsCount: 5,
      },
      {
        author: devUser._id,
        postType: 'idea',
        title: 'Decentralized Micro-Bounty Marketplace for Open Source Issues',
        content:
          'A web platform where developers can stake small bounties ($20 - $250) on GitHub issues and contributors get paid instantly in stablecoins or Stripe once PR is merged. Pitching the concept to see if open source contributors would use this!',
        tags: ['web3', 'opensource', 'bounties', 'react', 'fintech'],
        ideaDetails: {
          targetAudience: 'Open-source contributors, project maintainers, and sponsors',
          estimatedBudget: '$1,200 - $3,500',
          rolesNeeded: ['Full-Stack MERN Developer', 'Solidity / Smart Contract Engineer', 'UI/UX Product Designer'],
          feedbackQuestions: [
            'How should dispute resolution work if maintainer rejects the PR?',
            'Is Stripe Connect better than crypto escrow for adoption?',
          ],
          status: 'seeking_feedback',
        },
        likes: [devUser._id],
        upvotes: 18,
        commentsCount: 8,
      },
    ]);
    console.log('Successfully seeded 2 rich idea posts!');
  }

  // Check project posts count
  const existingProjects = await Project.find({ status: { $ne: 'cancelled' } });
  console.log('Current projects count:', existingProjects.length);

  if (existingProjects.length < 2) {
    await Project.create([
      {
        title: 'Full-Stack Developer Community & Real-Time Collaboration Hub',
        description:
          'Building a real-time developer workspace with video huddles, interactive whiteboards, and role-based chat for technical project teams.',
        owner: devUser._id,
        category: 'Web Development',
        projectType: 'collaboration',
        teamSize: 4,
        budget: '$1,500',
        budgetMin: 500,
        budgetMax: 1500,
        currency: 'USD',
        status: 'open',
        requiredSkills: ['React', 'Node.js', 'Socket.IO', 'TailwindCSS'],
      },
      {
        title: 'AI Medical Document Classifier & HIPAA-Compliant Summarizer',
        description:
          'Engineering an on-premise medical records summarizer that parses patient EHR PDFs and generates clinician-friendly summaries.',
        owner: devUser._id,
        category: 'AI & ML',
        projectType: 'freelance',
        teamSize: 2,
        budget: '$3,000',
        budgetMin: 1500,
        budgetMax: 3000,
        currency: 'USD',
        status: 'open',
        requiredSkills: ['Python', 'FastAPI', 'LangChain', 'React'],
      },
    ]);
    console.log('Successfully seeded 2 rich projects!');
  }

  const allIdeas = await Post.find({ postType: 'idea' }).select('title').lean();
  const allProjs = await Project.find({ status: { $ne: 'cancelled' } }).select('title').lean();
  console.log('Ideas in DB:', allIdeas);
  console.log('Projects in DB:', allProjs);

  await mongoose.disconnect();
  console.log('Done!');
}

run().catch(console.error);

