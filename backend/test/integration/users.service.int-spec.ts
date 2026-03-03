import {User, UsersService} from '@src/users';
import {createInMemoryTestingModule} from "@tests/utils/build-test-app";

describe('UsersService integration', () => {
    let service: UsersService;

    beforeAll(async () => {
        const mod = await createInMemoryTestingModule({
            entities: [User],
            featureEntities: [User],
            providers: [UsersService],
        });

        service = mod.get(UsersService);
    });

    it('create then findOne returns safe user', async () => {
        const created = await service.create({
            username: 'alice',
            password: 'pass',
            birthdate: '2000-01-01',
            gender: 'female',
        } as any);

        const found = await service.findOne('alice');

        expect(found.username).toBe('alice');
        expect((found as any).password).toBeUndefined();
        expect(created.username).toBe('alice');
    });

    it('getStats returns consistent counts', async () => {
        const stats = await service.getStats();
        expect(stats.totalUsers).toBeGreaterThanOrEqual(1);
        expect(stats.adminCount).toBeGreaterThanOrEqual(0);
        expect(stats.adminPercent).toBeGreaterThanOrEqual(0);
    });
});