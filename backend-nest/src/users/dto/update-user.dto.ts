import { IsOptional, IsBoolean } from 'class-validator';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from '@src/users';

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['username'] as const)) {
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;
}
