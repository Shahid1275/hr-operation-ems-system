const requiredClientEnv = ['NEXT_PUBLIC_API_URL'] as const;

for (const key of requiredClientEnv) {
  if (!process.env[key] && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required env variable: ${key}`);
  }
}

export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api',
};
