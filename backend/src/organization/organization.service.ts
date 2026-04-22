import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { CreateBranchDto } from './dto/create-branch.dto';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  createDepartment(dto: CreateDepartmentDto) {
    return this.prisma.department.create({ data: dto });
  }

  listDepartments(companyId: string) {
    return this.prisma.department.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  createTeam(dto: CreateTeamDto) {
    return this.prisma.team.create({ data: dto });
  }

  listTeams(companyId: string) {
    return this.prisma.team.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  createBranch(dto: CreateBranchDto) {
    return this.prisma.branch.create({ data: dto });
  }

  listBranches(companyId: string) {
    return this.prisma.branch.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
