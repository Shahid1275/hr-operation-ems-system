type EnvMap = Record<string, string | undefined>;

const requiredKeys = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'] as const;

export function validateEnv(config: EnvMap): EnvMap {
  for (const key of requiredKeys) {
    if (!config[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  const parsedPort = Number(config.PORT ?? '3000');
  if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
    throw new Error('PORT must be a positive integer');
  }

  const redisEnabled = (config.ENABLE_REDIS ?? 'true') !== 'false';
  if (redisEnabled) {
    if (!config.REDIS_URL && (!config.REDIS_HOST || !config.REDIS_PORT)) {
      throw new Error('Provide REDIS_URL or both REDIS_HOST and REDIS_PORT');
    }

    if (config.REDIS_PORT && Number.isNaN(Number(config.REDIS_PORT))) {
      throw new Error('REDIS_PORT must be numeric');
    }
  }

  return config;
}
