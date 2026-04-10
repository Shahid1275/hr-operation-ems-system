import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ example: 'token-from-verification-email' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
