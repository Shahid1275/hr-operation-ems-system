import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    employeeId: string;
    companyId: string;
    category: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    storagePath: string;
    uploadedById?: number;
  }) {
    const document = await this.prisma.employeeDocument.create({ data });
    await this.prisma.auditLog.create({
      data: {
        actorUserId: data.uploadedById,
        action: 'document.uploaded',
        resource: 'employee_document',
        resourceId: document.id,
      },
    });
    return document;
  }

  list(companyId: string, employeeId?: string) {
    return this.prisma.employeeDocument.findMany({
      where: { companyId, employeeId },
      include: { employee: { include: { user: true } }, uploadedBy: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
