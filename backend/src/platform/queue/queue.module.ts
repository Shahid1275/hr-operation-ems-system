import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        if (config.get<string>('ENABLE_REDIS', 'true') === 'false') {
          return {
            connection: {
              host: '127.0.0.1',
              port: 6379,
              lazyConnect: true,
              maxRetriesPerRequest: 1,
            },
          };
        }

        const redisUrl = config.get<string>('REDIS_URL');
        const commonConnection = {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          retryStrategy: (times: number) => Math.min(times * 200, 3000),
        };
        if (redisUrl) {
          return { connection: { url: redisUrl, ...commonConnection } };
        }

        return {
          connection: {
            host: config.get<string>('REDIS_HOST', '127.0.0.1'),
            port: config.get<number>('REDIS_PORT', 6379),
            password: config.get<string>('REDIS_PASSWORD'),
            ...commonConnection,
          },
        };
      },
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
