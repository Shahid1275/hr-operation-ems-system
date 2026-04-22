import { IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class AllocateLeaveBalanceDto {
  @IsUUID()
  employeeId: string;

  @IsUUID()
  companyId: string;

  @IsString()
  leaveType: string;

  @IsNumber()
  year: number;

  @IsNumber()
  @Min(0)
  allocatedDays: number;
}
