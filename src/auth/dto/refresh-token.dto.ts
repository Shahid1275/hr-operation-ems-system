import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ example: 'a3f1...hex string from login response' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
