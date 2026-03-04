export const API_RESPONSES = {
    AVATAR_UPLOADED: {
        code: 'AVATAR_UPLOADED',
        message: 'Profile image uploaded successfully',
        status: 200,
    },
    AVATAR_DELETED: {
        code: 'AVATAR_DELETED',
        message: 'Avatar deleted',
        status: 200,
    },
    NO_FILE_UPLOADED: {
        code: 'NO_FILE_UPLOADED',
        message: 'No file uploaded (field name should be "avatar")',
        status: 400,
    },
    GENDER_INVALID: {
        code: 'GENDER_INVALID',
        message: 'Gender must be male, female, or other',
        status: 400,
    },
    PASSWORD_MIN_LENGTH: {
        code: 'PASSWORD_MIN_LENGTH',
        message: 'Password must be 4 characters or more',
        status: 400,
    },
    AVATAR_INVALID_FORMAT: {
        code: 'AVATAR_INVALID_FORMAT',
        message: 'Only image files are allowed',
        status: 400,
    },

    INCORRECT_PASSWORD: {
        code: 'INCORRECT_PASSWORD',
        message: 'Incorrect password',
        status: 401,
    },
    UNAUTHENTICATED: {
        code: 'UNAUTHENTICATED',
        message: 'Not logged in',
        status: 401,
    },

    PERMISSION_DENIED: {
        code: 'PERMISSION_DENIED',
        message: 'Only admins can change isAdmin',
        status: 403,
    },

    USER_NOT_FOUND: {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
        status: 404,
    },

    USERNAME_EXISTS: {
        code: 'USERNAME_EXISTS',
        message: 'Username already exists',
        status: 409,
    },

    FAILED_LOGOUT: {
        code: 'FAILED_LOGOUT',
        message: 'Failed to logout',
        status: 500,
    }
};