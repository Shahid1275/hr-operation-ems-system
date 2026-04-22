import { IsBoolean, IsIn, IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class CreateLeavePolicyDto {
  @IsUUID()
  companyId: string;

  @IsString()
  leaveType: string;

  @IsNumber()
  @Min(0)
  annualAllocation: number;

  @IsNumber()
  @Min(0)
  carryForwardMax: number;

  @IsIn(['YEARLY', 'MONTHLY'])
  period: 'YEARLY' | 'MONTHLY';

  @IsBoolean()
  requiresTeamLead: boolean;

  @IsBoolean()
  requiresHrApproval: boolean;
}
