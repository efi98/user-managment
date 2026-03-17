import { IsString, IsNotEmpty, MinLength } from 'class-validator';

/**
 * DTO for login requests.
 *
 * Validates that both `username` and `password` are provided and of the correct type / length.
 */
export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  password: string;
}
