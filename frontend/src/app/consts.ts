import {Gender} from "@interfaces";
import {environment} from "@environments";

export const BASE_URL = environment.apiBaseUrl;
export const GENDERS_LIST = [Gender.Male, Gender.Female, Gender.Other];
export const TOAST_TIMEOUT = 10_000;
export const MESSAGES = {
    NOT_LOGGED_IN: 'not logged in.',
    LOGIN_SUCCESS: 'Login successful!',
    SIGNUP_SUCCESS: 'Signup successful!',
    LOGOUT_SUCCESS: 'Logged out successfully',
    SERVER_DOWN: 'Server is currently unavailable.\nPlease check your connection and try again.',
    SESSION_EXPIRED: 'Your session has expired. Please log in again.',
    CHANGES_CANCELLED: 'Changes cancelled',
    USER_DELETED: 'User deleted successfully',
    USER_UPDATED: 'User updated successfully',
    AVATAR_UPDATED: 'Avatar updated successfully',
    AVATAR_DELETED: 'Avatar deleted successfully',
};