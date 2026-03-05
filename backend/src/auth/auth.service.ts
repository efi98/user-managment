import {Injectable, UnauthorizedException} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {LoginDto} from '@auth/dto';
import {SafeUser} from '@users/interfaces/safe-user.interface';
import {API_RESPONSES} from '@api-res';
import {toSafeUser} from "@src/common";
import {UsersService} from "@src/users";

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService
    ) {
    }

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
