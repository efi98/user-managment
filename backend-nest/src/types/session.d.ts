import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      username: string;
      displayName: string;
      age: number;
      profilePhoto: string;
      gender: string;
      isAdmin: boolean;
      createdAt: string;
      updatedAt: string;
    };
  }
}
