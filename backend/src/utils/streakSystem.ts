// Simple daily app usage streak tracking

export interface StreakUpdateResult {
    currentStreak: number;
    maxStreak: number;
    streakUpdated: boolean;
    streakBroken: boolean;
    newRecord: boolean;
}

/**
 * Check if streak should be updated based on last update time
 * @param lastStreakUpdatedAt - Last time streak was updated
 * @param currentDate - Current date (optional, defaults to now)
 */
export function shouldUpdateStreak(
    lastStreakUpdatedAt: Date | null,
    currentDate: Date = new Date()
): {
    shouldUpdate: boolean;
    daysSinceLastUpdate: number;
    isFirstTime: boolean;
    isSameDay: boolean;
} {
    if (!lastStreakUpdatedAt) {
        return {
            shouldUpdate: true,
            daysSinceLastUpdate: 0,
            isFirstTime: true,
            isSameDay: false
        };
    }

    // Check if it's the same day
    const lastUpdateDate = new Date(lastStreakUpdatedAt);
    const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const lastUpdateDateOnly = new Date(lastUpdateDate.getFullYear(), lastUpdateDate.getMonth(), lastUpdateDate.getDate());
    
    const timeDiff = currentDateOnly.getTime() - lastUpdateDateOnly.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    return {
        shouldUpdate: daysDiff > 0, // Only update if it's a new day
        daysSinceLastUpdate: daysDiff,
        isFirstTime: false,
        isSameDay: daysDiff === 0
    };
}

/**
 * Update user streak for daily app usage
 * @param currentStreak - User's current streak
 * @param maxStreak - User's maximum streak achieved
 * @param lastStreakUpdatedAt - Last time streak was updated
 * @param currentDate - Current date (optional, defaults to now)
 */
export function updateDailyStreak(
    currentStreak: number,
    maxStreak: number,
    lastStreakUpdatedAt: Date | null,
    currentDate: Date = new Date()
): StreakUpdateResult {
    const streakCheck = shouldUpdateStreak(lastStreakUpdatedAt, currentDate);
    
    if (!streakCheck.shouldUpdate) {
        // Same day, no update needed
        return {
            currentStreak,
            maxStreak,
            streakUpdated: false,
            streakBroken: false,
            newRecord: false
        };
    }

    let newCurrentStreak = currentStreak;
    let newMaxStreak = maxStreak;
    let streakBroken = false;
    let newRecord = false;

    if (streakCheck.isFirstTime) {
        // First time tracking - start with 1
        newCurrentStreak = 1;
        newMaxStreak = Math.max(maxStreak, newCurrentStreak);
        newRecord = newMaxStreak > maxStreak;
    } else if (streakCheck.daysSinceLastUpdate === 1) {
        // Consecutive day - increment streak
        newCurrentStreak = currentStreak + 1;
        newMaxStreak = Math.max(maxStreak, newCurrentStreak);
        newRecord = newMaxStreak > maxStreak;
    } else if (streakCheck.daysSinceLastUpdate > 1) {
        // Missed days - reset streak to 1 (user opened today)
        streakBroken = currentStreak > 0;
        newCurrentStreak = 1;
        newMaxStreak = Math.max(maxStreak, newCurrentStreak);
        newRecord = newMaxStreak > maxStreak;
    }

    return {
        currentStreak: newCurrentStreak,
        maxStreak: newMaxStreak,
        streakUpdated: true,
        streakBroken,
        newRecord
    };
}
