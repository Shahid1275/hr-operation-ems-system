import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John', required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    enum: ['admin', 'employee'],
    description:
      'Portal used at signup. Admin → COMPANY_ADMIN; Employee → EMPLOYEE. Login is allowed only from the matching portal.',
  })
  @IsString()
  @IsIn(['admin', 'employee'], {
    message: 'signupPortal must be admin or employee',
  })
  signupPortal: 'admin' | 'employee';
}
