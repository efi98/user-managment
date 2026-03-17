import * as fs from 'node:fs';
import * as path from 'node:path';
import {deleteAvatarIfExists} from '@src/common';
import {DEFAULT_AVATAR_FILENAME} from '@consts';
import {makeTmpDir, rmTmpDir} from "@tests/utils/tmp-dir";

describe('avatar-files.helper', () => {
    let dir: string;

    beforeEach(() => {
        dir = makeTmpDir('avatars-');
    });

    afterEach(() => {
        rmTmpDir(dir);
    });

    it('does nothing for empty profilePhoto', async () => {
        await expect(deleteAvatarIfExists('', dir)).resolves.toBeUndefined();
    });

    it('does not delete default avatar filename', async () => {
        const p = `/uploads/avatars/${DEFAULT_AVATAR_FILENAME}`;
        await expect(deleteAvatarIfExists(p, dir)).resolves.toBeUndefined();
    });

    it('ignores ENOENT', async () => {
        await expect(deleteAvatarIfExists('/uploads/avatars/missing.jpg', dir)).resolves.toBeUndefined();
    });

    it('deletes existing file', async () => {
        const filename = 'alice.jpg';
        const fp = path.join(dir, filename);
        fs.writeFileSync(fp, 'x');

        await deleteAvatarIfExists(`/uploads/avatars/${filename}`, dir);

        expect(fs.existsSync(fp)).toBe(false);
    });
});