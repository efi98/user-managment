import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      username: string;
      displayName: string;
      birthdate: string;
      avatar: string;
      gender: string;
      isAdmin: boolean;
      createdAt: string;
      updatedAt: string;
    };
  }
}
