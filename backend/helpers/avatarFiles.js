const path = require('node:path');
const fs = require('node:fs');
const { promisify } = require('node:util');
const unlink = promisify(fs.unlink);

async function deleteAvatarIfExists(profilePhoto, avatarsDir) {
    if (!profilePhoto) return;

    const filename = path.basename(profilePhoto);

    if (filename === 'default.png') return;

    const filePath = path.join(avatarsDir, filename);

    try {
        await unlink(filePath);
    } catch (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }
    }
}


module.exports = { deleteAvatarIfExists };
