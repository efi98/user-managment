import {
    ArgumentsHost,
    BadRequestException,
    Body, Catch,
    Controller,
    Delete, ExceptionFilter,
    Get,
    HttpCode,
    Param,
    Patch,
    Post, Req,
    UploadedFile, UseFilters,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import {diskStorage, MulterError} from 'multer';
import * as path from 'node:path';
import * as fs from 'node:fs';
import {UsersService} from './users.service';
import {CreateUserDto, UpdateUserDto} from '@users/dto';
import {UserStats} from '@users/interfaces';
import {AdminChangeGuard, AuthGuard, SelfOrAdminGuard} from '@common/guards';
import {deleteAvatarIfExists} from '@common/helpers';
import {ERRORS} from '@errors';

const avatarsDir = process.env.AVATARS_DIR
    ? path.resolve(process.env.AVATARS_DIR)
    : path.join(process.cwd(), 'assets/uploads/avatars');

// Ensure avatars directory exists
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

        req.fileValidationError = ERRORS.AVATAR_INVALID_FORMAT.message
        return cb(null, false)
    },
    limits: {fileSize: 2 * 1024 * 1024},
}

@Catch(MulterError)
class MulterExceptionFilter implements ExceptionFilter {
    catch(exception: MulterError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();

        return res.status(400).json({
            error: exception.message,
            code: exception.code,
        });
    }
}

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {
    }

    @Get()
    @UseGuards(AuthGuard)
    findAll() {
        return this.usersService.findAll();
    }

    @Get('stats')
    @UseGuards(AuthGuard)
    getStats(): Promise<UserStats> {
        return this.usersService.getStats();
    }

    @Get(':username')
    @UseGuards(AuthGuard)
    findOne(@Param('username') username: string) {
        return this.usersService.findOne(username);
    }

    @Post()
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Patch(':username')
    @UseGuards(AuthGuard, AdminChangeGuard, SelfOrAdminGuard)
    update(
        @Param('username') username: string,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        return this.usersService.update(username, updateUserDto);
    }

    @Delete(':username')
    @UseGuards(AuthGuard, SelfOrAdminGuard)
    @HttpCode(204)
    async remove(@Param('username') username: string) {
        const user = await this.usersService.findOne(username);
        await this.usersService.remove(username);
        if (user.profilePhoto) {
            await deleteAvatarIfExists(user.profilePhoto, avatarsDir);
        }
    }

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
            throw new BadRequestException({ error: req.fileValidationError })
        }

        if (!file) {
            throw new BadRequestException({error: ERRORS.NO_FILE_UPLOADED.message});
        }

        // Get the old photo and delete it
        const user = await this.usersService.findOne(username);
        if (user.profilePhoto) {
            await deleteAvatarIfExists(user.profilePhoto, avatarsDir);
        }

        const publicPath = `/uploads/avatars/${file.filename}`;
        await this.usersService.updateAvatar(username, publicPath);

        return {
            message: ERRORS.AVATAR_UPLOADED.message,
            profilePhoto: publicPath,
        };
    }

    @Delete(':username/avatar')
    @UseGuards(AuthGuard, SelfOrAdminGuard)
    @HttpCode(200)
    async deleteAvatar(@Param('username') username: string) {
        const {oldPhoto} = await this.usersService.deleteAvatar(username);
        if (oldPhoto) {
            await deleteAvatarIfExists(oldPhoto, avatarsDir);
        }
        return {message: ERRORS.AVATAR_DELETED.message};
    }
}
