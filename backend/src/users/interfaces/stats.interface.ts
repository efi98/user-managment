import { SafeUser } from '@src/users';

export interface AgeStats {
    avg: number;
    min: number;
    max: number;
    median: number;
}

export interface UserStats {
    totalUsers: number;
    adminCount: number;
    adminPercent: number;
    lastSignups: SafeUser[];
    genderBreakdown: Record<string, number>;
    ageStats: AgeStats | null;
}
