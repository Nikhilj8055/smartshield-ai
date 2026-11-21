
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(__dirname, '../../../.env'),
});

const env = process.env.NODE_ENV || 'development';

const port = Number(process.env.PORT || 5000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('Invalid PORT configuration.');
}

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret && env !== 'development' && env !== 'test') {
  throw new Error('JWT_SECRET must be configured outside development.');
}

if (jwtSecret && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must contain at least 32 characters.');
}

export const config = {
  env,
  port,

  apiBaseUrl:
    process.env.API_BASE_URL || 'http://localhost:5000/api/v1',

  corsOrigin:
    process.env.CORS_ORIGIN || 'http://localhost:5173',

  jwt: {
    secret:
      jwtSecret || 'smartshield_ai_default_secret_dev_key_2026_jwt_token',

    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },

  threatIntel: {
    googleSafeBrowsingApiKey:
      process.env.GOOGLE_SAFE_BROWSING_API_KEY || '',

    urlhausApiKey: process.env.URLHAUS_API_KEY || '',
  },

  emergency: {
    helpline1930: '1930',
    nationalPortal: 'https://cybercrime.gov.in/',
  },

  storage: {
    driver: process.env.STORAGE_DRIVER || 'local',

    localUploadDir: path.resolve(__dirname, '../../uploads'),
  },
};
