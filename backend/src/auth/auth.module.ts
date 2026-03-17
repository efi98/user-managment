import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from '@auth/auth.service';
import { AuthController } from '@auth/auth.controller';
import { User } from '@users/entities';
import {UsersModule} from "@src/users";

@Module({
    imports: [TypeOrmModule.forFeature([User]), UsersModule],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [AuthService],
})
export class AuthModule {
}
