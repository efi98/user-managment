import zxcvbn from 'zxcvbn';
import {FormControl, FormGroup} from "@angular/forms";

// Enums
export enum Gender {
    Male = 'male',
    Female = 'female',
    Other = 'other'
}


export enum Severity {
    Success = 'success',
    Error = 'error',
    Info = 'info',
    Warning = 'warning'
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

// Form
export type UserFormField = 'username' | 'displayName' | 'password' | 'birthdate' | 'gender' | 'isAdmin';

export type UserFormModel = FormGroup<{
    username: FormControl<string | null>;
    displayName: FormControl<string | null>;
    password: FormControl<string | null>;
    birthdate: FormControl<string | null>;
    gender: FormControl<string | null>;
    isAdmin: FormControl<boolean | null>;
}>;

export interface UserFormConfig {
    editable?: boolean;
    visibleFields: UserFormField[];
    requiredFields?: UserFormField[];
    readonlyFields?: UserFormField[];
    canToggleEdit?: boolean;
    startInEditMode?: boolean;
    showMeta?: boolean;
    showDelete?: boolean;
    showCancel?: boolean;
    emitOnlyDirtyFields?: boolean;
    submitLabel?: string;
    editLabel?: string;
    deleteLabel?: string;
    emptyLabel?: string;
    hidePasswordStrength?: boolean;
    validatePassword?: boolean;
    showRequiredMarkers?: boolean;
}