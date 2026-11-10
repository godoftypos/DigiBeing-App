export interface User {
    id: string; // maps to MongoDB ObjectId (_id)
    name: string;
    email: string;

    // Personal Details
    profile_photo?: string;
    phone?: string;
    dateOfBirth?: Date;
    gender?: string;
    is_active: boolean;
    onboardingDone: boolean;

    // Risk / detection
    riskScore: number;
    detectedAppsCount: number;

    // Gamification Stats
    level: number;
    currentXp: number;
    xpToNextLevel: number;
    missionsCompleted: number;
    focusDays: number;
    maxStreak: number;
    currentStreak: number;
}