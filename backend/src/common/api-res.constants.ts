export const API_RESPONSES = {
    // 200
    UPLOAD_AVATAR_SUCCESS: 'Avatar uploaded successfully',
    DELETE_AVATAR_SUCCESS: 'Avatar deleted successfully',
    // 400
    UPLOAD_AVATAR_REQ_FILE: 'No file uploaded',
    UPLOAD_AVATAR_INVALID_FORMAT: 'Only image files are allowed',
    PASSWORD_MIN_LENGTH: (min: number) => `Password must be ${min} characters or more`,
    GENDER_INVALID: 'Gender must be male, female, or other',
    BIRTHDAY_FORMAT: 'birthdate must be YYYY-MM-DD',
    BIRTHDAY_NOT_IN_FUTURE: 'birthdate cannot be in the future',
    BIRTHDAY_MIN_AGE: (min: number) => `age must be at least ${min}`,
    BIRTHDAY_MAX_AGE: (max: number) => `age must be at most ${max}`,
    //401
    UNAUTHORIZED: 'Not logged in',
    INCORRECT_PASSWORD: 'Incorrect password',
    //403
    CANNOT_CHANGE_ISADMIN_NOT_ADMIN: 'Only admins can change isAdmin',
    CANNOT_CHANGE_ISADMIN_SELF: 'Admins cannot change their own isAdmin',
    NOT_OWNER_OR_ADMIN: 'You can only modify your own account unless you are an admin',
    // 404
    USER_NOT_FOUND: (username: string) => `User '${username}' not found`,
    // 409
    USERNAME_EXISTS: (username: string) => `Username '${username}' already exists`,
};