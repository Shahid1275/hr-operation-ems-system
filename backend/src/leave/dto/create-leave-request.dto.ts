import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateLeaveRequestDto {
  @IsUUID()
  employeeId: string;

  @IsUUID()
  companyId: string;

  @IsString()
  @MaxLength(80)
  leaveType: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber()
  @Min(0.5)
  totalDays: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
