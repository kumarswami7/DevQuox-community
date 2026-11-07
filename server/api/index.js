import app from '../src/app.js';
import connectDB from '../src/config/db.js';

let isDbInitialized = false;

export default async function handler(req, res) {
  if (!isDbInitialized) {
    try {
      await connectDB();
      isDbInitialized = true;
    } catch (err) {
      console.error('[Serverless] MongoDB connection initialization notice:', err.message);
    }
  }
  return app(req, res);
}

