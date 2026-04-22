import { IsNumber, IsString, IsUUID } from 'class-validator';

export class CreatePayrollRevisionDto {
  @IsUUID()
  payrollRecordId: string;

  @IsUUID()
  employeeId: string;

  @IsUUID()
  companyId: string;

  @IsString()
  reason: string;

  @IsNumber()
  amountDelta: number;
}
