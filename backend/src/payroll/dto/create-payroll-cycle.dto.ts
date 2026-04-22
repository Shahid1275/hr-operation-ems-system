import { IsDateString, IsString, IsUUID } from 'class-validator';

export class CreatePayrollCycleDto {
  @IsUUID()
  companyId: string;

  @IsString()
  name: string;

  @IsString()
  month: string;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;
}
