import { IsOptional, IsBoolean } from 'class-validator';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from '@users/dto';

/**
 * DTO for updating a user. All fields are optional; `username` is omitted.
 */
export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['username'] as const)) {
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;
}
