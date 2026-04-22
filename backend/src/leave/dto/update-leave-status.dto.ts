import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateLeaveStatusDto {
  @IsUUID()
  leaveRequestId: string;

  @IsIn(['approve', 'reject'])
  decision: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  @MaxLength(300)
  comments?: string;
}
