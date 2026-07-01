import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Load server/.env regardless of the current working directory.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/** Read a required env var, throwing a clear error if it is missing. */
function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.example to server/.env and fill it in.`
    );
  }
  return value;
}

/** Read an env var with a fallback default. */
function optional(name, fallback) {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  port: Number(optional('PORT', '4000')),
  clientOrigin: optional('CLIENT_ORIGIN', 'http://localhost:5173'),

  databaseUrl: required('DATABASE_URL'),

  jwtSecret: optional('JWT_SECRET', 'dev-only-change-me'),
  jwtExpiresIn: optional('JWT_EXPIRES_IN', '7d'),

  seedAdminEmail: optional('SEED_ADMIN_EMAIL', 'admin@demo.test'),
  seedAdminPassword: optional('SEED_ADMIN_PASSWORD', 'demo1234'),

  businessTimezone: optional('BUSINESS_TIMEZONE', 'America/New_York'),

  resendApiKey: optional('RESEND_API_KEY', ''),
  emailFrom: optional('EMAIL_FROM', 'Booking Tool <bookings@demo.test>'),
};

export const isProduction = env.nodeEnv === 'production';
