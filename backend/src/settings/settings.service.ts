import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  getCompany(companyId: string) {
    return this.prisma.company.findUnique({ where: { id: companyId } });
  }

  updateCompany(companyId: string, dto: UpdateCompanySettingsDto) {
    return this.prisma.company.update({
      where: { id: companyId },
      data: dto,
    });
  }
}
