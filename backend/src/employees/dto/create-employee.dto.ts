import { IsDateString, IsInt, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateEmployeeDto {
  @IsInt()
  userId: number;

  @IsUUID()
  companyId: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  employeeCode?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobTitle?: string;

  @IsOptional()
  @IsDateString()
  joiningDate?: string;
}
