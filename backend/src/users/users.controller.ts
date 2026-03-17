/**
 * Users controller: endpoints to manage users, avatars, and user statistics.
 *
 * Exposes REST endpoints under `/users` and uses guards to protect routes.
 */

import {
    ArgumentsHost,
    BadRequestException,
    Body,
    Catch,
    Controller,
    Delete,
    ExceptionFilter,
    Get,
    HttpCode,
    Param,
    Patch,
    PayloadTooLargeException,
    Post,
    Req,
    Res,
    UploadedFile,
    UseFilters,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import {Request, Response} from 'express';
import {FileInterceptor} from '@nestjs/platform-express';
import {diskStorage} from 'multer';
import * as path from 'node:path';
import * as fs from 'node:fs';
import {UsersService} from './users.service';
import {CreateUserDto, UpdateUserDto} from '@users/dto';
import {UserStats} from '@users/interfaces';
import {AdminChangeGuard, AuthGuard, SelfOrAdminGuard} from '@common/guards';
import {deleteAvatarIfExists, destroySessionAndClearCookie} from '@common/helpers';
import {API_RESPONSES} from '@api-res';
import {DEFAULT_AVATAR_FILENAME} from "@consts";

const avatarsDir = process.env.AVATARS_DIR
    ? path.resolve(process.env.AVATARS_DIR)
    : path.join(process.cwd(), 'assets/uploads/avatars');

fs.mkdirSync(avatarsDir, {recursive: true});

const multerOptions = {
    storage: diskStorage({
        destination: (req, file, cb) => cb(null, avatarsDir),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            const filename = `${req.params.username}-${Date.now()}${ext}`;
            cb(null, filename);
        },
    }),
    fileFilter: (req: any, file: any, cb: any) => {
        if (file.mimetype?.startsWith('image/')) return cb(null, true)

        req.fileValidationError = API_RESPONSES.UPLOAD_AVATAR_INVALID_FORMAT
        return cb(null, false)
    },
    limits: {fileSize: 2 * 1024 * 1024},
}

/**
 * Exception filter for multer errors so uploads return a JSON 400.
 */
@Catch(PayloadTooLargeException, BadRequestException)
export class MulterExceptionFilter implements ExceptionFilter {
    catch(exception: PayloadTooLargeException | BadRequestException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const res = exception.getResponse() as any;

        if (exception instanceof PayloadTooLargeException) {
            return response.status(exception.getStatus()).json({
                ...res,
                message: API_RESPONSES.UPLOAD_AVATAR_FILE_TOO_LARGE,
            });
        }

        return response.status(400).json({
            message: exception.message,
        });
    }
}

/**
 * Controller that manages user CRUD, avatars and statistics.
 */
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {
    }

    /**
     * Return all users (safe representation).
     * Protected by authentication.
     */
    @Get()
    @UseGuards(AuthGuard)
    findAll() {
        return this.usersService.findAll();
    }

    /**
     * Return aggregated user statistics.
     * Protected by authentication.
     */
    @Get('stats')
    @UseGuards(AuthGuard)
    getStats(): Promise<UserStats> {
        return this.usersService.getStats();
    }

    /**
     * Return a single user by username (safe representation).
     * Protected by authentication.
     *
     * @param username - requested username from route param
     */
    @Get(':username')
    @UseGuards(AuthGuard)
    findOne(@Param('username') username: string) {
        return this.usersService.findOne(username);
    }

    /**
     * Create a new user and store the safe user in the session.
     *
     * @param createUserDto - validated payload for user creation
     * @param req - Express request to set the session user
     */
    @Post()
    async create(
        @Body() createUserDto: CreateUserDto,
        @Req() req: Request,
    ) {
        const userSafe = await this.usersService.create(createUserDto);
        req.session.user = userSafe;
        return userSafe;
    }

    /**
     * Update an existing user. Returns the updated safe user.
     * Guards ensure only authorized users or admins may update.
     */
    @Patch(':username')
    @UseGuards(AuthGuard, AdminChangeGuard, SelfOrAdminGuard)
    async update(
        @Param('username') username: string,
        @Body() updateUserDto: UpdateUserDto,
        @Req() req: Request,
    ) {
        const userSafe = await this.usersService.update(username, updateUserDto);
        if (req.session?.user?.username === username) {
            req.session.user = userSafe;
        }
        return userSafe;
    }

    /**
     * Delete a user by username. Also removes avatar file and destroys session
     * when a user deletes their own account.
     */
    @Delete(':username')
    @UseGuards(AuthGuard, SelfOrAdminGuard)
    @HttpCode(204)
    async deleteUser(
        @Param('username') username: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const user = await this.usersService.findOne(username);

        await this.usersService.deleteUser(username);

        if (user.profilePhoto) {
            await deleteAvatarIfExists(user.profilePhoto, avatarsDir);
        }

        if (req.session?.user?.username === username) {
            destroySessionAndClearCookie(req, res);
            return;
        }
        res.status(204).send();
    }

    /**
     * Upload or replace a user's avatar image.
     * Validates file type/size via multer options and returns the public path.
     */
    @Post(':username/avatar')
    @HttpCode(200)
    @UseGuards(AuthGuard, SelfOrAdminGuard)
    @UseFilters(MulterExceptionFilter)
    @UseInterceptors(FileInterceptor('avatar', multerOptions))
    async uploadAvatar(
        @Param('username') username: string,
        @Req() req: Request & { fileValidationError?: string },
        @UploadedFile() file?: Express.Multer.File,
    ) {
        if (req.fileValidationError) {
            throw new BadRequestException(req.fileValidationError)
        }

        if (!file) {
            throw new BadRequestException(API_RESPONSES.UPLOAD_AVATAR_REQ_FILE);
        }

        const user = await this.usersService.findOne(username);
        if (user.profilePhoto) {
            await deleteAvatarIfExists(user.profilePhoto, avatarsDir);
        }

        const publicPath = `/uploads/avatars/${file.filename}`;
        await this.usersService.updateAvatar(username, publicPath);

        if (req.session?.user?.username === username) {
            req.session.user.profilePhoto = publicPath;
        }

        return {
            message: API_RESPONSES.UPLOAD_AVATAR_SUCCESS,
            profilePhoto: publicPath,
        };
    }

    /**
     * Delete a user's avatar and reset to the default avatar for their session.
     */
    @Delete(':username/avatar')
    @UseGuards(AuthGuard, SelfOrAdminGuard)
    @HttpCode(200)
    async deleteAvatar(
        @Param('username') username: string,
        @Req() req: Request,
    ) {
        const {oldPhoto} = await this.usersService.deleteAvatar(username);

        if (oldPhoto) {
            await deleteAvatarIfExists(oldPhoto, avatarsDir);
        }

        if (req.session?.user?.username === username) {
            req.session.user.profilePhoto = `/uploads/avatars/${DEFAULT_AVATAR_FILENAME}`;
        }

        return {message: API_RESPONSES.DELETE_AVATAR_SUCCESS};
    }
}
