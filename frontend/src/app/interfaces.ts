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
    birthdate?: string | Date;
    gender?: Gender;
    isAdmin: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type NewUser =
    Pick<User, 'username' | 'password'>
    & Partial<Pick<User, 'displayName' | 'birthdate' | 'gender'>>;

export type UpdatedUser = Partial<Pick<User, 'displayName' | 'password' | 'birthdate' | 'gender' | 'isAdmin'>>;

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