import {IsIn, IsNotEmpty, IsOptional, IsString, Matches, MinLength,} from 'class-validator';
import {IsNotFutureDate, MaxAge, MinAge} from '@common/validators';
import {API_RESPONSES} from "@api-res";
import {GENDER} from "@enums";

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(4, {message: API_RESPONSES.PASSWORD_MIN_LENGTH})
    password: string;

    @IsOptional()
    @IsString()
    displayName?: string;

    @IsOptional()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, {message: API_RESPONSES.BIRTHDAY_FORMAT})
    @IsNotFutureDate()
    @MinAge(18)
    @MaxAge(120)
    birthdate?: string;

    @IsOptional()
    @IsString()
    @IsIn([GENDER.male, GENDER.female, GENDER.other], {
        message: API_RESPONSES.GENDER_INVALID
    })
    gender?: string;
}
