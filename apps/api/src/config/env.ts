import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().url().optional(),
  MONGO_URI: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  REDIS_URI: z.string().url().optional(),
  
  JWT_PRIVATE_KEY: z.string().min(1, 'JWT_PRIVATE_KEY is required for RS256'),
  JWT_PUBLIC_KEY: z.string().min(1, 'JWT_PUBLIC_KEY is required for RS256'),
  JWT_ISSUER: z.string().default('onecms-api'),
  JWT_AUDIENCE: z.string().default('onecms'),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900), // 15 minutes
  
  // Custom Secrets & OAuth
  JWT_SECRET: z.string().optional(),
  REFRESH_SECRET: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().optional(),
  ALLOWED_SIGN_IN: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // SMTP Configuration
  SMTP_USER: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_SERVICE: z.string().optional(),
  SMTP_HOST: z.string().optional(),

  // Integrations
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),

  TRUST_PROXY: z.coerce.boolean().default(false),
  CORS_ORIGINS: z.string().optional(),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(604800), // 7 days
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(604800), // 7 days
}).superRefine((env, ctx) => {
  if (env.NODE_ENV === 'production' && !env.MONGODB_URI && !env.MONGO_URI) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'MONGODB_URI or MONGO_URI is required in production',
      path: ['MONGODB_URI'],
    });
  }
  if (env.NODE_ENV === 'production' && !env.REDIS_URL && !env.REDIS_URI) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'REDIS_URL or REDIS_URI is required in production',
      path: ['REDIS_URL'],
    });
  }
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('Invalid environment variables:');
  for (const [key, value] of Object.entries(_env.error.flatten().fieldErrors)) {
    console.error(`- ${key}: ${value?.join(', ')}`);
  }
  process.exit(1);
}

export const env = _env.data;
