import { IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class CreatePayrollRecordDto {
  @IsUUID()
  employeeId: string;

  @IsUUID()
  companyId: string;

  @IsString()
  payrollMonth: string;

  @IsNumber()
  @Min(0)
  basicSalary: number;

  @IsNumber()
  @Min(0)
  allowances: number;

  @IsNumber()
  @Min(0)
  deductions: number;
}
