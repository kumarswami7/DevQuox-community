import dotenv from 'dotenv';
dotenv.config();

/**
 * Validates and exposes server environment configuration
 * Pure JavaScript ES6+ implementation
 */
export function validateEnv(customEnv = process.env) {
  const nodeEnv = customEnv.NODE_ENV || 'development';
  const port = parseInt(customEnv.PORT || '5000', 10);

  if (isNaN(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT configuration: "${customEnv.PORT}". Must be a valid port number between 1 and 65535.`);
  }

  const mongoUri = customEnv.MONGODB_URI || 'mongodb://127.0.0.1:27017/devconnect';
  if (typeof mongoUri !== 'string' || !mongoUri.startsWith('mongodb')) {
    throw new Error('Invalid MONGODB_URI: must be a valid mongodb:// or mongodb+srv:// connection URI string.');
  }

  const jwtSecret = customEnv.JWT_SECRET || 'devconnect_default_development_secret_key_32bytes';
  if (nodeEnv === 'production' && (!customEnv.JWT_SECRET || customEnv.JWT_SECRET.length < 16)) {
    throw new Error('In production, JWT_SECRET must be at least 16 characters long for security.');
  }

  const clientUrl = customEnv.CLIENT_URL || 'http://localhost:3000';

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    MONGODB_URI: mongoUri,
    JWT_SECRET: jwtSecret,
    CLIENT_URL: clientUrl,
    GOOGLE_CLIENT_ID: customEnv.GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_SECRET: customEnv.GOOGLE_CLIENT_SECRET || '',
    API_NINJAS_KEY: customEnv.API_NINJAS_KEY || 'W2Fu3VMxKDraqngPz9TkZcp11mvULB6lkan47wAk',
    JOBIWORK_API_KEY: customEnv.JOBIWORK_API_KEY || 'jwk_78610532af884b20783c59b5505dc12780e1eaacc66168b9',
    isProduction: nodeEnv === 'production',
    isTest: nodeEnv === 'test',
    isDevelopment: nodeEnv === 'development',
  };
}

export const env = validateEnv();
export default env;
