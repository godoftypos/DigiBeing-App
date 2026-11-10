import * as React from 'react';
import { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ScrollView, 
    StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart, BarChart, LineChart } from '~/components/custom/charts';
import type { 
    PieChartDataItem, 
    BarChartData, 
    LineChartData 
} from '~/components/custom/charts';
import { fetchFromAPI } from '~/lib/api';
import { analyticsCache, cacheManager } from '~/lib/cache';

// Types and Interfaces
interface AppUsage {
    name: string;
    usage: number; // in minutes
    percentage: number;
    packageName: string;
}

interface WeeklyTrend {
    day: string;
    usage: number;
}

interface AnalyticsOverview {
    totalScreenTime: number;
    averageDailyUsage: number;
    mostUsedDay: string;
    leastUsedDay: string;
    improvement: number;
    mostUsedApp: string;
    peakUsageTime: string;
}

interface Goals {
    dailyLimit: number;
    achieved: number;
    totalDays: number;
}

interface RiskAnalysis {
    currentScore: number;
    trend: string;
    factors: string[];
    level: string;
    recommendations: string[];
}

interface UsagePrediction {
    actualUsage: number[];
    predictedUsage: number[];
    riskPrediction: number[];
    labels: string[];
    insights: string[];
}

interface AnalyticsData {
    overview: AnalyticsOverview;
    appUsage: AppUsage[];
    weeklyTrend: WeeklyTrend[];
    goals: Goals;
    riskAnalysis: RiskAnalysis;
    usagePrediction: UsagePrediction;
    summary: {
        totalApps: number;
        detectedApps: number;
        timeRange: string;
        dataPoints: number;
    };
}

interface SummaryCard {
    title: string;
    value: string;
    subtitle: string;
    icon: string;
    color: string;
}

type TimeRange = 'today' | 'week' | 'month';

// Helper function to generate colors for apps
const generateAppColors = (count: number) => {
    const colors = [
        '#E1306C', '#000000', '#1DA1F2', '#4267B2', '#FFFC00', 
        '#FF0000', '#25D366', '#8a3ab9', '#0e76a8', '#FF6600'
    ];
    return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
};

// Summary Card Component
const SummaryCardComponent = ({ card }: { card: SummaryCard }) => (
    <View className="bg-white p-5 rounded-3xl shadow-lg border border-gray-100 flex-1 mx-1">
        <View className={`w-12 h-12 ${card.color} rounded-2xl items-center justify-center mb-3`}>
            <Ionicons name={card.icon as any} size={20} color="#374151" />
        </View>
        <Text className="text-sm text-gray-600 mb-1">{card.title}</Text>
        <Text className="text-xl font-bold text-gray-800 mb-1">{card.value}</Text>
        <Text className="text-xs text-gray-500">{card.subtitle}</Text>
    </View>
);

export default function AnalyticsScreen() {
    const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('week');
    const [selectedApp, setSelectedApp] = useState<string>('all');
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [cacheInfo, setCacheInfo] = useState<{ timeLeft: number; isFromCache: boolean } | null>(null);

    const fetchAnalytics = async (timeRange: TimeRange = selectedTimeRange, forceRefresh: boolean = false) => {
        try {
            setLoading(true);
            
            // Check cache first (unless force refresh is requested)
            if (!forceRefresh) {
                const cachedData = await analyticsCache.get(timeRange) as AnalyticsData | null;
                const cacheDetails = await analyticsCache.getCacheInfo(timeRange);
                
                if (cachedData && cacheDetails) {
                    console.log(`Loading ${timeRange} analytics from cache. Time left: ${Math.round(cacheDetails.timeLeft / (1000 * 60))} minutes`);
                    setAnalyticsData(cachedData);
                    setCacheInfo({
                        timeLeft: cacheDetails.timeLeft,
                        isFromCache: true
                    });
                    setLoading(false);
                    return;
                }
            }

            // Fetch fresh data from API
            console.log(`Fetching fresh ${timeRange} analytics from API...`);
            const res = await fetchFromAPI(`/users/analytics?timeRange=${timeRange}`);
            
            if (res.success) {
                setAnalyticsData(res.data);
                
                // Cache the fresh data
                await analyticsCache.set(timeRange, res.data);
                console.log(`Cached ${timeRange} analytics data for 5 hours`);
                
                setCacheInfo({
                    timeLeft: 5 * 60 * 60 * 1000, // 5 hours in milliseconds
                    isFromCache: false
                });
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
            
            // Try to load from cache as fallback
            const cachedData = await analyticsCache.get(timeRange) as AnalyticsData | null;
            if (cachedData) {
                console.log('Using cached data as fallback due to API error');
                setAnalyticsData(cachedData);
                setCacheInfo({
                    timeLeft: 0,
                    isFromCache: true
                });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const handleTimeRangeChange = (timeRange: TimeRange) => {
        setSelectedTimeRange(timeRange);
        setSelectedApp('all'); // Reset app filter when changing time range
        setCacheInfo(null); // Reset cache info
        fetchAnalytics(timeRange);
    };

    const handleAppFilter = (appName: string) => {
        setSelectedApp(appName);
    };

    const handleForceRefresh = () => {
        setCacheInfo(null);
        fetchAnalytics(selectedTimeRange, true); // Force refresh
    };

    // Helper function to format time left
    const formatTimeLeft = (milliseconds: number): string => {
        const totalMinutes = Math.floor(milliseconds / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    // Clear all cache
    const handleClearCache = async () => {
        try {
            await cacheManager.clearAll();
            setCacheInfo(null);
            console.log('All cache cleared');
            // Optionally refetch data
            fetchAnalytics(selectedTimeRange, true);
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    };

    // Helper function to generate colors
    const generateAppColors = (count: number) => {
        const colors = [
            '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
            '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
        ];
        return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
    };

    // Filter data based on selected app
    const filteredAppUsage = selectedApp === 'all' 
        ? (analyticsData?.appUsage || [])
        : (analyticsData?.appUsage.filter(app => app.name.toLowerCase() === selectedApp.toLowerCase()) || []);

    // Prepare pie chart data
    const pieChartData: PieChartDataItem[] = filteredAppUsage.map((app, index) => {
        const colors = generateAppColors(filteredAppUsage.length);
        return {
            name: app.name,
            usage: app.usage,
            color: colors[index],
            legendFontColor: '#7F7F7F',
            legendFontSize: 12
        };
    });

    // Prepare bar chart data
    const barChartData: BarChartData = {
        labels: analyticsData?.weeklyTrend.map(day => day.day) || [],
        datasets: [{
            data: analyticsData?.weeklyTrend.map(day => day.usage) || []
        }]
    };

    // Prepare line chart data with actual usage (blue) and risk prediction (red)
    const lineChartData: LineChartData = {
        labels: analyticsData?.usagePrediction.labels || [],
        datasets: [
            {
                data: analyticsData?.usagePrediction.actualUsage || [],
                color: () => '#3B82F6', // Blue for actual usage
                strokeWidth: 3
            },
            {
                data: analyticsData?.usagePrediction.riskPrediction || [],
                color: () => '#EF4444', // Red for risk prediction
                strokeWidth: 3
            }
        ]
    };

    // Create summary cards from real data
    const summaryCards: SummaryCard[] = analyticsData ? [
        {
            title: 'Most Used App',
            value: analyticsData.overview.mostUsedApp,
            subtitle: `${analyticsData.appUsage[0]?.usage || 0}m ${selectedTimeRange}`,
            icon: 'play-circle',
            color: 'bg-red-100'
        },
        {
            title: 'Peak Time',
            value: analyticsData.overview.peakUsageTime,
            subtitle: 'High usage time',
            icon: 'time',
            color: 'bg-yellow-100'
        },
        {
            title: 'Screen Time',
            value: `${Math.floor(analyticsData.overview.totalScreenTime / 60)}h ${analyticsData.overview.totalScreenTime % 60}m`,
            subtitle: `${analyticsData.overview.improvement > 0 ? '+' : ''}${analyticsData.overview.improvement}% vs last ${selectedTimeRange}`,
            icon: 'phone-portrait',
            color: 'bg-blue-100'
        },
        {
            title: 'Apps Used',
            value: `${analyticsData.summary.totalApps}`,
            subtitle: `${analyticsData.summary.detectedApps} detected total`,
            icon: 'apps',
            color: 'bg-green-100'
        }
    ] : [];

    if (loading) {
        return (
            <View className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100 justify-center items-center">
                <View className="bg-white p-8 rounded-3xl shadow-lg items-center">
                    <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-4">
                        <Ionicons name="analytics-outline" size={32} color="#3B82F6" />
                    </View>
                    <Text className="text-lg font-bold text-gray-800 mb-2">Analyzing Your Data</Text>
                    <Text className="text-sm text-gray-600 text-center mb-4">
                        AI is generating personalized insights and risk predictions...
                    </Text>
                    <View className="flex-row items-center">
                        <View className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse" />
                        <View className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <View className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </View>
                </View>
            </View>
        );
    }

    if (!analyticsData) {
        return (
            <View className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100 justify-center items-center">
                <Text className="text-lg text-gray-600">No analytics data available</Text>
                <TouchableOpacity 
                    onPress={() => fetchAnalytics()}
                    className="mt-4 px-6 py-3 bg-blue-500 rounded-xl"
                >
                    <Text className="text-white font-medium">Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100">
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            
            <ScrollView 
                className="flex-1" 
                contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="px-6">
                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-8">
                        <View className="flex-1">
                            <Text className="text-3xl font-bold text-gray-800">Analytics</Text>
                            <Text className="text-gray-600">Your digital wellness insights</Text>
                            {cacheInfo && (
                                <View className="flex-row items-center mt-2">
                                    <View className={`w-2 h-2 rounded-full mr-2 ${cacheInfo.isFromCache ? 'bg-blue-500' : 'bg-green-500'}`} />
                                    <Text className="text-xs text-gray-500">
                                        {cacheInfo.isFromCache 
                                            ? `Cached • ${formatTimeLeft(cacheInfo.timeLeft)} left`
                                            : 'Fresh data • Just updated'
                                        }
                                    </Text>
                                </View>
                            )}
                        </View>
                        <View className="flex-row">
                            <TouchableOpacity 
                                onPress={handleForceRefresh}
                                className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm mr-2"
                                disabled={loading}
                            >
                                <Ionicons 
                                    name="refresh-outline" 
                                    size={20} 
                                    color={loading ? "#9CA3AF" : "#374151"} 
                                />
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => fetchAnalytics()}
                                className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center shadow-sm"
                            >
                                <Ionicons name="analytics-outline" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Cache Information Banner */}
                    {cacheInfo && cacheInfo.isFromCache && (
                        <View className="bg-blue-50 border border-blue-200 p-4 rounded-2xl mb-6">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center flex-1">
                                    <Ionicons name="cloud-download-outline" size={20} color="#3B82F6" />
                                    <View className="ml-3 flex-1">
                                        <Text className="text-sm font-medium text-blue-800">
                                            Using cached data
                                        </Text>
                                        <Text className="text-xs text-blue-600">
                                            Cache expires in {formatTimeLeft(cacheInfo.timeLeft)}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={handleForceRefresh}
                                    className="bg-blue-500 px-3 py-1 rounded-lg"
                                    disabled={loading}
                                >
                                    <Text className="text-white text-xs font-medium">
                                        {loading ? 'Updating...' : 'Refresh'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Time Range Toggle */}
                    <View className="flex-row bg-white rounded-2xl p-1 mb-8 shadow-lg border border-gray-100">
                        {(['today', 'week', 'month'] as TimeRange[]).map((range) => (
                            <TouchableOpacity
                                key={range}
                                onPress={() => handleTimeRangeChange(range)}
                                className={`flex-1 py-3 rounded-xl items-center ${
                                    selectedTimeRange === range ? 'bg-blue-500' : ''
                                }`}
                            >
                                <Text className={`font-medium capitalize ${
                                    selectedTimeRange === range ? 'text-white' : 'text-gray-600'
                                }`}>
                                    {range}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Summary Cards */}
                    <View className="mb-8">
                        <Text className="text-xl font-bold text-gray-800 mb-4">Key Insights</Text>
                        <View className="flex-row">
                            {summaryCards.length >= 2 && (
                                <>
                                    <SummaryCardComponent card={summaryCards[0]} />
                                    <SummaryCardComponent card={summaryCards[2]} />
                                </>
                            )}
                        </View>
                    </View>

                    {/* App Filter */}
                    {analyticsData?.appUsage && analyticsData.appUsage.length > 0 && (
                        <View className="mb-6">
                            <Text className="text-lg font-bold text-gray-800 mb-3">Filter by App</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <TouchableOpacity
                                    onPress={() => handleAppFilter('all')}
                                    className={`px-4 py-2 rounded-2xl mr-3 ${
                                        selectedApp === 'all' ? 'bg-blue-500' : 'bg-white'
                                    } shadow-sm border border-gray-100`}
                                >
                                    <Text className={`font-medium ${
                                        selectedApp === 'all' ? 'text-white' : 'text-gray-700'
                                    }`}>
                                        All Apps
                                    </Text>
                                </TouchableOpacity>
                                {analyticsData.appUsage.map((app) => (
                                    <TouchableOpacity
                                        key={app.packageName}
                                        onPress={() => handleAppFilter(app.name)}
                                        className={`px-4 py-2 rounded-2xl mr-3 ${
                                            selectedApp === app.name ? 'bg-blue-500' : 'bg-white'
                                        } shadow-sm border border-gray-100`}
                                    >
                                        <Text className={`font-medium ${
                                            selectedApp === app.name ? 'text-white' : 'text-gray-700'
                                        }`}>
                                            {app.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Charts */}
                    {pieChartData.length > 0 && (
                        <PieChart 
                            data={pieChartData} 
                            title={`App Usage Distribution ${selectedApp !== 'all' ? `- ${selectedApp}` : ''}`} 
                        />
                    )}

                    {barChartData.labels.length > 0 && (
                        <BarChart 
                            data={barChartData} 
                            title={`${selectedTimeRange === 'today' ? 'Hourly' : 'Daily'} Usage Pattern`} 
                            yAxisSuffix="m"
                        />
                    )}

                    {/* AI-Generated Usage Prediction Line Chart */}
                    {lineChartData.labels.length > 0 && (
                        <View className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 mb-6">
                            <View className="flex-row items-center justify-between mb-4">
                                <Text className="text-xl font-bold text-gray-800">Usage Prediction & Risk Analysis</Text>
                                <View className="bg-gradient-to-r from-blue-100 to-red-100 px-3 py-1 rounded-full">
                                    <Text className="text-xs font-medium text-gray-700">AI Generated</Text>
                                </View>
                            </View>
                            <LineChart 
                                data={lineChartData} 
                                title="" 
                                yAxisSuffix="m"
                            />
                            <View className="mt-4 pt-4 border-t border-gray-200">
                                <View className="flex-row justify-between">
                                    <View className="flex-row items-center">
                                        <View className="w-3 h-3 bg-blue-500 rounded-full mr-2" />
                                        <Text className="text-sm text-gray-600">Actual Usage</Text>
                                    </View>
                                    <View className="flex-row items-center">
                                        <View className="w-3 h-3 bg-red-500 rounded-full mr-2" />
                                        <Text className="text-sm text-gray-600">Risk Prediction</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* AI Insights */}
                    {analyticsData?.usagePrediction?.insights && analyticsData.usagePrediction.insights.length > 0 && (
                        <View className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-3xl shadow-lg border border-blue-200 mb-6">
                            <View className="flex-row items-center mb-4">
                                <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center mr-3">
                                    <Ionicons name="bulb-outline" size={16} color="white" />
                                </View>
                                <Text className="text-xl font-bold text-gray-800">AI Insights</Text>
                            </View>
                            {analyticsData.usagePrediction.insights.map((insight, index) => (
                                <View key={index} className="flex-row items-start mb-3 bg-white p-3 rounded-xl shadow-sm">
                                    <View className="w-6 h-6 bg-blue-100 rounded-full items-center justify-center mr-3 mt-0.5">
                                        <Text className="text-xs font-bold text-blue-600">{index + 1}</Text>
                                    </View>
                                    <Text className="text-sm text-gray-700 flex-1">{insight}</Text>
                                </View>
                            ))}
                            <View className="mt-4 pt-4 border-t border-blue-200">
                                <View className="flex-row items-center justify-between">
                                    <View>
                                        <Text className="text-xs text-gray-600 font-medium">Chart Legend:</Text>
                                        <View className="flex-row items-center mt-1">
                                            <View className="w-3 h-3 bg-blue-500 rounded-full mr-2" />
                                            <Text className="text-xs text-gray-500 mr-4">Actual Usage</Text>
                                            <View className="w-3 h-3 bg-red-500 rounded-full mr-2" />
                                            <Text className="text-xs text-gray-500">Risk Scenario</Text>
                                        </View>
                                    </View>
                                    <View className="flex-row items-center">
                                        <Ionicons name="sparkles" size={16} color="#8B5CF6" />
                                        <Text className="text-xs text-purple-600 ml-1 font-medium">AI Powered</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Enhanced Risk Analysis Card with GenAI */}
                    <View className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 mb-6">
                        <Text className="text-xl font-bold text-gray-800 mb-4">AI Risk Analysis</Text>
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-gray-700">Current Risk Score</Text>
                            <View className="flex-row items-center">
                                <Text className={`font-bold text-lg mr-2 ${
                                    analyticsData.riskAnalysis.currentScore < 0.4 
                                        ? 'text-green-600' 
                                        : analyticsData.riskAnalysis.currentScore < 0.7 
                                        ? 'text-yellow-600' 
                                        : 'text-red-600'
                                }`}>
                                    {Math.round(analyticsData.riskAnalysis.currentScore * 100)}%
                                </Text>
                                <Text className={`text-sm font-medium px-2 py-1 rounded-full ${
                                    analyticsData.riskAnalysis.level === 'low' 
                                        ? 'bg-green-100 text-green-700'
                                        : analyticsData.riskAnalysis.level === 'moderate'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-red-100 text-red-700'
                                }`}>
                                    {analyticsData.riskAnalysis.level}
                                </Text>
                            </View>
                        </View>
                        
                        <View className="flex-row items-center mb-3">
                            <Text className="text-gray-700 mr-2">Trend:</Text>
                            <Text className={`text-sm font-medium px-2 py-1 rounded-full ${
                                analyticsData.riskAnalysis.trend === 'improving' 
                                    ? 'bg-green-100 text-green-700'
                                    : analyticsData.riskAnalysis.trend === 'worsening'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-700'
                            }`}>
                                {analyticsData.riskAnalysis.trend}
                            </Text>
                        </View>

                        <Text className="text-sm text-gray-600 mb-3">Risk Factors:</Text>
                        {analyticsData.riskAnalysis.factors.map((factor, index) => (
                            <Text key={index} className="text-sm text-gray-700 mb-1">
                                • {factor}
                            </Text>
                        ))}

                        {analyticsData.riskAnalysis.recommendations && analyticsData.riskAnalysis.recommendations.length > 0 && (
                            <>
                                <Text className="text-sm text-gray-600 mb-3 mt-4">AI Recommendations:</Text>
                                {analyticsData.riskAnalysis.recommendations.map((recommendation, index) => (
                                    <View key={index} className="flex-row items-center mb-2">
                                        <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
                                        <Text className="text-sm text-gray-700 ml-2">{recommendation}</Text>
                                    </View>
                                ))}
                            </>
                        )}
                        
                        <View className="mt-4 pt-4 border-t border-gray-200">
                            <Text className="text-xs text-gray-500">
                                ⚡ Powered by AI - Risk analysis updated in real-time
                            </Text>
                        </View>
                    </View>

                    {/* Detailed Breakdown */}
                    {filteredAppUsage.length > 0 && (
                        <View className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 mb-6">
                            <Text className="text-xl font-bold text-gray-800 mb-4">Detailed Breakdown</Text>
                            {filteredAppUsage.map((app, index) => {
                                const colors = generateAppColors(filteredAppUsage.length);
                                return (
                                    <View key={app.packageName} className="flex-row items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                                        <View className="flex-row items-center flex-1">
                                            <View 
                                                className="w-4 h-4 rounded-full mr-3" 
                                                style={{ backgroundColor: colors[index] }} 
                                            />
                                            <View className="flex-1">
                                                <Text className="font-medium text-gray-800">{app.name}</Text>
                                                <Text className="text-sm text-gray-500">{app.packageName}</Text>
                                            </View>
                                        </View>
                                        <View className="items-end">
                                            <Text className="font-bold text-gray-800">{app.usage}m</Text>
                                            <Text className="text-xs text-gray-500">{app.percentage}%</Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
