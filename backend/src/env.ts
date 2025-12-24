import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.string().optional(),
  PORT: z.coerce.number().default(5600),

  // SQLite default; can be replaced with Postgres URL later.
  DATABASE_URL: z.string().default('file:./prisma/dev.db'),

  // Security
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars').default('CHANGE_ME_CHANGE_ME_CHANGE_ME'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Multi-tenant in future. For now single dataset.
  DATASET_KEY: z.string().default('default'),

  // Multi-school defaults (seed/setup)
  DEFAULT_SCHOOL_NAME: z.string().default('Default School'),
  DEFAULT_SCHOOL_SLUG: z.string().default('default-school'),

  // CORS
  CORS_ORIGIN: z.string().optional(), // e.g. "http://localhost:3200,https://yourdomain.com"

  // Seed defaults (used by seed script)
  ADMIN_USERNAME: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_ROLE: z.string().optional(),
});

export const env = envSchema.parse(process.env);


