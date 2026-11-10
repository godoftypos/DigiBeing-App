import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ToastAndroid,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useAuthStore } from '~/lib/store/auth.store';
import { getInstalledSocialMediaApps, getSocialMediaUsage, InstalledAppsResult, SocialMediaUsageResult } from '~/modules/ExpoAppUsage';
import { postToAPI } from '~/lib/api';

// --- Mock Daily Missions Data (keeping as requested) ---
const dailyMissions = [
  { id: '1', title: 'Limit Instagram to 1 hour', goalMinutes: 60, currentMinutes: 45 },
  { id: '2', title: 'Keep TikTok under 30 mins', goalMinutes: 30, currentMinutes: 10 },
];

// --- Helper function for Risk Score ---
const getRiskScoreStyle = (score: number) => {
  if (score < 0.4) return { text: 'text-green-500', label: 'Healthy' };
  if (score < 0.7) return { text: 'text-yellow-500', label: 'Moderate' };
  return { text: 'text-red-500', label: 'High Risk' };
};

// --- Reusable Card Component ---
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <View className={`bg-white p-6 rounded-3xl shadow-lg border border-gray-100 ${className}`}>
    {children}
  </View>
);

// --- Helper function to generate colors for pie chart ---
const generateColors = (count: number) => {
  const colors = [
    '#4F46E5', // Indigo
    '#3B82F6', // Blue
    '#60A5FA', // Light Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#F97316', // Orange
    '#14B8A6', // Teal
    '#84CC16', // Lime
  ];
  
  return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
};

// --- Helper function to format time ---
const formatUsageTime = (milliseconds: number) => {
  const seconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// --- Pie Chart Component with real data ---
const PieChartPlaceholder = ({ data }: { data: Array<{ name: string, milliseconds: number, color: string }> }) => {
  if (!data || data.length === 0) {
    return (
      <View className="items-center">
        <View className="w-36 h-36 rounded-full justify-center items-center bg-gradient-to-br from-gray-100 to-gray-200 mb-6 shadow-inner">
          <Text className="text-lg font-bold text-gray-600">No Data</Text>
        </View>
        <Text className="text-gray-600 text-center">No app usage data available for today</Text>
      </View>
    );
  }

  const totalMilliseconds = data.reduce((sum, item) => sum + item.milliseconds, 0);
  const totalMinutes = Math.floor(totalMilliseconds / 1000 / 60);

  return (
    <View className="items-center">
      <View className="w-36 h-36 rounded-full justify-center items-center bg-gradient-to-br from-blue-100 to-indigo-200 mb-6 shadow-inner">
        <Text className="text-3xl font-bold text-gray-800">{totalMinutes}</Text>
        <Text className="text-sm text-gray-600 font-medium">minutes</Text>
      </View>
      <View className="w-full gap-y-2">
        {data.map((item, index) => (
          <View key={`${item.name}-${index}`} className="flex-row items-center justify-between bg-gray-50 p-3 rounded-xl">
            <View className="flex-row items-center">
              <View className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: item.color }} />
              <Text className="text-gray-800 font-medium">{item.name}</Text>
            </View>
            <Text className="text-gray-600 font-semibold">{Math.floor(item.milliseconds / 1000 / 60)}m</Text>
          </View>
        ))}
      </View>
    </View>
  );
};


// --- Main Dashboard Screen Component ---
export default function DashboardScreen() {

  const { profile } = useAuthStore();

  const [appInstalled, setAppInstalled] = useState<InstalledAppsResult | null>(null);
  const [appUsage, setAppUsage] = useState<SocialMediaUsageResult | null>(null);

  async function fetchAppInstalled() {
    const [totalApps, usageData, usageDataWeek, usageDataMonth] = await Promise.all([
      getInstalledSocialMediaApps(),
      getSocialMediaUsage('today'),
      getSocialMediaUsage('week'),
      getSocialMediaUsage('month'),
    ]);

    setAppInstalled(totalApps);
    setAppUsage(usageData);

    const res = await postToAPI('/users/update-usage-data', {
      todayUsage: usageData.apps || [],
      weekUsage: usageDataWeek.apps || [],
      monthUsage: usageDataMonth.apps || []
    });

    if (res.success) {
      console.log(res.data, usageData, usageDataWeek, usageDataMonth);
      ToastAndroid.show('App usage data updated successfully!', ToastAndroid.SHORT);
    }
  }

  useEffect(() => {
    fetchAppInstalled();
  }, []);

  // Process app usage data for pie chart
  const processedUsageData = React.useMemo(() => {
    if (!appUsage?.apps || appUsage.apps.length === 0) return [];
    
    const colors = generateColors(appUsage.apps.length);
    return appUsage.apps.map((app, index) => ({
      name: app.appName,
      milliseconds: app.totalTimeInForeground, // Convert from milliseconds
      color: colors[index]
    }));
  }, [appUsage]);

  // Calculate most used app
  const mostUsedApp = React.useMemo(() => {
    if (!appUsage?.apps || appUsage.apps.length === 0) {
      return { name: 'No data', time: '0m', icon: '📱' };
    }
    
    const topApp = appUsage.apps.reduce((prev, current) => 
      (prev.totalTimeInForeground > current.totalTimeInForeground) ? prev : current // Correct property name
    );

    return {
      name: topApp.appName,
      time: formatUsageTime(topApp.totalTimeInForeground), // Correct property name
      icon: '📱' // Default icon, could be mapped based on app name
    };
  }, [appUsage]);

  const xpPercentage = ((profile?.currentXp ?? 0) / (profile?.xpToNextLevel ?? 100)) * 100;
  const riskStyle = getRiskScoreStyle(profile?.riskScore ?? 0);

  return (
    <View className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6">
          {/* --- Header --- */}
          <View className="flex-row justify-between items-center mb-8">
            <View>
              <Text className="text-xl text-gray-600">Welcome back,</Text>
              <Text className="text-3xl font-bold text-gray-800">{profile?.name}!</Text>
            </View>
            <View className="flex-row items-center space-x-3">
              {/* <TouchableOpacity className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm">
                <Ionicons name="notifications-outline" size={20} color="#374151" />
              </TouchableOpacity> */}
              <View className="w-16 h-16 bg-white rounded-full items-center justify-center border-2 border-white shadow-lg">
                {profile?.profile_photo ? (
                  <Image
                    source={{ uri: profile.profile_photo }}
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <Text className="text-black font-bold text-lg">
                    {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* --- Stats Overview --- */}
          <View className="flex-row justify-between mb-6">
            <Card className="flex-1 mr-2 items-center">
              <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mb-3">
                <Ionicons name="shield-checkmark" size={20} color="#10B981" />
              </View>
              <Text className="text-sm text-gray-600 mb-1">Risk Status</Text>
              <Text className={`text-lg font-bold ${riskStyle.text}`}>{riskStyle.label}</Text>
            </Card>
            <Card className="flex-1 ml-2 items-center">
              <Text className="text-2xl mb-3">{mostUsedApp.name}</Text>
              <Text className="text-sm text-gray-600 mb-1">Most Used App</Text>
              <Text className="text-lg font-bold text-gray-800">{mostUsedApp.time}</Text>
            </Card>
          </View>

          {/* --- XP Progress Card --- */}
          <Card className="mb-6">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-yellow-100 rounded-full items-center justify-center mr-3">
                <Ionicons name="star" size={20} color="#F59E0B" />
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-800">Level {profile?.level}</Text>
                <Text className="text-sm text-gray-600">Your progress journey</Text>
              </View>
              <Text className="text-sm font-medium text-gray-600">
                {profile?.currentXp} / {profile?.xpToNextLevel} XP
              </Text>
            </View>
            <View className="w-full bg-gray-200 rounded-full h-3">
              <View
                className="bg-blue-400 h-3 rounded-full"
                style={{ width: `${xpPercentage}%` }}
              />
            </View>
            <Text className="text-xs text-gray-500 mt-2 text-center">
              {(profile?.xpToNextLevel ?? 0) - (profile?.currentXp ?? 0)} XP to next level
            </Text>
          </Card>

          {/* --- Social Media Usage Card --- */}
          <Card className="mb-6">
            <View className="flex-row items-center mb-6">
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                <Ionicons name="phone-portrait-outline" size={20} color="#3B82F6" />
              </View>
              <View>
                <Text className="text-xl font-bold text-gray-800">App Usage Today</Text>
                <Text className="text-sm text-gray-600">Social media breakdown</Text>
              </View>
            </View>
            <PieChartPlaceholder data={processedUsageData} />
            <View className="mt-4 p-3 bg-blue-50 rounded-xl">
              <Text className="text-center text-blue-700 text-sm font-medium">
                📱 {appInstalled?.totalCount} social media apps detected on your phone
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
