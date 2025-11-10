import { IsEmail, IsString, IsEnum, MinLength, IsOptional } from 'class-validator';
import { UserRole } from '../../../shared/enums/user-role.enum';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  full_name: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  student_id?: string;
}
