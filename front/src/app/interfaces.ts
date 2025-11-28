import zxcvbn from 'zxcvbn';

// Enums
export enum Gender {
    Male = 'male',
    Female = 'female',
    Other = 'other'
}

export enum Mode {
    View = 'view',
    Edit = 'Edit'
}

// User
export interface User {
    username: string;
    displayName: string;
    password: string;
    age?: number;
    gender?: Gender;
    isAdmin: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type NewUser =
    Pick<User, 'username' | 'password'>
    & Partial<Pick<User, 'displayName' | 'age' | 'gender'>>;

export type UpdatedUser = Partial<Pick<User, 'displayName' | 'password' | 'age' | 'gender' | 'isAdmin'>>;

// Password
export interface PasswordValidation {
    isValid: boolean;
    score: zxcvbn.ZXCVBNScore;
    suggestions: string[];
    warning: zxcvbn.ZXCVBNFeedbackWarning;
}

// Toast
export type ToastSeverity = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    message: string;
    severity: ToastSeverity;
}

// Http Responses
export interface UserResponse {
    user: User;
    sessionExpiresAt?: number;
}
