/**
 * Public-safe representation of a user returned by API endpoints.
 */
export interface SafeUser {
  username: string;
  displayName: string;
  birthdate: string;
  avatar: string;
  gender: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}
