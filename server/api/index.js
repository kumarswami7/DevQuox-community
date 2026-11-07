// Vercel Serverless Function Entry Point
// Vercel injects env vars from project settings — no dotenv needed here.

let app;
let appLoadError = null;

try {
  const mod = await import('../src/app.js');
  app = mod.default || mod.app;
} catch (err) {
  appLoadError = err;
  console.error('[Serverless] Failed to import app:', err.message, err.stack);
}

let isDbInitialized = false;

export default async function handler(req, res) {
  // If the app failed to load, return a clear error
  if (appLoadError || !app) {
    console.error('[Serverless] App not available:', appLoadError?.message);
    res.status(500).json({
      error: 'Server initialization failed',
      message: appLoadError?.message || 'App module could not be loaded',
    });
    return;
  }

  // Lazy-connect to MongoDB on first request
  if (!isDbInitialized) {
    try {
      const { default: connectDB } = await import('../src/config/db.js');
      await connectDB();
      isDbInitialized = true;
    } catch (err) {
      // Don't block the request — app can still serve health checks
      console.error('[Serverless] MongoDB connection notice:', err.message);
    }
  }

  return app(req, res);
}
