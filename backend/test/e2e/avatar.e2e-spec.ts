import * as fs from 'node:fs';
import * as path from 'node:path';
import {INestApplication} from '@nestjs/common';
import {buildTestApp} from '../utils/build-test-app';
import {sessionAgent} from '../utils/session-agent';
import {loginUser, seedUser} from '../utils/seed';
import {makeTmpDir, rmTmpDir} from '../utils/tmp-dir';
import {ERRORS} from "@errors";

describe('E2E avatar upload and delete', () => {
    let app: INestApplication;
    let agent: ReturnType<typeof sessionAgent>;
    let tmpDir: string;

    beforeAll(async () => {
        tmpDir = makeTmpDir('e2e-avatars-');
        process.env.AVATARS_DIR = tmpDir;

        app = await buildTestApp();
        agent = sessionAgent(app);

        await seedUser(agent, {
            username: 'alice',
            password: 'pass',
            birthdate: '2000-01-01',
            gender: 'female',
        });
        await loginUser(agent, {username: 'alice', password: 'pass'});
    });

    afterAll(async () => {
        await app.close();
        rmTmpDir(tmpDir);
    });

    it('upload rejects when no file uploaded', async () => {
        const res = await agent.post('/users/alice/avatar').expect(400);
        expect(res.body).toMatchObject({error: ERRORS.NO_FILE_UPLOADED.message});
    });

    it('upload rejects invalid file type', async () => {
        const fp = path.join(tmpDir, 'not-image.txt');
        fs.writeFileSync(fp, 'hello');

        const res = await agent
            .post('/users/alice/avatar')
            .attach('avatar', fp)
            .expect(400);

        expect(res.body).toMatchObject({error: ERRORS.AVATAR_INVALID_FORMAT.message});
    });

    it('upload accepts image and returns profilePhoto', async () => {
        const fp = path.join(tmpDir, 'pic.png');
        fs.writeFileSync(fp, Buffer.from([0x89, 0x50, 0x4e, 0x47])); // minimal png header bytes

        const res = await agent
            .post('/users/alice/avatar')
            .attach('avatar', fp)
            .expect(200);

        expect(res.body).toHaveProperty('message', ERRORS.AVATAR_UPLOADED.message);
        expect(res.body).toHaveProperty('profilePhoto');
        expect(String(res.body.profilePhoto)).toContain('/uploads/avatars/');
    });

    it('delete avatar returns success message', async () => {
        const res = await agent.delete('/users/alice/avatar').expect(200);
        expect(res.body).toEqual({message: ERRORS.AVATAR_DELETED.message});
    });
});