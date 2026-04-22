import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  list(companyId?: string) {
    return this.prisma.auditLog.findMany({
      where: companyId ? { actor: { companyId } } : undefined,
      include: { actor: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
