import {NotFoundException, UnauthorizedException} from '@nestjs/common';
import {AuthService} from '@src/auth';
import {User, UsersService} from '@src/users';
import {createInMemoryTestingModule} from "@tests/utils/build-test-app";

describe('AuthService integration', () => {
    let auth: AuthService;
    let users: UsersService;

    beforeAll(async () => {
        const mod = await createInMemoryTestingModule({
            entities: [User],
            featureEntities: [User],
            providers: [AuthService, UsersService],
        });

        auth = mod.get(AuthService);
        users = mod.get(UsersService);
    });

    it('login succeeds after user creation', async () => {
        await users.create({
            username: 'alice',
            password: 'pass',
            birthdate: '2000-01-01',
            gender: 'female',
        } as any);

        const res = await auth.login({username: 'alice', password: 'pass'});

        expect(res.username).toBe('alice');
        expect((res as any).password).toBeUndefined();
    });

    it('login throws NotFoundException when user missing', async () => {
        await expect(auth.login({username: 'missing', password: 'pass'})).rejects.toBeInstanceOf(NotFoundException);
    });

    it('login throws UnauthorizedException when password wrong', async () => {
        await expect(auth.login({username: 'alice', password: 'wrong'})).rejects.toBeInstanceOf(UnauthorizedException);
    });
});