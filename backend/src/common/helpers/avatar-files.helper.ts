import * as path from 'node:path';
import * as fs from 'node:fs';
import {promisify} from 'node:util';
import {DEFAULT_AVATAR_FILENAME} from '@consts';

const unlink = promisify(fs.unlink);

export async function deleteAvatarIfExists(
    profilePhoto: string,
    avatarsDir: string,
): Promise<void> {
    if (!profilePhoto) return;

    const filename = path.basename(profilePhoto);

    if (filename === DEFAULT_AVATAR_FILENAME) return;

    const filePath = path.join(avatarsDir, filename);

    try {
        await unlink(filePath);
    } catch (err: any) {
        if (err.code !== 'ENOENT') {
            throw err;
        }
    }
}
