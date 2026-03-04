import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@users/entities/user.entity';
import { LoginDto } from '@auth/dto';
import { SafeUser } from '@users/interfaces/safe-user.interface';
import { ERRORS } from '@errors';
import {toSafeUser} from "@src/common";

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {
    }

    async login(loginDto: LoginDto): Promise<SafeUser> {
        const {username, password} = loginDto;

        const user = await this.usersRepository.findOne({
            where: {username},
        });

        if (!user) {
            const {code, message} = ERRORS.USER_NOT_FOUND;
            throw new NotFoundException({code, message});
        }

        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            const {code, message} = ERRORS.INCORRECT_PASSWORD;
            throw new UnauthorizedException({code, message});
        }

        return toSafeUser(user);
    }
}
