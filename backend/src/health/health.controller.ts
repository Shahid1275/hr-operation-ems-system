import { Controller, Get, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS } from '../platform/redis/redis.module';
import { Redis } from 'ioredis';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  @Get()
  async getHealth() {
    const dbOk = await this.prisma.$queryRaw`SELECT 1`;
    let redisStatus = 'down';
    try {
      const redisPing =
        this.redis && typeof this.redis.ping === 'function'
          ? await this.redis.ping()
          : 'DISABLED';
      redisStatus = redisPing === 'PONG' ? 'up' : 'disabled';
    } catch {
      redisStatus = 'down';
    }

    return {
      status: 'ok',
      services: {
        database: Array.isArray(dbOk) ? 'up' : 'up',
        redis: redisStatus,
      },
    };
  }
}
