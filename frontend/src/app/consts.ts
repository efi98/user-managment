import {Gender} from "@interfaces";
import {environment} from "@environments";

export const BASE_URL = environment.apiBaseUrl;
export const GENDERS_LIST = [Gender.Male, Gender.Female, Gender.Other];
export const GENDER_LABELS: Record<Gender, string> = {
    [Gender.Male]: $localize`:@@genderMale:Male`,
    [Gender.Female]: $localize`:@@genderFemale:Female`,
    [Gender.Other]: $localize`:@@genderOther:Other`,
};
export const TOAST_TIMEOUT = 10_000;
export const MESSAGES = {
    NOT_LOGGED_IN: $localize`:@@notLoggedIn:not logged in.`,
    LOGIN_SUCCESS: $localize`:@@loginSuccess:Login successful!`,
    SIGNUP_SUCCESS: $localize`:@@signupSuccess:Signup successful!`,
    LOGOUT_SUCCESS: $localize`:@@logoutSuccess:Logged out successfully`,
    SERVER_DOWN: $localize`:@@serverDown:Server is currently unavailable.\\nPlease check your connection and try again.`,
    SESSION_EXPIRED: $localize`:@@sessionExpired:Your session has expired. Please log in again.`,
    CHANGES_CANCELLED: $localize`:@@changesCancelled:Changes cancelled`,
    USER_DELETED: $localize`:@@userDeleted:User deleted successfully`,
    USER_UPDATED: $localize`:@@userUpdated:User updated successfully`,
    AVATAR_UPDATED: $localize`:@@avatarUploaded:Avatar updated successfully`,
    AVATAR_DELETED: $localize`:@@avatarDeleted:Avatar deleted successfully`,
};