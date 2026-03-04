import {IsIn, IsNotEmpty, IsOptional, IsString, Matches, MinLength,} from 'class-validator';
import {CONSTS, GENDER} from '@consts';
import {IsNotFutureDate, MaxAge, MinAge} from '@common/validators';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(4, {message: CONSTS.PASSWORD_MIN_LENGTH_MSG})
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
        message: CONSTS.GENDER_INVALID_MSG,
    })
    gender?: string;
}
