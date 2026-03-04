import {IsIn, IsNotEmpty, IsOptional, IsString, Matches, MinLength,} from 'class-validator';
import {GENDER} from '@consts';
import {ERRORS} from "@errors";
import {IsNotFutureDate, MaxAge, MinAge} from '@common/validators';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(4, {message: ERRORS.PASSWORD_MIN_LENGTH.message})
    password: string;

    @IsOptional()
    @IsString()
    displayName?: string;

    @IsOptional()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, {message: 'birthdate must be YYYY-MM-DD'})
    @IsNotFutureDate()
    @MinAge(18)
    @MaxAge(120)
    birthdate?: string;

    @IsOptional()
    @IsString()
    @IsIn([GENDER.male, GENDER.female, GENDER.other], {
        message: ERRORS.GENDER_INVALID.message
    })
    gender?: string;
}
