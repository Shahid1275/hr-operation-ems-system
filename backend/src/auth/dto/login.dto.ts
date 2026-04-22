import { IsEmail, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;

  @ApiProperty({
    enum: ['admin', 'employee'],
    description: 'Must match the portal this account was registered with.',
  })
  @IsString()
  @IsIn(['admin', 'employee'], { message: 'portal must be admin or employee' })
  portal: 'admin' | 'employee';
}
