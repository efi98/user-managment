import {Injectable, UnauthorizedException} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {LoginDto} from '@auth/dto';
import {SafeUser} from '@users/interfaces/safe-user.interface';
import {API_RESPONSES} from '@api-res';
import {toSafeUser} from "@src/common";
import {UsersService} from "@src/users";

/**
 * Authentication service: validates credentials and returns a safe user object.
 */
@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService
    ) {
    }

    /**
     * Validate a user's credentials and return a SafeUser.
     *
     * @param loginDto - Login credentials (username and password)
     * @returns The sanitized SafeUser object on success
     * @throws {UnauthorizedException} when the password is incorrect
     */
    async login(loginDto: LoginDto): Promise<SafeUser> {
        const {username, password} = loginDto;
        const user = await this.usersService.getByUsernameOrThrow(username);

        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException(API_RESPONSES.INCORRECT_PASSWORD);
        }

        return toSafeUser(user);
    }
}
