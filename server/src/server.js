import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import connectDB from './config/db.js';
import { setupSocketServer } from './socket/socket.server.js';
import { Project } from './models/Project.js';
import { Post } from './models/Post.js';
import { seedDatabaseWithRealData } from './database/seedTestData.js';
import { seedInitialUniversities } from './database/seedUniversities.js';
import { seedInitialColleges } from './database/seedColleges.js';
import { seedInitialCompanies } from './database/seedCompanies.js';
import { seedCanonicalSkills } from './database/seedSkills.js';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

app.set('io', io);
global.io = io;

setupSocketServer(io);

const startServer = async () => {
  try {
    await connectDB();

    // Check if database needs test data (projects or posts)
    try {
      const [projectCount, postCount] = await Promise.all([
        Project.countDocuments().catch(() => 0),
        Post.countDocuments().catch(() => 0),
      ]);
      console.log(`📊 DB Status: ${projectCount} Projects, ${postCount} Posts`);
      if (projectCount < 6 || postCount < 4) {
        console.log('🌱 Populating complete real test data (Projects, Posts, Users, Profiles, Communities)...');
        await seedDatabaseWithRealData();
        console.log('✅ Real test data populated successfully in MongoDB Atlas.');
      }
      seedInitialUniversities().catch(() => {});
      seedInitialColleges().catch(() => {});
      seedInitialCompanies().catch(() => {});
      seedCanonicalSkills().catch(() => {});
    } catch (seedErr) {
      console.warn('⚠️ Initial seed check notice:', seedErr.message);
    }

    server.listen(PORT, () => {
      console.log(`🚀 MERN Server & Socket.IO running on http://localhost:${PORT}`);
      console.log(`📡 Health endpoint: http://localhost:${PORT}/api/v1/health`);
    });
  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
};

// Graceful shutdown
const handleShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('✅ HTTP and Socket server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default server;