// Users module service

import {ConflictException, Injectable, NotFoundException,} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import * as bcrypt from 'bcrypt';
import {User} from '@users/entities';
import {CreateUserDto, UpdateUserDto} from '@users/dto';
import {SafeUser, UserStats} from '@users/interfaces';
import {ageFromBirthdate, toSafeUser, toSafeUsers} from '@common/helpers';
import {API_RESPONSES} from '@api-res';

const SALT_ROUNDS = 10;

/**
 * Service responsible for user persistence and business rules.
 *
 * Provides methods to create, read, update and delete users, manage avatars
 * and compute basic statistics.
 */
@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {
    }

    /**
     * Get a User entity by username or throw NotFoundException.
     *
     * @param username - username to look up
     */
    async getByUsernameOrThrow(username: string): Promise<User> {
        const user = await this.usersRepository.findOne({ where: { username } });
        if (!user) throw new NotFoundException(API_RESPONSES.USER_NOT_FOUND(username));
        return user;
    }

    /**
     * Return all users in a safe representation.
     */
    async findAll() {
        const users = await this.usersRepository.find();
        return toSafeUsers(users);
    }

    /**
     * Return a single user in a safe representation.
     *
     * @param username - username to fetch
     */
    async findOne(username: string) {
        const user = await this.getByUsernameOrThrow(username);
        return toSafeUser(user);
    }

    /**
     * Create a new user, hashing the password and assigning admin to first user.
     *
     * Returns the safe representation of the created user.
     *
     * @param createUserDto - DTO with creation payload
     */
    async create(createUserDto: CreateUserDto) {
        const {username, password, ...rest} = createUserDto;

        // Check if user already exists
        const existingUser = await this.usersRepository.findOne({
            where: {username},
        });

        if (existingUser) {
            // Generate suggestions
            const suggestions = [];
            const allUsers = await this.usersRepository.find();
            while (suggestions.length < 3) {
                const suggestion = `${username}${Math.floor(Math.random() * 1000)}`;
                if (!allUsers.some((u) => u.username === suggestion)) {
                    suggestions.push(suggestion);
                }
            }
            throw new ConflictException({
                statusCode: 409,
                error: 'Conflict',
                message: API_RESPONSES.USERNAME_EXISTS(username),
                suggestions,
            });
        }

        const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);

        const users = await this.usersRepository.find();
        const isAdmin = users.length === 0;

        const newUser = this.usersRepository.create({
            username,
            password: passwordHash,
            displayName: rest.displayName ?? username,
            birthdate: rest.birthdate,
            gender: rest.gender,
            isAdmin
        });

        const savedUser = await this.usersRepository.save(newUser);
        return toSafeUser(savedUser);
    }

    /**
     * Update a user's data (hashes password when provided) and return safe user.
     */
    async update(username: string, updateUserDto: UpdateUserDto) {
        const user = await this.getByUsernameOrThrow(username);

        // Hash password if provided
        if (updateUserDto.password) {
            updateUserDto.password = bcrypt.hashSync(
                updateUserDto.password,
                SALT_ROUNDS,
            );
        }

        // Update fields
        Object.assign(user, {...updateUserDto});

        const updatedUser = await this.usersRepository.save(user);
        return toSafeUser(updatedUser);
    }

    /**
     * Remove a user from the repository.
     */
    async deleteUser(username: string) {
        const user = await this.getByUsernameOrThrow(username);
        await this.usersRepository.remove(user);
    }

    /**
     * Compute statistics about users including counts, recent signups, and age/gender breakdowns.
     */
    async getStats(): Promise<UserStats> {
        const users = await this.usersRepository.find();
        const totalUsers = users.length;
        const adminCount = users.filter((u) => u.isAdmin).length;
        const adminPercent =
            totalUsers > 0 ? Math.round((adminCount / totalUsers) * 100) : 0;

        // Build lastSignups: most recent 10 users by createdAt (safe shape)
        const lastSignups: SafeUser[] = users
            .slice()
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((u) => toSafeUser(u))
            .filter((s): s is SafeUser => s !== null)
            .slice(0, 10);

        const genderBreakdown = users.reduce((acc: Record<string, number>, u) => {
            let g = u.gender;
            if (g === undefined || g === null || g === '') {
                g = 'blank';
            } else {
                g = g.toLowerCase();
            }
            acc[g] = (acc[g] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const ages = users
            .map((u) => {
                return ageFromBirthdate(u.birthdate);
            })
            .filter((a) => a !== null);
        let ageStats = null;
        if (ages.length > 0) {
            const sum = ages.reduce((a, b) => a + b, 0);
            const avg = Math.round((sum / ages.length) * 10) / 10;
            const min = Math.min(...ages);
            const max = Math.max(...ages);
            const sorted = [...ages].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            const median =
                sorted.length % 2 === 0
                    ? Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10
                    : sorted[mid];
            ageStats = {avg, min, max, median};
        }

        return {
            totalUsers,
            adminCount,
            adminPercent,
            lastSignups,
            genderBreakdown,
            ageStats,
        };
    }

    /**
     * Update the user's stored avatar path and return the old and new path.
     */
    async updateAvatar(username: string, avatar: string) {
        const user = await this.getByUsernameOrThrow(username);

        const oldPhoto = user.avatar;
        user.avatar = avatar;
        await this.usersRepository.save(user);

        return {oldPhoto, newPhoto: avatar};
    }

    /**
     * Remove user's avatar entry (sets to null) and return the old path.
     */
    async deleteAvatar(username: string) {
        const user = await this.getByUsernameOrThrow(username);

        const oldPhoto = user.avatar;
        user.avatar = null;
        await this.usersRepository.save(user);

        return {oldPhoto};
    }
}
