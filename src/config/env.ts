import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';

// Load .env if present; fallback to .env.example if .env is missing in dev
const envPath = path.resolve(process.cwd(), '.env');
const envExamplePath = path.resolve(process.cwd(), '.env.example');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else if (fs.existsSync(envExamplePath)) {
  dotenv.config({ path: envExamplePath });
} else {
  dotenv.config();
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(200),
  DATABASE_URL: z.string().default('postgresql://postgres:postgrespassword@localhost:5432/greengrid_db?schema=public'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long').default('greengrid_development_jwt_secret_key_super_secure_32_bytes_min'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters long').default('greengrid_development_refresh_jwt_secret_key_super_secure_min'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  EMAIL_HOST: z.string().default('smtp.ethereal.email'),
  EMAIL_PORT: z.coerce.number().default(587),
  EMAIL_USER: z.string().default('mock@ethereal.email'),
  EMAIL_PASSWORD: z.string().default('mock_password'),
  EMAIL_FROM: z.string().default('GreenGrid Platform <noreply@greengrid.example>'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('debug'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variable configuration:');
  parsedEnv.error.issues.forEach((issue) => {
    // eslint-disable-next-line no-console
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

export const env = parsedEnv.data;
