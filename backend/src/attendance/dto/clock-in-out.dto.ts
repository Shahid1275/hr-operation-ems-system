import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ClockInOutDto {
  @IsUUID()
  employeeId: string;

  @IsUUID()
  companyId: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  remarks?: string;
}
