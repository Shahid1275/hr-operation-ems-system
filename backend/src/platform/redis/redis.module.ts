import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import IORedis, { Redis } from 'ioredis';

export const REDIS = Symbol('REDIS');
const REDIS_DISABLED = Symbol('REDIS_DISABLED');

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        if (config.get<string>('ENABLE_REDIS', 'true') === 'false') {
          return REDIS_DISABLED as unknown as Redis;
        }

        const redisUrl = config.get<string>('REDIS_URL');
        const commonOptions = {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          retryStrategy: (times: number) => Math.min(times * 200, 3000),
        };

        const client =
          redisUrl
            ? new IORedis(redisUrl, commonOptions)
            : new IORedis({
                host: config.get<string>('REDIS_HOST', '127.0.0.1'),
                port: config.get<number>('REDIS_PORT', 6379),
                password: config.get<string>('REDIS_PASSWORD'),
                ...commonOptions,
              });

        client.on('error', () => {
          // Avoid unhandled noisy ioredis error events in local dev.
        });

        return client;
      },
    },
  ],
  exports: [REDIS],
})
export class RedisModule {}
