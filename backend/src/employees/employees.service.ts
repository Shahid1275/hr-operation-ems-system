import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { ListEmployeesDto } from './dto/list-employees.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmployeeDto) {
    const count = await this.prisma.employee.count({ where: { companyId: dto.companyId } });
    const generatedCode = `EMP-${String(count + 1).padStart(4, '0')}`;

    const employee = await this.prisma.employee.create({
      data: {
        userId: dto.userId,
        companyId: dto.companyId,
        employeeCode: dto.employeeCode ?? generatedCode,
        departmentId: dto.departmentId,
        teamId: dto.teamId,
        branchId: dto.branchId,
        jobTitle: dto.jobTitle,
        joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : null,
      },
      include: {
        user: true,
        department: true,
        team: true,
        branch: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: dto.userId,
        action: 'employee.created',
        resource: 'employee',
        resourceId: employee.id,
      },
    });

    return employee;
  }

  async list(query: ListEmployeesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = {
      companyId: query.companyId,
      departmentId: query.departmentId,
      ...(query.search
        ? {
            OR: [
              { employeeCode: { contains: query.search, mode: 'insensitive' as const } },
              { jobTitle: { contains: query.search, mode: 'insensitive' as const } },
              {
                user: {
                  OR: [
                    { firstName: { contains: query.search, mode: 'insensitive' as const } },
                    { lastName: { contains: query.search, mode: 'insensitive' as const } },
                    { email: { contains: query.search, mode: 'insensitive' as const } },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          department: true,
          team: true,
          branch: true,
        },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
