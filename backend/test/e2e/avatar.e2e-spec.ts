import * as fs from 'node:fs';
import * as path from 'node:path';
import {INestApplication} from '@nestjs/common';
import {API_RESPONSES} from "@api-res";
import {sessionAgent} from "@tests/utils/session-agent";
import {buildTestApp} from "@tests/utils/build-test-app";
import {makeTmpDir, rmTmpDir} from "@tests/utils/tmp-dir";
import {loginUser, seedUser} from "@tests/utils/seed";

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
        expect(res.body).toHaveProperty('message', API_RESPONSES.UPLOAD_AVATAR_REQ_FILE);
    });

    it('upload rejects invalid file type', async () => {
        const fp = path.join(tmpDir, 'not-image.txt');
        fs.writeFileSync(fp, 'hello');

        const res = await agent
            .post('/users/alice/avatar')
            .attach('avatar', fp)
            .expect(400);
        expect(res.body).toHaveProperty('message', API_RESPONSES.UPLOAD_AVATAR_INVALID_FORMAT);
    });

    it('upload accepts image and returns avatar', async () => {
        const fp = path.join(tmpDir, 'pic.png');
        fs.writeFileSync(fp, Buffer.from([0x89, 0x50, 0x4e, 0x47])); // minimal png header bytes

        const res = await agent
            .post('/users/alice/avatar')
            .attach('avatar', fp)
            .expect(200);

        expect(res.body).toHaveProperty('message', API_RESPONSES.UPLOAD_AVATAR_SUCCESS);
        expect(res.body).toHaveProperty('avatar');
        expect(String(res.body.avatar)).toContain('/uploads/avatars/');
    });

    it('upload rejects file that is too large', async () => {
        // create a file slightly larger than the 2MB limit configured in multerOptions
        const fp = path.join(tmpDir, 'big.png');
        const size = 2 * 1024 * 1024 + 100; // 2MB + 100 bytes
        const buf = Buffer.alloc(size, 0);
        fs.writeFileSync(fp, buf);

        const res = await agent
            .post('/users/alice/avatar')
            .attach('avatar', fp)
            .expect(413);

        expect(res.body).toHaveProperty('message', API_RESPONSES.UPLOAD_AVATAR_FILE_TOO_LARGE);
    });

    it('delete avatar returns success message', async () => {
        const res = await agent.delete('/users/alice/avatar').expect(200);
        expect(res.body).toEqual({message: API_RESPONSES.DELETE_AVATAR_SUCCESS});
    });
});