import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dns from 'dns';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { Project } from '../models/Project.js';
import { Application } from '../models/Application.js';
import { ProjectMember } from '../models/ProjectMember.js';
import { Task } from '../models/Task.js';
import { ProjectActivity } from '../models/ProjectActivity.js';
import { Community } from '../models/Community.js';
import { Post } from '../models/Post.js';
import { Skill } from '../models/Skill.js';
import { Reaction } from '../models/Reaction.js';
import { Comment } from '../models/Comment.js';
import { ProjectRepost } from '../models/ProjectRepost.js';
import { ProjectView } from '../models/ProjectView.js';
import { ProjectBookmark } from '../models/ProjectBookmark.js';

try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // Ignore DNS override errors
}

export const seedDatabaseWithRealData = async () => {
  console.log('🚀 [Seed] Beginning comprehensive MongoDB real-data synchronization...');

  const salt = await bcrypt.genSalt(10);
  const defaultPassword = await bcrypt.hash('Password123!', salt);

  const sampleEmails = [
    'vikram.client@example.com',
    'sneha.client@example.com',
    'rahul.dev@example.com',
    'priya.dev@example.com',
    'ananya.dev@example.com',
  ];

  // 1. Clean up old sample collections while preserving any custom registered users
  await Promise.allSettled([
    Reaction.deleteMany({ targetType: 'project' }),
    Comment.deleteMany({ project: { $ne: null } }),
    ProjectRepost.deleteMany({}),
    ProjectView.deleteMany({}),
    ProjectBookmark.deleteMany({}),
    Application.deleteMany({}),
    Task.deleteMany({}),
    ProjectMember.deleteMany({}),
    ProjectActivity.deleteMany({}),
    Project.deleteMany({}),
    Community.deleteMany({}),
    Post.deleteMany({}),
    Skill.deleteMany({}),
    Profile.deleteMany({}),
    User.deleteMany({ email: { $in: sampleEmails } }),
  ]);
  console.log('🧹 [Seed] Refreshed sample test records (custom users preserved)');

  // 2. Insert or Upsert Sample Users
  const usersToCreate = [
    {
      name: 'Vikram Mehta',
      username: 'vikram_founder',
      email: 'vikram.client@example.com',
      password: defaultPassword,
      role: 'client',
      headline: 'Founder & CEO @ FinFlow Technologies',
      bio: 'Serial entrepreneur scaling FinTech and SaaS products. Always looking for top-tier full-stack talent.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Sneha Reddy',
      username: 'sneha_product',
      email: 'sneha.client@example.com',
      password: defaultPassword,
      role: 'client',
      headline: 'VP of Engineering @ CloudScale Platforms',
      bio: 'Managing high-velocity cloud native platforms and microservices with enterprise SLAs.',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Rahul Sharma',
      username: 'rahul_architect',
      email: 'rahul.dev@example.com',
      password: defaultPassword,
      role: 'developer',
      headline: 'Full-Stack MERN & Cloud Architect',
      bio: '5+ years building high-concurrency Node.js, React, and MongoDB distributed architectures.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Priya Patel',
      username: 'priya_frontend',
      email: 'priya.dev@example.com',
      password: defaultPassword,
      role: 'developer',
      headline: 'Staff UI/UX & React Frontend Engineer',
      bio: 'Obsessed with fluid micro-interactions, responsive design systems, Next.js, and TypeScript.',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Ananya Iyer',
      username: 'ananya_aiml',
      email: 'ananya.dev@example.com',
      password: defaultPassword,
      role: 'developer',
      headline: 'Lead AI/ML & LangChain Engineer',
      bio: 'Specialized in production LLM architectures, RAG pipelines, Vector Databases, and PyTorch.',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    },
  ];

  const createdUsers = {};
  for (const u of usersToCreate) {
    let userDoc = await User.findOne({ email: u.email });
    if (!userDoc) {
      userDoc = await User.create(u);
    } else {
      userDoc.name = u.name;
      userDoc.role = u.role;
      userDoc.avatar = u.avatar;
      userDoc.headline = u.headline;
      userDoc.bio = u.bio;
      userDoc.password = u.password;
      await userDoc.save();
    }
    createdUsers[u.username] = userDoc;
    console.log(`👤 Seeded user: ${u.name} (${u.role})`);
  }

  // 3. Create Rich Profiles
  await Profile.create([
    {
      user: createdUsers.rahul_architect._id,
      title: 'Full-Stack MERN & Cloud Architect',
      about: '5+ years building high-concurrency Node.js, React, and MongoDB distributed architectures.',
      skills: ['React', 'Node.js', 'Express', 'MongoDB', 'TypeScript', 'AWS', 'Docker', 'GraphQL'],
      hourlyRate: 65,
      availability: 'available',
      rating: 4.95,
      github: 'https://github.com/rahul-dev-official',
      linkedin: 'https://linkedin.com/in/rahul-sharma-dev',
      portfolio: [
        {
          title: 'High-Scale Analytics Engine',
          description: 'Processed 5M daily telemetry events with MongoDB aggregation pipelines and Redis caching.',
          technologies: ['React', 'Node.js', 'MongoDB', 'Redis'],
          liveUrl: 'https://analytics-demo.devquox.com',
        },
      ],
      experience: [
        {
          company: 'HyperScale Cloud Labs',
          role: 'Lead Backend Engineer',
          period: '2023 - Present',
          description: 'Architected zero-downtime microservices serving 200k active users.',
        },
      ],
    },
    {
      user: createdUsers.priya_frontend._id,
      title: 'Staff UI/UX & React Frontend Engineer',
      about: 'Obsessed with fluid micro-interactions, responsive design systems, Next.js, and TypeScript.',
      skills: ['React', 'Next.js', 'TailwindCSS', 'TypeScript', 'Redux', 'Figma', 'Jest'],
      hourlyRate: 55,
      availability: 'available',
      rating: 5.0,
      github: 'https://github.com/priya-patel-design',
      linkedin: 'https://linkedin.com/in/priya-patel-ui',
      portfolio: [
        {
          title: 'Design System & Component Kit',
          description: 'Custom accessible design system with WCAG AAA contrast compliance.',
          technologies: ['React', 'TailwindCSS', 'Storybook'],
          liveUrl: 'https://designkit-demo.devquox.com',
        },
      ],
    },
    {
      user: createdUsers.ananya_aiml._id,
      title: 'Lead AI/ML & LangChain Engineer',
      about: 'Specialized in production LLM architectures, RAG pipelines, Vector Databases, and PyTorch.',
      skills: ['Python', 'FastAPI', 'LangChain', 'OpenAI', 'Pinecone', 'PyTorch', 'React'],
      hourlyRate: 80,
      availability: 'available',
      rating: 4.98,
      github: 'https://github.com/ananya-ai',
      linkedin: 'https://linkedin.com/in/ananya-iyer-ai',
    },
    {
      user: createdUsers.vikram_founder._id,
      title: 'Founder & CEO @ FinFlow Technologies',
      about: 'Serial entrepreneur scaling FinTech and SaaS products. Always looking for top-tier full-stack talent.',
      skills: ['FinTech', 'Product Strategy', 'SaaS', 'MERN Stack', 'System Design'],
      hourlyRate: 0,
      availability: 'available',
      rating: 4.9,
    },
    {
      user: createdUsers.sneha_product._id,
      title: 'VP of Engineering @ CloudScale Platforms',
      about: 'Managing high-velocity cloud native platforms and microservices with enterprise SLAs.',
      skills: ['Cloud Architecture', 'Kubernetes', 'AWS', 'Microservices', 'Engineering Management'],
      hourlyRate: 0,
      availability: 'available',
      rating: 4.95,
    },
  ]);
  console.log('✨ [Seed] Created verified developer profiles with showcase portfolios');

  // 4. Create Real Projects
  const projectsData = [
    {
      owner: createdUsers.vikram_founder._id,
      title: 'Enterprise AI-Powered Analytics Dashboard',
      description: 'Building an enterprise-grade analytics dashboard with interactive visualization, real-time KPI streaming, team permissions, and MongoDB Atlas aggregations.',
      category: 'Web Development',
      projectType: 'freelance',
      experienceLevel: 'expert',
      teamSize: 3,
      budget: 'Community Project',
      budgetMin: 0,
      budgetMax: 12000,
      currency: 'USD',
      duration: '2 - 3 Months',
      commitment: 'part_time',
      visibility: 'public',
      status: 'open',
      requiredSkills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'TailwindCSS'],
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
    {
      owner: createdUsers.vikram_founder._id,
      title: 'Next-Gen Decentralized Escrow & Crypto Payment Gateway',
      description: 'Milestone escrow protocol ensuring zero-fraud transactions between global freelancers and clients, featuring automated smart contract releases and webhook alerts.',
      category: 'FinTech',
      projectType: 'freelance',
      experienceLevel: 'expert',
      teamSize: 2,
      budget: 'Community Project',
      budgetMin: 0,
      budgetMax: 15000,
      currency: 'USD',
      duration: '3 Months',
      commitment: 'full_time',
      visibility: 'public',
      status: 'open',
      requiredSkills: ['TypeScript', 'Node.js', 'Security', 'React', 'MongoDB'],
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
    {
      owner: createdUsers.sneha_product._id,
      title: 'Real-Time Conversational AI Agent for Customer Support',
      description: 'Autonomous customer support agent leveraging LangChain RAG pipelines, FastAPI microservices, and live WebSocket streaming chat integrated with web apps.',
      category: 'AI & ML',
      projectType: 'collaboration',
      experienceLevel: 'expert',
      teamSize: 3,
      budget: 'Community Project',
      budgetMin: 0,
      budgetMax: 18000,
      currency: 'USD',
      duration: '2 Months',
      commitment: 'full_time',
      visibility: 'public',
      status: 'open',
      requiredSkills: ['Python', 'FastAPI', 'LangChain', 'OpenAI', 'React'],
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
    {
      owner: createdUsers.sneha_product._id,
      title: 'Kubernetes Cloud Migration & CI/CD Pipeline Automation',
      description: 'Dockerize monolithic microservices and architect multi-region Kubernetes clusters on AWS with automated GitHub Actions CI/CD pipelines and Prometheus monitoring.',
      category: 'Cloud & DevOps',
      projectType: 'freelance',
      experienceLevel: 'intermediate',
      teamSize: 2,
      budget: 'Community Project',
      budgetMin: 0,
      budgetMax: 9500,
      currency: 'USD',
      duration: '1 - 2 Months',
      commitment: 'flexible',
      visibility: 'public',
      status: 'open',
      requiredSkills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Terraform'],
      deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    },
    {
      owner: createdUsers.vikram_founder._id,
      title: 'Cross-Platform Telehealth & Patient Consultation App',
      description: 'HIPAA-compliant React Native mobile application for on-demand doctor consultations, prescription delivery, encrypted WebRTC video calls, and instant appointment booking.',
      category: 'Mobile Development',
      projectType: 'freelance',
      experienceLevel: 'expert',
      teamSize: 4,
      budget: 'Community Project',
      budgetMin: 0,
      budgetMax: 0,
      currency: 'USD',
      duration: '3 - 4 Months',
      commitment: 'full_time',
      visibility: 'public',
      status: 'open',
      requiredSkills: ['React Native', 'Node.js', 'WebRTC', 'MongoDB', 'TypeScript'],
      deadline: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
    },
    {
      owner: createdUsers.vikram_founder._id,
      title: 'B2B Multi-Tenant SaaS Billing & Subscription Engine',
      description: 'Complete subscription management platform with tiered seats, automated recurring invoicing via Stripe, webhook idempotency, and audit trails.',
      category: 'Web Development',
      projectType: 'collaboration',
      experienceLevel: 'intermediate',
      teamSize: 2,
      budget: 'Community Project',
      budgetMin: 0,
      budgetMax: 0,
      currency: 'USD',
      duration: '1 Month',
      commitment: 'part_time',
      visibility: 'public',
      status: 'in_progress',
      requiredSkills: ['React', 'Node.js', 'Stripe', 'MongoDB', 'Express'],
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  ];

  const createdProjects = [];
  for (const p of projectsData) {
    const projDoc = await Project.create(p);
    createdProjects.push(projDoc);
    console.log(`📁 Created project: ${p.title} (${p.category})`);
  }

  // 5. Create Real Applications
  const projAnalytics = createdProjects[0];
  const projAI = createdProjects[2];
  const projCloud = createdProjects[3];

  await Application.create([
    {
      project: projAnalytics._id,
      applicant: createdUsers.rahul_architect._id,
      proposedRate: '$65/hr',
      coverLetter: 'Hi Vikram! I have 4+ years of expertise architecting high-performance React and Node.js dashboards with MongoDB aggregation pipelines. I can build the analytics streaming and team permissions flawlessly.',
      status: 'pending',
    },
    {
      project: projAnalytics._id,
      applicant: createdUsers.priya_frontend._id,
      proposedRate: '$55/hr',
      coverLetter: 'Hi Vikram, I reviewed your requirements and would love to craft the glassmorphism frontend dashboard. I specialize in TailwindCSS, responsive chart components, and WCAG accessibility.',
      status: 'accepted',
      reviewedAt: new Date(),
      reviewedBy: createdUsers.vikram_founder._id,
    },
    {
      project: projAI._id,
      applicant: createdUsers.ananya_aiml._id,
      proposedRate: '$80/hr',
      coverLetter: 'Hello Sneha! Building enterprise RAG systems is my core expertise. I have built production LangChain and FastAPI microservices with Pinecone vector search for Fortune 500 teams.',
      status: 'accepted',
      reviewedAt: new Date(),
      reviewedBy: createdUsers.sneha_product._id,
    },
    {
      project: projCloud._id,
      applicant: createdUsers.rahul_architect._id,
      proposedRate: '$70/hr',
      coverLetter: 'Hi Sneha, I have set up automated AWS EKS clusters and Terraform scripts for 10+ startups. Ready to execute the cloud migration with zero downtime.',
      status: 'pending',
    },
  ]);
  console.log('📋 [Seed] Seeded authentic proposals & applications pipeline');

  // 6. Create Workspace Memberships
  await ProjectMember.create([
    {
      project: projAnalytics._id,
      user: createdUsers.vikram_founder._id,
      role: 'owner',
      status: 'active',
      joinedAt: new Date(),
    },
    {
      project: projAnalytics._id,
      user: createdUsers.priya_frontend._id,
      role: 'member',
      status: 'active',
      joinedAt: new Date(),
    },
    {
      project: projAI._id,
      user: createdUsers.sneha_product._id,
      role: 'owner',
      status: 'active',
      joinedAt: new Date(),
    },
    {
      project: projAI._id,
      user: createdUsers.ananya_aiml._id,
      role: 'member',
      status: 'active',
      joinedAt: new Date(),
    },
  ]);

  // 7. Create Sprint Tasks
  await Task.create([
    {
      project: projAnalytics._id,
      creator: createdUsers.vikram_founder._id,
      assignees: [createdUsers.priya_frontend._id],
      title: 'Design glassmorphism dashboard UI components & theme tokens',
      description: 'Implement dark/light glass card components with TailwindCSS and responsive KPI grids.',
      status: 'completed',
      priority: 'high',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
    {
      project: projAnalytics._id,
      creator: createdUsers.vikram_founder._id,
      assignees: [createdUsers.priya_frontend._id, createdUsers.rahul_architect._id],
      title: 'Setup MongoDB Atlas aggregation pipeline for real-time telemetry',
      description: 'Write optimized MongoDB pipeline for computing category distribution, weekly velocity, and project status counts.',
      status: 'in_progress',
      priority: 'urgent',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
    {
      project: projAnalytics._id,
      creator: createdUsers.vikram_founder._id,
      assignees: [createdUsers.rahul_architect._id],
      title: 'Configure automated end-to-end integration test suite',
      description: 'Write Jest and Supertest suites for auth tokens, rate limits, and project status transitions.',
      status: 'todo',
      priority: 'medium',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
    {
      project: projAI._id,
      creator: createdUsers.sneha_product._id,
      assignees: [createdUsers.ananya_aiml._id],
      title: 'Implement LangChain RAG vector retrieval pipeline with Pinecone',
      description: 'Embed domain knowledge documents and connect to FastAPI streaming endpoint.',
      status: 'in_progress',
      priority: 'urgent',
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    },
    {
      project: projAI._id,
      creator: createdUsers.sneha_product._id,
      assignees: [createdUsers.ananya_aiml._id],
      title: 'WebSocket streaming chat response architecture',
      description: 'Provide low-latency token streaming for live client conversations.',
      status: 'completed',
      priority: 'high',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
  ]);
  console.log('📌 [Seed] Seeded sprint tasks & deadlines');

  // 8. Create Project Activity Trail
  await ProjectActivity.create([
    {
      project: projAnalytics._id,
      user: createdUsers.vikram_founder._id,
      action: 'project_created',
      details: { title: projAnalytics.title },
    },
    {
      project: projAnalytics._id,
      user: createdUsers.priya_frontend._id,
      action: 'application_accepted',
      details: { role: 'Frontend Engineer' },
    },
    {
      project: projAnalytics._id,
      user: createdUsers.priya_frontend._id,
      action: 'task_status_changed',
      details: { task: 'Design glassmorphism dashboard UI components', newStatus: 'completed' },
    },
    {
      project: projAI._id,
      user: createdUsers.sneha_product._id,
      action: 'project_created',
      details: { title: projAI.title },
    },
    {
      project: projAI._id,
      user: createdUsers.ananya_aiml._id,
      action: 'application_accepted',
      details: { role: 'AI Engineer' },
    },
  ]);
  console.log('📜 [Seed] Seeded project activity stream');

  // 9. Seed Project Engagement Data (Reactions, Threaded Comments, Reposts, Views, Bookmarks)
  console.log('⚡ [Seed] Seeding rich project feed engagement (reactions, comments, reposts, views)...');

  const [projAnalyticsDoc, projEscrowDoc, projAIDoc, projCloudDoc, projTelehealthDoc, projBillingDoc] = createdProjects;

  // 9A. Reactions
  const reactionsData = [
    // projAnalytics
    { userId: createdUsers.rahul_architect._id, targetType: 'project', targetId: projAnalyticsDoc._id, reactionType: 'celebrate' },
    { userId: createdUsers.priya_frontend._id, targetType: 'project', targetId: projAnalyticsDoc._id, reactionType: 'insightful' },
    { userId: createdUsers.ananya_aiml._id, targetType: 'project', targetId: projAnalyticsDoc._id, reactionType: 'like' },
    { userId: createdUsers.sneha_product._id, targetType: 'project', targetId: projAnalyticsDoc._id, reactionType: 'support' },

    // projEscrow
    { userId: createdUsers.rahul_architect._id, targetType: 'project', targetId: projEscrowDoc._id, reactionType: 'curious' },
    { userId: createdUsers.sneha_product._id, targetType: 'project', targetId: projEscrowDoc._id, reactionType: 'support' },
    { userId: createdUsers.priya_frontend._id, targetType: 'project', targetId: projEscrowDoc._id, reactionType: 'like' },

    // projAI
    { userId: createdUsers.rahul_architect._id, targetType: 'project', targetId: projAIDoc._id, reactionType: 'like' },
    { userId: createdUsers.priya_frontend._id, targetType: 'project', targetId: projAIDoc._id, reactionType: 'celebrate' },
    { userId: createdUsers.ananya_aiml._id, targetType: 'project', targetId: projAIDoc._id, reactionType: 'insightful' },
    { userId: createdUsers.vikram_founder._id, targetType: 'project', targetId: projAIDoc._id, reactionType: 'support' },

    // projCloud
    { userId: createdUsers.rahul_architect._id, targetType: 'project', targetId: projCloudDoc._id, reactionType: 'support' },
    { userId: createdUsers.ananya_aiml._id, targetType: 'project', targetId: projCloudDoc._id, reactionType: 'like' },
    { userId: createdUsers.priya_frontend._id, targetType: 'project', targetId: projCloudDoc._id, reactionType: 'curious' },

    // projTelehealth
    { userId: createdUsers.priya_frontend._id, targetType: 'project', targetId: projTelehealthDoc._id, reactionType: 'celebrate' },
    { userId: createdUsers.sneha_product._id, targetType: 'project', targetId: projTelehealthDoc._id, reactionType: 'like' },
    { userId: createdUsers.rahul_architect._id, targetType: 'project', targetId: projTelehealthDoc._id, reactionType: 'support' },

    // projBilling
    { userId: createdUsers.sneha_product._id, targetType: 'project', targetId: projBillingDoc._id, reactionType: 'insightful' },
    { userId: createdUsers.priya_frontend._id, targetType: 'project', targetId: projBillingDoc._id, reactionType: 'like' },
  ];
  await Reaction.insertMany(reactionsData);

  // 9B. Threaded Comments & Replies
  const c1 = await Comment.create({
    project: projAnalyticsDoc._id,
    author: createdUsers.rahul_architect._id,
    content: 'What specific charting libraries are preferred for this dashboard? We achieved sub-50ms latency using lightweight Canvas renders alongside Recharts in a past project.',
  });

  await Comment.create([
    {
      project: projAnalyticsDoc._id,
      author: createdUsers.vikram_founder._id,
      parentComment: c1._id,
      content: 'Great question Rahul! We are open to Recharts or Tremor components, as long as it handles real-time WebSockets without unnecessary re-renders.',
    },
    {
      project: projAnalyticsDoc._id,
      author: createdUsers.priya_frontend._id,
      parentComment: c1._id,
      content: 'I have worked extensively with Recharts and TailwindCSS glass styling - excited to collaborate on this!',
    },
  ]);

  await Comment.create({
    project: projAnalyticsDoc._id,
    author: createdUsers.ananya_aiml._id,
    content: 'Impressive project scope! Looking forward to seeing the MongoDB aggregation telemetry in action.',
  });

  const c3 = await Comment.create({
    project: projAIDoc._id,
    author: createdUsers.ananya_aiml._id,
    content: 'FastAPI + LangChain streaming is a powerhouse combo. Are you utilizing Pinecone or pgvector for vector retrieval?',
  });

  await Comment.create({
    project: projAIDoc._id,
    author: createdUsers.sneha_product._id,
    parentComment: c3._id,
    content: 'We are currently evaluating Pinecone for managed serverless scaling, but open to your recommendation during architecture review.',
  });

  await Comment.create({
    project: projAIDoc._id,
    author: createdUsers.rahul_architect._id,
    content: 'Sounds like an awesome project Sneha! Let me know if you need help with WebSocket proxy routing.',
  });

  await Comment.create({
    project: projEscrowDoc._id,
    author: createdUsers.rahul_architect._id,
    content: 'Zero-fraud escrow protocol is crucial for Web3 and freelance contracts. Is this using EVM compatible smart contracts?',
  });

  await Comment.create({
    project: projTelehealthDoc._id,
    author: createdUsers.priya_frontend._id,
    content: 'HIPAA compliance and WebRTC video encryption is such an exciting challenge. The UI mockups look super clean.',
  });

  // 9C. Reposts & Quote Reposts
  await ProjectRepost.create([
    {
      user: createdUsers.rahul_architect._id,
      project: projAnalyticsDoc._id,
      commentary: 'Vikram and team are building a top-tier analytics platform. If you love high-throughput React & MongoDB architectures, definitely check this out!',
      isQuote: true,
    },
    {
      user: createdUsers.priya_frontend._id,
      project: projAIDoc._id,
      commentary: '',
      isQuote: false,
    },
    {
      user: createdUsers.sneha_product._id,
      project: projCloudDoc._id,
      commentary: 'Our cloud team is actively expanding. Looking for talented Kubernetes and Terraform engineers to lead this migration!',
      isQuote: true,
    },
  ]);

  // 9D. Bookmarks
  await ProjectBookmark.create([
    { user: createdUsers.rahul_architect._id, project: projAnalyticsDoc._id },
    { user: createdUsers.rahul_architect._id, project: projAIDoc._id },
    { user: createdUsers.rahul_architect._id, project: projCloudDoc._id },
    { user: createdUsers.priya_frontend._id, project: projAnalyticsDoc._id },
    { user: createdUsers.priya_frontend._id, project: projTelehealthDoc._id },
    { user: createdUsers.ananya_aiml._id, project: projAIDoc._id },
    { user: createdUsers.ananya_aiml._id, project: projEscrowDoc._id },
  ]);

  // 9E. Views
  const viewsToCreate = [];
  const testUsersList = Object.values(createdUsers);
  for (const proj of createdProjects) {
    // 3 to 5 authenticated views
    for (const u of testUsersList.slice(0, 4)) {
      viewsToCreate.push({ project: proj._id, viewer: u._id });
    }
    // 5 to 10 anonymous views
    for (let i = 0; i < 7; i++) {
      viewsToCreate.push({
        project: proj._id,
        sessionId: `seed_session_${proj._id.toString().slice(-4)}_${i}`,
        ipHash: `seed_ip_hash_${i}`,
      });
    }
  }
  await ProjectView.insertMany(viewsToCreate);

  // 9F. Sync Project Counter Aggregations
  for (const proj of createdProjects) {
    const reactions = await Reaction.find({ targetType: 'project', targetId: proj._id });
    const reactionBreakdown = { like: 0, celebrate: 0, support: 0, insightful: 0, curious: 0 };
    reactions.forEach((r) => {
      if (reactionBreakdown[r.reactionType] !== undefined) {
        reactionBreakdown[r.reactionType] += 1;
      }
    });

    const commentsCount = await Comment.countDocuments({ project: proj._id });
    const repostsCount = await ProjectRepost.countDocuments({ project: proj._id });
    const viewsCount = await ProjectView.countDocuments({ project: proj._id });
    const uniqueViewers = await ProjectView.distinct('viewer', { project: proj._id, viewer: { $ne: null } });
    const uniqueSessions = await ProjectView.distinct('sessionId', { project: proj._id, viewer: null });
    const uniqueViewsCount = uniqueViewers.length + uniqueSessions.length;

    await Project.findByIdAndUpdate(proj._id, {
      reactionsCount: reactions.length,
      reactionBreakdown,
      commentsCount,
      repostsCount,
      viewsCount,
      uniqueViewsCount,
    });
  }
  console.log('✅ [Seed] Project engagement synced (reactions, comments, reposts, bookmarks, views)');

  // 10. Create Active Communities & Posts
  const comm1 = await Community.create({
    name: 'Full Stack React & Node Engineers',
    description: 'Premier hub for modern full-stack engineers discussing scalable MERN stacks, state management, and cloud architecture.',
    category: 'Web Development',
    createdBy: createdUsers.rahul_architect._id,
  });

  const comm2 = await Community.create({
    name: 'AI & LLM Builders Network',
    description: 'Community for AI practitioners building production RAG systems, agents, and fine-tuned LLMs.',
    category: 'AI & ML',
    createdBy: createdUsers.ananya_aiml._id,
  });

  const comm3 = await Community.create({
    name: 'Cloud Architects & DevOps Elite',
    description: 'Best practices for Docker, Kubernetes, Terraform, and cloud-native infrastructure.',
    category: 'Cloud & DevOps',
    createdBy: createdUsers.sneha_product._id,
  });

  await Post.create([
    {
      community: comm2._id,
      author: createdUsers.ananya_aiml._id,
      title: 'AI Real-Time Mock Interview Coach with Live Speech & Emotion Feedback',
      content: 'I want to build an AI-powered technical and behavioral mock interview coach. It analyzes voice tone, filler words, speech clarity, and evaluates live coding problem solutions in real time.\n\nLooking for community input on latency tradeoffs between client-side WebAssembly models vs server-side streaming pipelines.',
      postType: 'idea',
      tags: ['idea', 'ai', 'webrtc', 'interview-prep'],
      ideaDetails: {
        targetAudience: 'Software engineers, college graduates, and bootcamp students preparing for FAANG & startup tech rounds',
        estimatedBudget: '$2,500 - $4,000',
        rolesNeeded: ['React Developer', 'AI/ML LangChain Engineer', 'WebRTC Specialist', 'UI/UX Designer'],
        feedbackQuestions: [
          'Would you prefer speech synthesis via ElevenLabs or local browser WebSpeech API for lowest latency?',
          'Should we support live collaborative whiteboard coding alongside the AI interview voice bot?',
          'What pricing model would developers find most fair: pay-per-mock-session or monthly subscription?'
        ],
        status: 'seeking_feedback',
      },
      upvotes: 47,
      commentsCount: 15,
    },
    {
      community: comm1._id,
      author: createdUsers.rahul_architect._id,
      title: 'Decentralized Micro-Bounty & Peer Code Review Exchange',
      content: 'A peer-to-peer developer platform where developers review each others pull requests, audit security vulnerabilities, and earn verified reputation tokens or crypto micro-bounties backed by smart contract escrow.\n\nSeeking thoughts on automated git webhook integration and anti-collusion review scoring.',
      postType: 'idea',
      tags: ['idea', 'codereview', 'github', 'opensource'],
      ideaDetails: {
        targetAudience: 'Solo indie founders, open-source maintainers, and security researchers seeking fast code review',
        estimatedBudget: '$1,800 - $3,000',
        rolesNeeded: ['Full-Stack MERN Developer', 'Solidity / Smart Contract Engineer', 'Security Auditor'],
        feedbackQuestions: [
          'How should reviewer peer reputation score be weighted against automated ESLint / SonarQube checks?',
          'Should reviews be blind/anonymous to eliminate seniority bias during approval?',
          'What is the ideal turnaround SLA: 2 hours, 12 hours, or 24 hours?'
        ],
        status: 'seeking_feedback',
      },
      upvotes: 52,
      commentsCount: 18,
    },
    {
      community: comm1._id,
      author: createdUsers.rahul_architect._id,
      title: 'How we scaled our MongoDB Aggregation Pipelines to 5M daily events',
      content: 'Here are the top 5 index optimizations and cursor tips we applied to achieve sub-50ms query latency on complex dashboard KPIs:\n\n1. Ensure compound indexes match the exact equality-sort-range (ESR) pattern.\n2. Always filter ($match) as the very first pipeline stage.\n3. Leverage $facet cautiously to avoid memory thresholds.\n4. Project only necessary keys to reduce network serialization.\n\nWhat are your go-to MongoDB performance tricks in production?',
      postType: 'article',
      tags: ['mongodb', 'nodejs', 'performance', 'architecture'],
      upvotes: 42,
      commentsCount: 9,
      isPinned: true,
    },
    {
      community: comm2._id,
      author: createdUsers.ananya_aiml._id,
      title: 'Architecting Production RAG with FastAPI & LangChain',
      content: 'A detailed breakdown of chunking strategies, hybrid vector search, and token streaming for enterprise customer support agents.\n\nKey takeaways:\n• Semantic chunking improves contextual accuracy by 35% compared to fixed-token splits.\n• Re-ranking with Cohere or cross-encoders filters out false positive retrieval chunks before LLM ingestion.\n• Streaming tokens via WebSockets gives an immediate perceived speed advantage to the user.',
      postType: 'showcase',
      tags: ['ai', 'langchain', 'python', 'fastapi'],
      upvotes: 56,
      commentsCount: 14,
    },
    {
      community: comm1._id,
      author: createdUsers.priya_frontend._id,
      title: '7 Micro-Interaction Rules for Glassmorphism & Modern React UIs',
      content: 'Clean design is not just about colors; it is about motion and feedback:\n\n1. Subtle borders (1px border-slate-200/80) define cards better than heavy box-shadows.\n2. Keep transition times under 200ms (duration-150 ease-out).\n3. Avoid layout shifts by reserving skeleton placeholders during data hydration.\n4. Micro-animations like button bounce give instant tactile response.\n\nCheck out the demo in our showcase section!',
      postType: 'article',
      tags: ['react', 'ui-ux', 'tailwindcss', 'frontend'],
      upvotes: 38,
      commentsCount: 7,
    },
    {
      community: comm3._id,
      author: createdUsers.sneha_product._id,
      title: 'Multi-Region Kubernetes deployment lessons: Zero downtime migration on AWS',
      content: 'We recently completed a migration of our core microservices cluster from a single AWS zone to a multi-region EKS topology.\n\nHighlights:\n• Used Terraform modules with state locking in S3 + DynamoDB.\n• Set up PodDisruptionBudgets and progressive rolling deployments.\n• Prometheus + Grafana dashboards alerted us on p99 latency spikes during the cutover.\n\nHappy to answer questions about cost optimization and container lifecycle management!',
      postType: 'showcase',
      tags: ['kubernetes', 'aws', 'devops', 'docker'],
      upvotes: 31,
      commentsCount: 5,
    },
    {
      community: comm1._id,
      author: createdUsers.rahul_architect._id,
      title: 'Discussion: Next.js 15 Server Actions vs Express REST for real-time dashboards',
      content: 'With Next.js App Router and Server Actions becoming mature, how is the community feeling about replacing traditional Express/Node backend APIs with direct server actions?\n\nFor real-time streaming, WebSockets still require a standalone Node or Socket.io gateway. What is your team’s preferred architectural split in 2026?',
      postType: 'question',
      tags: ['nextjs', 'react', 'express', 'web-dev'],
      upvotes: 27,
      commentsCount: 12,
    },
    {
      community: comm2._id,
      author: createdUsers.vikram_founder._id,
      title: 'Looking for 2 Full-Stack Engineers to collaborate on our Crypto Escrow platform',
      content: 'We are expanding the development of our decentralized milestone escrow gateway. The tech stack is React, Node.js, TypeScript, and MongoDB with smart contract listeners.\n\nIf you have experience building fintech transaction flows and want to team up, send an application or connect directly on my profile!',
      postType: 'discussion',
      tags: ['collaboration', 'fintech', 'hiring', 'typescript'],
      upvotes: 19,
      commentsCount: 4,
    },
    {
      community: comm1._id,
      author: createdUsers.priya_frontend._id,
      title: 'Just open-sourced our accessible TailwindCSS Component Kit!',
      content: 'Includes fully accessible modals, dropdowns, glassmorphism cards, and badge components tested across screen readers with WCAG AAA contrast compliance. Built with React and TailwindCSS.\n\nFeel free to star the repo and contribute ideas!',
      postType: 'showcase',
      tags: ['opensource', 'react', 'tailwindcss', 'components'],
      upvotes: 49,
      commentsCount: 11,
    },
  ]);
  console.log('🌐 [Seed] Seeded active developer communities and technical posts');

  console.log('🎉 [Seed] Real database population successfully completed! All models now have authentic, connected data.');
};

// If run directly via node
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI not found in environment');
    process.exit(1);
  }

  mongoose
    .connect(mongoUri, { family: 4 })
    .then(async () => {
      await seedDatabaseWithRealData();
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seeding failure:', err);
      process.exit(1);
    });
}
