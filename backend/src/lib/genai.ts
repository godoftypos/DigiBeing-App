import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
// Using gemini-1.5-pro as requested. For faster, cheaper responses, consider 'gemini-1.5-flash'.
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// --- Helper function for exponential backoff ---
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Reusable and robust function to call the AI model ---
async function generateWithRetry(prompt: string, maxRetries = 3) {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            // Configuration to force the model to output only JSON
            const generationConfig: GenerationConfig = {
                responseMimeType: "application/json",
            };

            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig,
            });
            
            const responseText = result.response.text();
            return JSON.parse(responseText); // Directly parse the guaranteed JSON response

        } catch (error: any) {
            if (error.status === 429 && attempt < maxRetries - 1) {
                const retryDelay = Math.pow(2, attempt) * 1000 + Math.random() * 1000; // Exponential backoff
                console.warn(`Rate limit hit. Retrying in ${Math.round(retryDelay / 1000)}s...`);
                await sleep(retryDelay);
                attempt++;
            } else {
                console.error(`Failed to generate content after ${attempt + 1} attempts.`, error);
                throw error; // Re-throw the error if it's not a rate limit or if retries are exhausted
            }
        }
    }
    return null; // Return null if all retries fail
}


export async function generatePersonalizedMission(userProfile: any, usageData: any) {
    try {
        const prompt = `
Based on the user's digital behavior, generate a personalized mission:

User Profile:
- Risk Score: ${userProfile.riskScore}
- Most Used App: ${usageData.mostUsedApp}
- Daily Average: ${usageData.avgScreenTime} minutes
- Previous Missions: ${userProfile.completedMissions}

Usage Patterns:
${JSON.stringify(usageData.patterns)}

Generate a mission that is:
1. Specific and achievable
2. Tailored to their usage patterns
3. Progressive difficulty based on success rate
4. Engaging and motivational

Return ONLY a valid JSON object in this exact format:
{
  "title": "Mission Title",
  "description": "Detailed description",
  "difficulty": "easy",
  "goal": {
    "type": "time_limit",
    "target": 60,
    "unit": "minutes"
  },
  "reward": {
    "xp": 15
  },
  "category": "social_media"
}`;

        const missionJson = await generateWithRetry(prompt);
        
        // If the AI call fails after retries, return a fallback.
        if (!missionJson) throw new Error("AI generation failed after multiple retries.");

        return missionJson;

    } catch (error) {
        console.error('Error generating personalized mission:', error);
        
        // Return fallback mission if anything goes wrong
        return {
            title: "Digital Wellness Challenge",
            description: "Take a 30-minute break from your phone",
            difficulty: "easy",
            goal: { type: "app_break", target: 30, unit: "minutes" },
            reward: { xp: 10 },
            category: "wellness"
        };
    }
}

export async function generateMultiplePersonalizedMissions(userProfile: any, usageData: any[], count: number = 2) {
    try {
        // Analyze top apps and usage patterns
        const sortedApps = usageData.sort((a, b) => b.usage - a.usage).slice(0, 5);
        const totalUsage = usageData.reduce((sum, app) => sum + app.usage, 0);
        const totalUsageHours = Math.round(totalUsage / (1000 * 60 * 60));

        // Get current time for time-zone based missions
        const currentHour = new Date().getHours();
        const timeZone = currentHour < 12 ? "morning" : currentHour < 18 ? "afternoon" : "evening";

        const prompt = `
Based on the user's digital behavior, generate ${count} app-specific personalized missions that focus on limiting or controlling app usage:

User Profile:
- Risk Score: ${userProfile.riskScore || 0.3}
- Total Screen Time: ${Math.round(totalUsage / (1000 * 60))} minutes this week
- Current Time Zone: ${timeZone}
- Top Apps by Usage: ${sortedApps.map(app => `${app.appName || app.packageName}: ${Math.round(app.usage / (1000 * 60))} min`).join(', ')}

Usage Data Details:
${JSON.stringify(sortedApps.map(app => ({
    appName: app.appName || app.packageName,
    packageName: app.packageName,
    usageMinutes: Math.round(app.usage / (1000 * 60)),
    usageHours: Math.round(app.usage / (1000 * 60 * 60))
})), null, 2)}

Create ${count} missions that are APP-SPECIFIC and focus on:
1. Time limits for their most used apps (e.g., "Use Instagram for only 1 hour today")
2. Time-zone restrictions (e.g., "No social media after 9 PM" or "No games during work hours 9-5")
3. App breaks (e.g., "Don't open TikTok for 4 hours straight")
4. App substitution (e.g., "Replace 30 minutes of YouTube with reading")
5. Productivity challenges (e.g., "Use work apps only during morning hours")

Mission Requirements:
- Target their ACTUAL most-used apps from the usage data
- Include specific time limits (e.g., 1 hour, 30 minutes, 2 hours max)
- Include time-zone restrictions when relevant (morning, afternoon, evening, night)
- Mention the actual app name in title and description
- Make them realistic but challenging (reduce usage by 20-40%)
- Vary difficulty based on usage reduction amount

Return ONLY a valid JSON array in this exact format:
[
  {
    "title": "Limit [AppName] to X hours",
    "description": "Keep your [AppName] usage under X minutes/hours today",
    "difficulty": "easy|medium|hard",
    "icon": "phone-portrait-outline|time-outline|ban-outline|apps-outline",
    "goalMinutes": 60,
    "rewardXp": 10-20,
    "category": "app_limit|time_zone|app_break|productivity",
    "type": "personalized",
    "targetApp": "com.package.name",
    "restrictionType": "time_limit|time_zone|no_usage|reduced_usage"
  }
]

Examples based on common apps:
- Instagram limit: "Use Instagram for maximum 45 minutes today"
- TikTok evening ban: "No TikTok after 8 PM tonight"
- YouTube productivity: "Limit YouTube to 1 hour during work hours (9 AM - 5 PM)"
- Gaming break: "Take a 3-hour break from mobile games"
- Social media morning: "No social media before 10 AM"`;

        const missionsJson = await generateWithRetry(prompt);
        
        if (!missionsJson || !Array.isArray(missionsJson)) {
            throw new Error("AI generation failed or returned invalid format");
        }

        return missionsJson.slice(0, count); // Ensure we don't get more than requested

    } catch (error) {
        console.error('Error generating multiple personalized missions:', error);
        
        // Return app-specific fallback missions based on usage data
        const fallbackMissions = [];
        const topApps = usageData.sort((a, b) => b.usage - a.usage).slice(0, count);
        
        // Generate app-specific missions based on top apps
        for (let i = 0; i < Math.min(count, topApps.length); i++) {
            const app = topApps[i];
            const currentUsageMinutes = Math.round(app.usage / (1000 * 60));
            const targetMinutes = Math.max(30, Math.round(currentUsageMinutes * 0.7)); // 30% reduction
            const appName = app.appName || app.packageName.split('.').pop() || 'App';
            
            const missionTypes = [
                {
                    title: `Limit ${appName} to ${Math.round(targetMinutes/60)}h`,
                    description: `Keep your ${appName} usage under ${targetMinutes} minutes today`,
                    category: "app_limit",
                    icon: "time-outline",
                    restrictionType: "time_limit"
                },
                {
                    title: `No ${appName} After 9 PM`,
                    description: `Avoid using ${appName} after 9 PM tonight`,
                    category: "time_zone",
                    icon: "ban-outline",
                    restrictionType: "time_zone"
                },
                {
                    title: `${appName} Break Challenge`,
                    description: `Take a 4-hour break from ${appName}`,
                    category: "app_break",
                    icon: "pause-outline",
                    restrictionType: "no_usage"
                }
            ];
            
            const selectedMission = missionTypes[i % missionTypes.length];
            
            fallbackMissions.push({
                title: selectedMission.title,
                description: selectedMission.description,
                difficulty: currentUsageMinutes > 120 ? "medium" : "easy",
                icon: selectedMission.icon,
                goalMinutes: targetMinutes,
                rewardXp: currentUsageMinutes > 120 ? 20 : 15,
                category: selectedMission.category,
                type: "personalized",
                targetApp: app.packageName,
                restrictionType: selectedMission.restrictionType
            });
        }

        // If we need more missions and don't have enough apps, add generic app-focused ones
        while (fallbackMissions.length < count) {
            const genericAppMissions = [
                {
                    title: "Productivity Apps Only",
                    description: "Use only work/productivity apps for the next 2 hours",
                    difficulty: "medium",
                    icon: "briefcase-outline",
                    goalMinutes: 120,
                    rewardXp: 15,
                    category: "productivity",
                    type: "personalized",
                    targetApp: null,
                    restrictionType: "app_category"
                },
                {
                    title: "Social Media Detox",
                    description: "Avoid all social media apps for 3 hours",
                    difficulty: "medium",
                    icon: "people-outline",
                    goalMinutes: 180,
                    rewardXp: 20,
                    category: "app_break",
                    type: "personalized", 
                    targetApp: null,
                    restrictionType: "category_ban"
                }
            ];
            
            fallbackMissions.push(genericAppMissions[fallbackMissions.length % genericAppMissions.length]);
        }

        return fallbackMissions.slice(0, count);
    }
}

export async function calculateRiskScore(userId: string, usageData: any) {
    try {
        const metrics = extractMetrics(usageData);
        
        const prompt = `
Analyze these digital usage metrics and provide comprehensive risk assessment:

Metrics:
${JSON.stringify(metrics, null, 2)}

Based on this data, assess the digital wellness risk and provide:
1. Risk adjustment factor (between -0.2 to +0.2)
2. Top 3 risk factors
3. Personalized recommendations
4. Current risk trend (improving, worsening, stable)

Return ONLY a valid JSON object in this exact format:
{
  "riskAdjustment": 0.1,
  "riskFactors": ["High social media usage", "Late night phone usage", "Frequent app switching"],
  "recommendations": ["Set app time limits", "Use do not disturb mode", "Create phone-free zones"],
  "trend": "worsening"
}`;

        const aiInsights = await generateWithRetry(prompt);

        if (!aiInsights) throw new Error("AI risk assessment failed after multiple retries.");

        const baseScore = calculateBaseScore(metrics);
        const aiAdjustment = aiInsights.riskAdjustment || 0;
        const finalScore = Math.min(Math.max(baseScore + aiAdjustment, 0), 1);

        return {
            score: finalScore,
            level: getRiskLevel(finalScore),
            factors: metrics,
            riskFactors: aiInsights.riskFactors,
            recommendations: aiInsights.recommendations,
            trend: aiInsights.trend || "stable"
        };

    } catch (error) {
        console.error('Error calculating risk score:', error);
        
        // Return fallback risk assessment
        return {
            score: 0.3,
            level: "moderate",
            factors: {},
            riskFactors: ["Unable to analyze usage patterns"],
            recommendations: ["Monitor your screen time", "Set daily usage goals"],
            trend: "stable"
        };
    }
}

export async function generateUsagePrediction(historicalData: any[], timeRange: string = 'week') {
    try {
        const prompt = `
Analyze this historical usage data and generate predictions:

Historical Data (last ${timeRange}):
${JSON.stringify(historicalData, null, 2)}

Based on the patterns, generate:
1. Predicted usage for the next 7 days
2. Risk-based usage projection (what usage might look like if current trends continue)
3. Both actual and predicted values should be in minutes

The historical data shows actual usage, predict future usage patterns and risk scenarios.

Return ONLY a valid JSON object in this exact format:
{
  "actualUsage": [120, 95, 150, 80, 200, 175, 90],
  "predictedUsage": [130, 100, 160, 85, 210, 185, 95],
  "riskPrediction": [180, 150, 220, 140, 280, 250, 160],
  "labels": ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"],
  "insights": ["Usage trending upward", "Weekend spikes expected", "High risk periods identified"]
}`;

        const predictionData = await generateWithRetry(prompt);

        if (!predictionData) throw new Error("AI prediction failed after multiple retries.");

        return predictionData;

    } catch (error) {
        console.error('Error generating usage prediction:', error);
        
        // Return fallback prediction data
        const fallbackData = historicalData.slice(-7);
        const actualUsage = fallbackData.map(day => day.usage || 0);
        const avgUsage = actualUsage.reduce((a, b) => a + b, 0) / actualUsage.length || 60;
        
        return {
            actualUsage: actualUsage,
            predictedUsage: actualUsage.map(usage => usage + Math.random() * 20 - 10), // slight variation
            riskPrediction: actualUsage.map(usage => usage * 1.5), // 50% increase for risk
            labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"],
            insights: ["Prediction based on historical averages", "Monitor for pattern changes"]
        };
    }
}

// --- Helper functions (unchanged) ---
function extractMetrics(usageData: any) {
    const totalUsage = usageData.reduce((sum: number, app: any) => sum + app.usage, 0);
    const avgUsage = totalUsage / usageData.length || 0;
    
    return {
        totalScreenTime: Math.round(totalUsage / 60), // minutes
        averageAppUsage: Math.round(avgUsage / 60), // minutes
        appCount: usageData.length,
        socialMediaUsage: usageData
            .filter((app: any) => ['instagram', 'tiktok', 'facebook', 'twitter'].some(social => 
                app.packageName.toLowerCase().includes(social)
            ))
            .reduce((sum: number, app: any) => sum + app.usage, 0),
        longestSession: Math.max(...usageData.map((app: any) => app.usage), 0)
    };
}

function calculateBaseScore(metrics: any) {
    const weights = {
        excessiveUsage: 0.3,
        lateNightUsage: 0.25,
        compulsiveChecking: 0.2,
        appDiversity: 0.15,
        socialMediaRatio: 0.1
    };

    const excessiveUsage = Math.min(metrics.totalScreenTime / 480, 1); // 8 hours = high risk
    const socialMediaRatio = metrics.socialMediaUsage / (metrics.totalScreenTime * 60) || 0;
    const appDiversity = Math.min(metrics.appCount / 20, 1); // 20+ apps = high diversity
    
    return (
        weights.excessiveUsage * excessiveUsage +
        weights.socialMediaRatio * socialMediaRatio +
        weights.appDiversity * appDiversity +
        0.1 // base risk
    );
}

function getRiskLevel(score: number): string {
    if (score < 0.25) return "low";
    if (score < 0.5) return "moderate";
    if (score < 0.75) return "high";
    return "critical";
}
