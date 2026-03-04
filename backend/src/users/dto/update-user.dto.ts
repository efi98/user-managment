import { IsOptional, IsBoolean } from 'class-validator';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from '@users/dto';

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['username'] as const)) {
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;
}
