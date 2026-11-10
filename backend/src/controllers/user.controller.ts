import { Request } from 'express';
import { prisma } from '../lib/prisma';
import CustomResponse from '../utils/customResponse';
import { calculateRiskScore, generatePersonalizedMission, generateUsagePrediction, generateMultiplePersonalizedMissions } from '@/lib/genai';
import { addXpToUser } from '../utils/xpSystem';

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
    };
}

export const dashboard = async (req: AuthenticatedRequest, res: CustomResponse) => {
    try {
        const { id } = req.user;
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return res.failure("User not found", null, 404);
        }

        // Get today's usage data
        const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
        const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));
        
        const todayUsageData = await prisma.usageData.findMany({
            where: {
                userId: id,
                timestamp: {
                    gte: todayStart,
                    lte: todayEnd
                }
            },
            orderBy: { usage: 'desc' }
        });

        const missions = await generatePersonalizedMission(user, todayUsageData);
        const risk = await calculateRiskScore(id, todayUsageData);

        // Build dashboard response with actual data
        const dashboardData = {
            name: user.name,
            riskScore: risk,
            missions
        };

        res.success("Dashboard data retrieved successfully", dashboardData, 200);

    } catch (error) {
        res.failure("Failed to get dashboard data", error, 500);
    }
};

export const updateUsageData = async (req: AuthenticatedRequest, res: CustomResponse) => {
    try {
        const { id } = req.user;
        const { todayUsage, weekUsage, monthUsage } = req.body;

        console.log('Received data:', { todayUsage: todayUsage?.length, weekUsage: weekUsage?.length, monthUsage: monthUsage?.length });
        console.log('Today sample:', todayUsage?.[0]);

        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return res.failure("User not found", null, 404);
        }

        // Helper function to process usage data for a specific time range
        const processUsageData = async (usageArray: any[], timeRange: string, targetDate: Date) => {
            if (!usageArray || !Array.isArray(usageArray)) {
                console.log(`No ${timeRange} data to process`);
                return [];
            }
            
            console.log(`Processing ${timeRange} with ${usageArray.length} entries`);
            
            const processedEntries = [];
            
            // First, delete existing data for this time range and date to avoid duplicates
            const deleteResult = await prisma.usageData.deleteMany({
                where: {
                    userId: id,
                    timeRange: timeRange,
                    date: targetDate
                }
            });
            
            console.log(`Deleted ${deleteResult.count} existing ${timeRange} entries`);
            
            for (const entry of usageArray) {
                if (!entry.appName || !entry.packageName || typeof entry.totalTimeInForeground !== 'number') {
                    console.log('Skipping invalid entry:', { 
                        hasAppName: !!entry.appName, 
                        hasPackageName: !!entry.packageName, 
                        hasUsage: typeof entry.totalTimeInForeground,
                        entry: entry
                    });
                    continue; // Skip invalid entries
                }

                try {
                    // Create new usage data entry
                    const usageEntry = await prisma.usageData.create({
                        data: {
                            userId: id,
                            appName: entry.appName,
                            packageName: entry.packageName,
                            usage: entry.totalTimeInForeground, // Store in milliseconds
                            timeRange: timeRange,
                            date: targetDate,
                            timestamp: new Date()
                        }
                    });

                    processedEntries.push(usageEntry);

                } catch (entryError) {
                    console.error(`Error processing ${timeRange} usage entry:`, entryError);
                }
            }
            
            console.log(`Created ${processedEntries.length} ${timeRange} entries`);
            return processedEntries;
        };

        // Get current date references
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        
        const monthStart = new Date(today);
        monthStart.setDate(today.getDate() - 30);

        console.log('Date references:', { today, weekStart, monthStart });

        // Process all usage data concurrently
        const [todayEntries, weekEntries, monthEntries] = await Promise.all([
            processUsageData(todayUsage, 'today', today),
            processUsageData(weekUsage, 'week', weekStart),
            processUsageData(monthUsage, 'month', monthStart)
        ]);

        // Calculate total usage for risk score (using today's data)
        const totalTodayUsage = todayUsage?.reduce((sum: number, entry: any) => 
            sum + (entry.totalTimeInForeground || 0), 0) || 0;
        
        // Convert milliseconds to hours for risk calculation
        const totalHours = totalTodayUsage / (1000 * 60 * 60);
        const riskScore = Math.min(totalHours / 8, 1); // Normalize to 0-1 based on 8 hours

        // Calculate detected apps count
        const allPackages = new Set([
            ...(todayUsage?.map((entry: any) => entry.packageName) || []),
            ...(weekUsage?.map((entry: any) => entry.packageName) || []),
            ...(monthUsage?.map((entry: any) => entry.packageName) || [])
        ]);

        // Update user's stats
        try {
            await prisma.user.update({
                where: { id },
                data: {
                    detectedAppsCount: allPackages.size,
                    riskScore: riskScore
                }
            });

        } catch (updateError) {
            console.error('Error updating user stats:', updateError);
        }

        // Response with summary
        const response = {
            today: {
                entriesProcessed: todayEntries.length,
                totalUsageMinutes: Math.round(totalTodayUsage / (1000 * 60)),
                apps: todayUsage?.length || 0
            },
            week: {
                entriesProcessed: weekEntries.length,
                totalUsageMinutes: Math.round((weekUsage?.reduce((sum: number, entry: any) => 
                    sum + (entry.totalTimeInForeground || 0), 0) || 0) / (1000 * 60)),
                apps: weekUsage?.length || 0
            },
            month: {
                entriesProcessed: monthEntries.length,
                totalUsageMinutes: Math.round((monthUsage?.reduce((sum: number, entry: any) => 
                    sum + (entry.totalTimeInForeground || 0), 0) || 0) / (1000 * 60)),
                apps: monthUsage?.length || 0
            },
            userStats: {
                riskScore: riskScore,
                detectedApps: allPackages.size
            }
        };

        console.log('Final response:', response);
        res.success("Usage data updated successfully", response, 200);

    } catch (error) {
        console.error('Error in updateUsageData:', error);
        res.failure("Failed to update usage data", error, 500);
    }
};

export const allMissions = async (req: AuthenticatedRequest, res: CustomResponse) => {
    try {
        const { id } = req.user;
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return res.failure("User not found", null, 404);
        }

        // Get today's date for mission filtering
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        // 1. Get or generate 2 daily missions (global missions)
        let dailyMissions = await prisma.mission.findMany({
            where: {
                type: 'daily',
                isGlobal: true
            },
            include: {
                userMissions: {
                    where: {
                        userId: id,
                        assignedAt: {
                            gte: today,
                            lte: todayEnd
                        }
                    }
                }
            },
            take: 2
        });

        // If we don't have 2 daily missions, generate them using GenAI
        if (dailyMissions.length < 2) {
            const missingDailyCount = 2 - dailyMissions.length;
            
            // Generate daily missions using GenAI
            const generatedDailyMissions = [
                {
                    title: "Morning Mindfulness",
                    description: "Start your day with 10 minutes of meditation",
                    difficulty: "easy" as const,
                    icon: "sunny-outline",
                    goalMinutes: 10,
                    rewardXp: 15,
                    category: "wellness",
                    type: "daily" as const
                },
                {
                    title: "Digital Sunset",
                    description: "No screens 1 hour before bedtime",
                    difficulty: "medium" as const,
                    icon: "moon-outline",
                    goalMinutes: 60,
                    rewardXp: 20,
                    category: "wellness",
                    type: "daily" as const
                }
            ];

            // Create missing daily missions in the database
            for (let i = 0; i < missingDailyCount && i < generatedDailyMissions.length; i++) {
                const missionData = generatedDailyMissions[i];
                
                const newMission = await prisma.mission.create({
                    data: {
                        title: missionData.title,
                        description: missionData.description,
                        difficulty: missionData.difficulty,
                        icon: missionData.icon,
                        goalMinutes: missionData.goalMinutes,
                        rewardXp: missionData.rewardXp,
                        category: missionData.category,
                        type: missionData.type,
                        isGlobal: true
                    },
                    include: {
                        userMissions: {
                            where: {
                                userId: id,
                                assignedAt: {
                                    gte: today,
                                    lte: todayEnd
                                }
                            }
                        }
                    }
                });

                dailyMissions.push(newMission);
            }
        }

        // 2. Check if personalized missions exist for today
        let personalizedMissions = await prisma.userMission.findMany({
            where: {
                userId: id,
                missionId: null, // Personalized missions don't have a missionId
                assignedAt: {
                    gte: today,
                    lte: todayEnd
                }
            }
        });

        // If no personalized missions exist for today, generate 2 new ones
        if (personalizedMissions.length === 0) {
            // Get user's weekly usage data
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - 7);

            const weeklyUsageData = await prisma.usageData.findMany({
                where: {
                    userId: id,
                    date: {
                        gte: weekStart,
                        lte: today
                    }
                },
                orderBy: { usage: 'desc' }
            });

            // Generate 2 personalized missions using GenAI
            const generatedPersonalizedMissions = await generateMultiplePersonalizedMissions(
                user, 
                weeklyUsageData, 
                2 // Generate 2 personalized missions
            );

            // Create personalized missions in the database with mission data embedded
            for (let i = 0; i < generatedPersonalizedMissions.length; i++) {
                const missionData = generatedPersonalizedMissions[i];
                
                const personalizedMission = await prisma.userMission.create({
                    data: {
                        userId: id,
                        missionId: null, // No linked mission for personalized ones
                        title: missionData.title,
                        description: missionData.description,
                        difficulty: missionData.difficulty,
                        rewardXp: missionData.rewardXp,
                        icon: missionData.icon,
                        goalMinutes: missionData.goalMinutes,
                        category: missionData.category,
                        progress: 0,
                        isCompleted: false,
                        assignedAt: new Date(),
                        date: today
                    }
                });

                personalizedMissions.push(personalizedMission);
            }
        }

        // 3. Format response data
        const formattedDailyMissions = dailyMissions.map(mission => {
            const userMission = mission.userMissions?.[0];
            return {
                id: mission.id,
                title: mission.title,
                description: mission.description,
                difficulty: mission.difficulty.toLowerCase(),
                rewardXp: mission.rewardXp,
                icon: mission.icon,
                goalMinutes: mission.goalMinutes,
                category: mission.category,
                type: "daily",
                progress: userMission?.progress || 0,
                maxProgress: mission.goalMinutes,
                isCompleted: userMission?.isCompleted || false,
                userMissionId: userMission?.id || null
            };
        });

        // For now, return static personalized missions until schema is fully updated
        const formattedPersonalizedMissions = personalizedMissions.map((userMission, index) => {
            // Use actual mission data if available, otherwise fallback to static data
            const staticFallback = [
                {
                    title: "Focus Session",
                    description: "Complete a 45-minute focused work session",
                    difficulty: "medium",
                    rewardXp: 15,
                    icon: "book-outline",
                    goalMinutes: 45,
                    category: "focus"
                },
                {
                    title: "Digital Break",
                    description: "Take a 30-minute break from all screens",
                    difficulty: "easy",
                    rewardXp: 10,
                    icon: "leaf-outline",
                    goalMinutes: 30,
                    category: "wellness"
                }
            ][index] || {
                title: "Personalized Mission",
                description: "Complete your personalized challenge",
                difficulty: "medium",
                rewardXp: 15,
                icon: "star-outline",
                goalMinutes: 30,
                category: "personal"
            };

            return {
                id: userMission.id,
                title: userMission.title || staticFallback.title,
                description: userMission.description || staticFallback.description,
                difficulty: (userMission.difficulty?.toLowerCase() || staticFallback.difficulty),
                rewardXp: userMission.rewardXp || staticFallback.rewardXp,
                icon: userMission.icon || staticFallback.icon,
                goalMinutes: userMission.goalMinutes || staticFallback.goalMinutes,
                category: userMission.category || staticFallback.category,
                type: "personalized",
                progress: userMission.progress || 0,
                maxProgress: userMission.goalMinutes || staticFallback.goalMinutes,
                isCompleted: userMission.isCompleted || false,
                userMissionId: userMission.id
            };
        });

        const allMissions = [...formattedDailyMissions, ...formattedPersonalizedMissions];
        const completedMissions = allMissions.filter(m => m.isCompleted).length;

        res.success("Missions retrieved successfully", {
            missions: allMissions,
            dailyMissions: formattedDailyMissions,
            personalizedMissions: formattedPersonalizedMissions,
            totalMissions: allMissions.length,
            completedMissions: completedMissions
        }, 200);

    } catch (error) {
        console.error('Error in allMissions:', error);
        res.failure("Failed to get missions", error, 500);
    }
};

export const markMissionAsComplete = async (req: AuthenticatedRequest, res: CustomResponse) => {
    try {
        const { id } = req.user;
        const { missionId, userMissionId } = req.body;

        if (!missionId && !userMissionId) {
            return res.failure("Mission ID or User Mission ID is required", null, 400);
        }

        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return res.failure("User not found", null, 404);
        }

        let userMission;
        let mission;

        // Handle personalized missions (have userMissionId but no missionId)
        if (userMissionId) {
            userMission = await prisma.userMission.findUnique({
                where: { id: userMissionId },
                include: { mission: true }
            });

            if (!userMission || userMission.userId !== id) {
                return res.failure("User mission not found", null, 404);
            }

            // For personalized missions, the mission data is stored in the UserMission itself
            mission = userMission.mission || {
                id: userMission.id,
                rewardXp: userMission.rewardXp || 15,
                goalMinutes: userMission.goalMinutes || 100
            };
        } else {
            // Handle daily missions (have missionId)
            mission = await prisma.mission.findUnique({
                where: { id: missionId }
            });

            if (!mission) {
                return res.failure("Mission not found", null, 404);
            }

            // Find or create user mission
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayEnd = new Date(today);
            todayEnd.setHours(23, 59, 59, 999);

            userMission = await prisma.userMission.findFirst({
                where: {
                    userId: id,
                    missionId: missionId,
                    assignedAt: {
                        gte: today,
                        lte: todayEnd
                    }
                }
            });

            if (!userMission) {
                userMission = await prisma.userMission.create({
                    data: {
                        userId: id,
                        missionId: missionId,
                        progress: 0,
                        isCompleted: false
                    }
                });
            }
        }

        // Mark mission as complete
        const updatedUserMission = await prisma.userMission.update({
            where: { id: userMission.id },
            data: {
                isCompleted: true,
                completedAt: new Date(),
                progress: mission?.goalMinutes || 100 // Default progress completion
            }
        });

        // Calculate XP reward
        const xpReward = mission?.rewardXp || 15; // Default XP for personalized missions
        
        // Use the new XP system to calculate level progression
        const xpResult = addXpToUser(user.level, user.currentXp, xpReward);
        
        // Update user XP and level
        await prisma.user.update({
            where: { id },
            data: {
                currentXp: xpResult.currentXp,
                level: xpResult.newLevel,
                xpToNextLevel: xpResult.xpToNextLevel,
                missionsCompleted: (user.missionsCompleted || 0) + 1
            }
        });

        console.log('Mission completed with updates:', {
            xp: { earned: xpReward, newLevel: xpResult.newLevel, levelUp: xpResult.leveledUp }
        });

        res.success("Mission marked as complete", {
            missionId: mission?.id || null,
            userMissionId: userMission.id,
            xpEarned: xpReward,
            currentXp: xpResult.currentXp,
            level: xpResult.newLevel,
            xpToNextLevel: xpResult.xpToNextLevel,
            levelUp: xpResult.leveledUp,
            levelsGained: xpResult.levelsGained
        }, 200);

    } catch (error) {
        console.error('Error in markMissionAsComplete:', error);
        res.failure("Failed to mark mission as complete", error, 500);
    }
};

export const getUsageData = async (req: AuthenticatedRequest, res: CustomResponse) => {
    try {
        const { id } = req.user;
        const { timeRange = 'today' } = req.query;

        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return res.failure("User not found", null, 404);
        }

        // Get usage data for the specified time range
        const usageData = await prisma.usageData.findMany({
            where: {
                userId: id,
                timeRange: timeRange as string
            },
            orderBy: {
                usage: 'desc'
            }
        });

        // Group by date if needed and aggregate
        const aggregatedData = usageData.reduce((acc, entry) => {
            const key = entry.packageName;
            if (!acc[key]) {
                acc[key] = {
                    appName: entry.appName,
                    packageName: entry.packageName,
                    totalUsage: 0,
                    timeRange: entry.timeRange
                };
            }
            acc[key].totalUsage += entry.usage;
            return acc;
        }, {} as Record<string, any>);

        const result = Object.values(aggregatedData).sort((a: any, b: any) => b.totalUsage - a.totalUsage);

        res.success("Usage data retrieved successfully", {
            timeRange,
            apps: result,
            totalApps: result.length,
            totalUsageMinutes: Math.round(result.reduce((sum: number, app: any) => sum + app.totalUsage, 0) / (1000 * 60))
        }, 200);

    } catch (error) {
        console.error('Error in getUsageData:', error);
        res.failure("Failed to get usage data", error, 500);
    }
};

export const getAchievements = async (req: AuthenticatedRequest, res: CustomResponse) => {
    try {
        const { id } = req.user;
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return res.failure("User not found", null, 404);
        }

        // Get all achievements with user completion status
        const achievements = await prisma.achievement.findMany({
            include: {
                completedAchievements: {
                    where: {
                        userId: id
                    },
                    select: {
                        id: true,
                        completedAt: true,
                        progress: true
                    }
                }
            },
            orderBy: [
                { category: 'asc' },
                { created_at: 'asc' }
            ]
        });

        // Format achievements with completion status
        const formattedAchievements = achievements.map(achievement => {
            const isCompleted = achievement.completedAchievements.length > 0;
            const completionData = isCompleted ? achievement.completedAchievements[0] : null;

            return {
                id: achievement.id,
                title: achievement.title,
                description: achievement.description,
                slug: achievement.slug,
                icon: achievement.icon,
                category: achievement.category,
                threshold: achievement.threshold,
                isCompleted,
                completedAt: completionData?.completedAt || null,
                progress: completionData?.progress || null,
                createdAt: achievement.created_at
            };
        });

        // Calculate completion statistics
        const totalAchievements = formattedAchievements.length;
        const completedAchievements = formattedAchievements.filter(a => a.isCompleted).length;
        const completionPercentage = totalAchievements > 0 ? Math.round((completedAchievements / totalAchievements) * 100) : 0;

        res.success("Achievements retrieved successfully", {
            achievements: formattedAchievements,
            stats: {
                total: totalAchievements,
                completed: completedAchievements,
                remaining: totalAchievements - completedAchievements,
                completionPercentage
            }
        }, 200);

    } catch (error) {
        console.error('Error fetching achievements:', error);
        res.failure("Failed to get achievements", error, 500);
    }
};

export const analytics = async (req: AuthenticatedRequest, res: CustomResponse) => {
    try {
        const { id } = req.user;
        const { timeRange = 'week' } = req.query;

        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return res.failure("User not found", null, 404);
        }

        // Get current date references
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Calculate date ranges based on timeRange
        let startDate: Date;
        let endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);

        switch (timeRange as string) {
            case 'today':
                startDate = new Date(today);
                break;
            case 'week':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 6); // Last 7 days including today
                break;
            case 'month':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 29); // Last 30 days including today
                break;
            default:
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 6);
        }

        // Get usage data for the specified time range
        const usageData = await prisma.usageData.findMany({
            where: {
                userId: id,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: [
                { date: 'asc' },
                { usage: 'desc' }
            ]
        });

        // Aggregate app usage
        const appUsageMap = new Map<string, { name: string, usage: number, packageName: string }>();
        let totalUsage = 0;

        usageData.forEach(entry => {
            const usageMinutes = Math.round(entry.usage / (1000 * 60)); // Convert milliseconds to minutes
            totalUsage += usageMinutes;
            
            if (appUsageMap.has(entry.packageName)) {
                appUsageMap.get(entry.packageName)!.usage += usageMinutes;
            } else {
                appUsageMap.set(entry.packageName, {
                    name: entry.appName,
                    usage: usageMinutes,
                    packageName: entry.packageName
                });
            }
        });

        // Sort apps by usage and calculate percentages
        const appUsage = Array.from(appUsageMap.values())
            .sort((a, b) => b.usage - a.usage)
            .map(app => ({
                name: app.name,
                usage: app.usage,
                percentage: totalUsage > 0 ? Math.round((app.usage / totalUsage) * 100) : 0,
                packageName: app.packageName
            }));

        // Get daily usage pattern (for weekly/monthly view)
        const dailyUsageMap = new Map<string, number>();
        usageData.forEach(entry => {
            const dateKey = entry.date.toISOString().split('T')[0];
            const usageMinutes = Math.round(entry.usage / (1000 * 60));
            dailyUsageMap.set(dateKey, (dailyUsageMap.get(dateKey) || 0) + usageMinutes);
        });

        // Generate weekly trend data
        const weeklyTrend = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            const dayName = dayNames[date.getDay()];
            const usage = dailyUsageMap.get(dateKey) || 0;
            
            weeklyTrend.push({
                day: dayName,
                usage: usage
            });
        }

        // Calculate overview statistics
        const averageDailyUsage = Math.round(totalUsage / Math.max(weeklyTrend.length, 1));
        const mostUsedApp = appUsage.length > 0 ? appUsage[0] : null;
        
        // Find most and least used days
        const sortedDays = [...weeklyTrend].sort((a, b) => b.usage - a.usage);
        const mostUsedDay = sortedDays[0]?.day || "Unknown";
        const leastUsedDay = sortedDays[sortedDays.length - 1]?.day || "Unknown";

        // Calculate improvement (compare with previous period)
        const previousStartDate = new Date(startDate);
        const previousEndDate = new Date(startDate);
        const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        previousStartDate.setDate(startDate.getDate() - periodDays);
        previousEndDate.setDate(startDate.getDate() - 1);

        const previousUsageData = await prisma.usageData.findMany({
            where: {
                userId: id,
                date: {
                    gte: previousStartDate,
                    lte: previousEndDate
                }
            }
        });

        const previousTotalUsage = previousUsageData.reduce((sum, entry) => 
            sum + Math.round(entry.usage / (1000 * 60)), 0);
        
        const improvement = previousTotalUsage > 0 
            ? Math.round(((previousTotalUsage - totalUsage) / previousTotalUsage) * 100)
            : 0;

        // Calculate goals achievement (mock logic - can be enhanced)
        const dailyLimit = 360; // 6 hours in minutes
        const achievedDays = weeklyTrend.filter(day => day.usage <= dailyLimit).length;

        // Use GenAI for comprehensive risk analysis
        const aiRiskAnalysis = await calculateRiskScore(id, usageData);
        
        // Generate usage prediction and line chart data using GenAI
        const usagePrediction = await generateUsagePrediction(weeklyTrend, timeRange as string);

        const analyticsData = {
            overview: {
                totalScreenTime: totalUsage,
                averageDailyUsage: averageDailyUsage,
                mostUsedDay: mostUsedDay,
                leastUsedDay: leastUsedDay,
                improvement: improvement,
                mostUsedApp: mostUsedApp?.name || "No data",
                peakUsageTime: "6:00 PM" // This could be calculated from hourly data if available
            },
            appUsage: appUsage.slice(0, 10), // Top 10 apps
            weeklyTrend: weeklyTrend,
            goals: {
                dailyLimit: dailyLimit,
                achieved: achievedDays,
                totalDays: weeklyTrend.length
            },
            riskAnalysis: {
                currentScore: aiRiskAnalysis.score,
                trend: aiRiskAnalysis.trend,
                factors: aiRiskAnalysis.riskFactors,
                level: aiRiskAnalysis.level,
                recommendations: aiRiskAnalysis.recommendations
            },
            usagePrediction: {
                actualUsage: usagePrediction.actualUsage,
                predictedUsage: usagePrediction.predictedUsage,
                riskPrediction: usagePrediction.riskPrediction,
                labels: usagePrediction.labels,
                insights: usagePrediction.insights
            },
            summary: {
                totalApps: appUsage.length,
                detectedApps: user.detectedAppsCount,
                timeRange: timeRange as string,
                dataPoints: usageData.length
            }
        };

        res.success("Analytics data retrieved successfully", analyticsData, 200);

    } catch (error) {
        console.error('Error in analytics:', error);
        res.failure("Failed to get analytics data", error, 500);
    }
};