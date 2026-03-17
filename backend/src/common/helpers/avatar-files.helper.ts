import * as path from 'node:path';
import * as fs from 'node:fs';
import {promisify} from 'node:util';
import {DEFAULT_AVATAR_FILENAME} from '@consts';

const unlink = promisify(fs.unlink);

/**
 * Delete a user's avatar file if it exists and is not the default avatar.
 *
 * This function is safe to call for missing files; it ignores ENOENT errors
 * and will rethrow other filesystem errors. It also avoids deleting the
 * configured default avatar filename.
 *
 * @param profilePhoto - A path or URL to the user's profile photo. Only the
 *   basename is used to resolve the file under `avatarsDir`.
 * @param avatarsDir - Absolute path to the directory that contains avatar files.
 */
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
