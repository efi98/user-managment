export enum GENDER {
    male = 'male',
    female = 'female',
    other = 'other',
}

export const CONSTS = {
    DEFAULT_AVATAR_FILENAME: 'default.jpg',

    // App messages / responses
    WELCOME_MESSAGE: 'Welcome to the User Management API',

    // Validation messages
    PASSWORD_MIN_LENGTH_MSG: 'Password must be 4 characters or more',
    GENDER_INVALID_MSG: 'Gender must be male, female, or other',
} as const;
