import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsInt,
  IsPositive,
  IsIn,
} from 'class-validator';
import { CONSTS, GENDER } from '@consts';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4, { message: CONSTS.PASSWORD_MIN_LENGTH_MSG })
  password: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  age?: number;

  @IsOptional()
  @IsString()
  @IsIn([GENDER.male, GENDER.female, GENDER.other], {
    message: CONSTS.GENDER_INVALID_MSG,
  })
  gender?: string;
}
