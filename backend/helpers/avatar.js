const path = require('node:path');
const fs = require('node:fs');
const { promisify } = require('node:util');
const unlink = promisify(fs.unlink);
const multer = require('multer');

const avatarsDir = path.join(process.cwd(), 'assets/uploads/avatars');

fs.mkdirSync(avatarsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, avatarsDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${req.params.username}-${Date.now()}${ext}`;
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
};

const avatar = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2 MB
});

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


module.exports = { uploadAvatar: avatar, avatarsDir, deleteAvatarIfExists };
