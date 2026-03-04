import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '@users/users.module';
import { AuthModule } from '@auth/auth.module';
import { AppController } from './app.controller';

@Module({
    imports: [
        ConfigModule.forRoot({isGlobal: true}),

        TypeOrmModule.forRoot({
            type: 'sqlite',
            database: process.env.DB_PATH || 'database.sqlite',
            autoLoadEntities: true,
            synchronize: true,
            logging: false,
        }),

        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'assets', 'uploads'),
            serveRoot: '/uploads',
        }),

        UsersModule,
        AuthModule,
    ],
    controllers: [AppController],
    providers: [],
})
export class AppModule {
}
