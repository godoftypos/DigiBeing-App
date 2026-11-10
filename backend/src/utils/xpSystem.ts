// XP System utilities for managing user level progression

interface XPCalculationResult {
    newLevel: number;
    currentXp: number;
    xpToNextLevel: number;
    leveledUp: boolean;
    levelsGained: number;
}

/**
 * Calculate XP requirements for a given level
 * Formula: 150 * level (e.g., Level 1 = 150 XP, Level 2 = 300 XP, Level 3 = 450 XP)
 */
export function getXpRequiredForLevel(level: number): number {
    return 150 * level;
}

/**
 * Calculate total XP required to reach a specific level from level 1
 */
export function getTotalXpForLevel(level: number): number {
    let totalXp = 0;
    for (let i = 1; i < level; i++) {
        totalXp += getXpRequiredForLevel(i);
    }
    return totalXp;
}

/**
 * Calculate current level and XP progress based on total XP earned
 */
export function calculateLevelFromTotalXp(totalXp: number): XPCalculationResult {
    let currentLevel = 1;
    let xpUsed = 0;
    let leveledUp = false;
    let levelsGained = 0;

    // Find the highest level the user can reach with their total XP
    while (true) {
        const xpNeededForNextLevel = getXpRequiredForLevel(currentLevel);
        
        if (totalXp >= xpUsed + xpNeededForNextLevel) {
            // User has enough XP for the next level
            xpUsed += xpNeededForNextLevel;
            currentLevel++;
            leveledUp = true;
            levelsGained++;
        } else {
            // User doesn't have enough XP for the next level
            break;
        }
    }

    // Calculate remaining XP and XP needed for next level
    const currentXp = totalXp - xpUsed;
    const xpToNextLevel = getXpRequiredForLevel(currentLevel) - currentXp;

    return {
        newLevel: currentLevel,
        currentXp,
        xpToNextLevel,
        leveledUp,
        levelsGained
    };
}

/**
 * Add XP to a user and calculate new level/progress
 */
export function addXpToUser(currentLevel: number, currentXp: number, xpToAdd: number): XPCalculationResult {
    // Calculate total XP the user has earned so far
    const totalXpEarned = getTotalXpForLevel(currentLevel) + currentXp;
    
    // Add the new XP
    const newTotalXp = totalXpEarned + xpToAdd;
    
    // Calculate new level and progress
    return calculateLevelFromTotalXp(newTotalXp);
}

/**
 * Normalize user XP data - useful for fixing inconsistent XP states
 * This function takes the user's total XP and recalculates their level and progress correctly
 */
export function normalizeUserXp(totalXpEarned: number): XPCalculationResult {
    return calculateLevelFromTotalXp(totalXpEarned);
}

/**
 * Get level progress as a percentage (0-100)
 */
export function getLevelProgress(currentXp: number, level: number): number {
    const xpNeededForLevel = getXpRequiredForLevel(level);
    return Math.round((currentXp / xpNeededForLevel) * 100);
}

/**
 * Get user's total XP earned across all levels
 */
export function getTotalXpEarned(level: number, currentXp: number): number {
    return getTotalXpForLevel(level) + currentXp;
}
