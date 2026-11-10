import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StatusBar,
    ScrollView,
    Pressable,
    TouchableOpacity,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Container } from '~/components/layout/Container';
import { Button } from '~/components/ui/Button';
import { useAuthStore } from '~/lib/store/auth.store';
import { fetchFromAPI } from '~/lib/api';

interface Achievement {
    id: string;
    title: string;
    description: string;
    slug: string;
    icon: string | null;
    category: string | null;
    threshold: number;
    isCompleted: boolean;
    completedAt: string | null;
    progress: number | null;
    createdAt: string;
}

const StatItem = ({ value, label, icon }: { value: string | number; label: string; icon: string }) => (
    <View className="items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex-1 mx-1">
        <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mb-2">
            <Ionicons name={icon as any} size={20} color="#3B82F6" />
        </View>
        <Text className="text-xl font-bold text-gray-800">{value}</Text>
        <Text className="text-sm text-gray-500 text-center">{label}</Text>
    </View>
);

const AchievementItem = ({ item }: { item: Achievement }) => (
    <TouchableOpacity
        className={`flex-row items-center p-5 rounded-2xl mb-3 border ${item.isCompleted
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                : 'bg-gray-50 border-gray-200'
            }`}
        activeOpacity={0.7}
    >
        <View className={`w-14 h-14 rounded-full justify-center items-center ${item.isCompleted ? 'bg-blue-500 shadow-lg' : 'bg-gray-300'
            }`}>
            <Text className="text-2xl">{item.isCompleted ? item.icon : '🔒'}</Text>
        </View>
        <View className="flex-1 ml-4">
            <Text className={`font-bold text-lg ${item.isCompleted ? 'text-gray-800' : 'text-gray-500'}`}>
                {item.title}
            </Text>
            <Text className={`text-sm mt-1 ${item.isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                {item.description}
            </Text>
        </View>
        {item.isCompleted && (
            <View className="bg-green-500 w-6 h-6 rounded-full items-center justify-center">
                <Ionicons name="checkmark" size={14} color="white" />
            </View>
        )}
    </TouchableOpacity>
);

export default function ProfileScreen() {
    const router = useRouter();
    const { profile, logOut } = useAuthStore();
    const xpPercentage = ((profile?.currentXp ?? 0) / (profile?.xpToNextLevel ?? 0)) * 100;

    const [achievements, setAchievements] = useState<Achievement[]>([]);

    async function fetchAchievements() {
        const res = await fetchFromAPI('users/achievements');
        if (res.success) {
            setAchievements(res.data.achievements);
        }
    }

    useEffect(() => {
        fetchAchievements()
    }, [])

    return (
        <View className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100">
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            <ScrollView
                className='flex-1'
                contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="px-6">
                    {/* Header */}
                    <View className="flex-col justify-between items-start mb-6">
                        <Text className="text-3xl font-bold text-gray-800">Profile</Text>
                        <Text className="text-gray-600">Your digital wellness journey</Text>
                    </View>

                    {/* User Info Card */}
                    <View className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 mb-6">
                        <View className="items-center">
                            {/* Avatar with edit button */}
                            <View className="relative mb-4">
                                <View className="w-24 h-24 bg-blue-400 rounded-full border-4 border-white shadow-lg overflow-hidden items-center justify-center">
                                    {profile?.profile_photo ? (
                                        <Image
                                            source={{ uri: profile.profile_photo }}
                                            className="w-full h-full"
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <Text className="text-white text-2xl font-bold">
                                            {profile?.name ? profile.name.charAt(0).toUpperCase() : ''}
                                        </Text>
                                    )}
                                </View>
                            </View>

                            <Text className="text-2xl font-bold text-gray-800 mb-1">{profile?.name}</Text>
                            <Text className="text-base text-gray-500 mb-6">{profile?.email}</Text>

                            {/* Level and XP Progress */}
                            <View className="w-full">
                                <View className="flex-row justify-between items-center mb-2">
                                    <View className="flex-row items-center">
                                        <View className="w-6 h-6 bg-yellow-400 rounded-full items-center justify-center mr-2">
                                            <Ionicons name="star" size={14} color="white" />
                                        </View>
                                        <Text className="text-lg font-bold text-gray-800">Level {profile?.level}</Text>
                                    </View>
                                    <Text className="text-sm font-medium text-gray-500">
                                        {profile?.currentXp} / {profile?.xpToNextLevel} XP
                                    </Text>
                                </View>
                                <View className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <View
                                        className="bg-blue-500 h-3 rounded-full"
                                        style={{ width: `${xpPercentage}%` }}
                                    />
                                </View>
                                <Text className="text-xs text-gray-500 mt-1 text-center">
                                    {(profile?.xpToNextLevel ?? 0) - (profile?.currentXp ?? 0)} XP to next level
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Stats Grid */}
                    <View className="mb-6">
                        <Text className="text-xl font-bold text-gray-800 mb-4">Your Stats</Text>
                        <View className="flex-row justify-between">
                            <StatItem
                                value={profile?.missionsCompleted || 0}
                                label="Missions"
                                icon="trophy-outline"
                            />
                            <StatItem
                                value={profile?.maxStreak || 0}
                                label="Max Streak"
                                icon="flame-outline"
                            />
                        </View>
                    </View>

                    {/* Quick Actions */}
                    <View className="mb-6">
                        <Text className="text-xl font-bold text-gray-800 mb-4">Quick Actions</Text>
                        <View className="flex-row justify-between">
                            <TouchableOpacity
                                onPress={() => router.push('/private/editprofile')}
                                className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 items-center mr-2"
                            >
                                <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-2">
                                    <Ionicons name="person-outline" size={20} color="#3B82F6" />
                                </View>
                                <Text className="text-sm font-medium text-gray-700">Edit Profile</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 items-center mx-1">
                                <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mb-2">
                                    <Ionicons name="share-outline" size={20} color="#10B981" />
                                </View>
                                <Text className="text-sm font-medium text-gray-700">Share</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => logOut()}
                                className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 items-center ml-2"
                                activeOpacity={0.7}
                            >
                                <View className="w-12 h-12 bg-red-100 rounded-full items-center justify-center mb-2">
                                    <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                                </View>
                                <Text className="text-sm font-medium text-red-600">Log Out</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Achievements Section */}
                    <View>
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-xl font-bold text-gray-800">Achievements</Text>
                            <TouchableOpacity className="flex-row items-center">
                                <Text className="text-blue-600 font-medium mr-1">View All</Text>
                                <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
                            </TouchableOpacity>
                        </View>
                        {achievements.length > 0 && achievements.slice(0, 6).map(item => (
                            <AchievementItem key={item.id} item={item} />
                        ))}
                        {achievements.length > 6 && (
                            <TouchableOpacity className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 items-center mt-3">
                                <Text className="text-blue-600 font-medium">
                                    View {achievements.length - 6} more achievements
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
