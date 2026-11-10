import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    StatusBar,
    Dimensions,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchFromAPI, postToAPI } from '~/lib/api';

// Types
interface Mission {
    id: string;
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    rewardXp: number;
    icon: string;
    type: 'daily' | 'personalized';
    progress?: number;
    maxProgress?: number;
    isCompleted?: boolean;
    userMissionId?: string | null;
    goalMinutes?: number;
    category?: string;
}

// Components
const MissionCard = ({ mission, onStart }: { mission: Mission; onStart: (id: string) => void }) => {
    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'bg-green-100 text-green-700';
            case 'medium': return 'bg-yellow-100 text-yellow-700';
            case 'hard': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const progressPercentage = mission.progress && mission.maxProgress 
        ? (mission.progress / mission.maxProgress) * 100 
        : 0;

    return (
        <TouchableOpacity 
            className={`bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-4 ${
                mission.isCompleted ? 'opacity-75' : ''
            }`}
            onPress={() => !mission.isCompleted && onStart(mission.id)}
            disabled={mission.isCompleted}
        >
            <View className="flex-row items-start justify-between mb-3">
                <View className="flex-row items-center flex-1">
                    <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${
                        mission.isCompleted ? 'bg-green-500' : 'bg-blue-100'
                    }`}>
                        {mission.isCompleted ? (
                            <Ionicons name="checkmark" size={20} color="white" />
                        ) : (
                            <Ionicons name={mission.icon as any} size={20} color="#3B82F6" />
                        )}
                    </View>
                    <View className="flex-1">
                        <Text className="text-lg font-bold text-gray-800 mb-1">{mission.title}</Text>
                        <Text className="text-sm text-gray-600">{mission.description}</Text>
                    </View>
                </View>
                <View className="items-end">
                    <View className={`px-3 py-1 rounded-full ${getDifficultyColor(mission.difficulty)}`}>
                        <Text className="text-xs font-medium">{mission.difficulty}</Text>
                    </View>
                </View>
            </View>

            {mission.type === 'personalized' && mission.progress !== undefined && mission.maxProgress && (
                <View className="mb-3">
                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-sm font-medium text-gray-600">Progress</Text>
                        <Text className="text-sm font-medium text-gray-600">
                            {mission.progress}/{mission.maxProgress} {(mission.goalMinutes && mission.goalMinutes > 60) ? 'minutes' : 'units'}
                        </Text>
                    </View>
                    <View className="w-full bg-gray-200 rounded-full h-2">
                        <View 
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${progressPercentage}%` }} 
                        />
                    </View>
                </View>
            )}

            <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={16} color="#6B7280" />
                    <Text className="text-sm text-gray-500 ml-1">
                        {mission.goalMinutes ? `${mission.goalMinutes} min` : 'Ongoing'}
                    </Text>
                </View>
                <View className="flex-row items-center">
                    <Ionicons name="star-outline" size={16} color="#F59E0B" />
                    <Text className="text-sm font-medium text-gray-700 ml-1">{mission.rewardXp} XP</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default function MissionsScreen() {
    const [dailyMissions, setDailyMissions] = useState<Mission[]>([]);
    const [personalizedMissions, setPersonalizedMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMissions = async () => {
        try {
            const res = await fetchFromAPI("/users/all-missions");

            if (res.success) {
                setDailyMissions(res.data.dailyMissions || []);
                setPersonalizedMissions(res.data.personalizedMissions || []);
            } else {
                console.error('Failed to fetch missions:', res.message);
            }
        } catch (error) {
            console.error('Error fetching missions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchMissions();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchMissions();
    };

    const handleStartMission = async (missionId: string) => {
        try {
            // For now, we'll mark mission as complete when started
            // You can implement actual mission tracking logic here
            const mission = [...dailyMissions, ...personalizedMissions].find(m => m.id === missionId);
            
            if (mission) {
                const res = await postToAPI("/users/mark-mission-as-complete", {
                    missionId: mission.type === 'daily' ? missionId : null,
                    userMissionId: mission.type === 'personalized' ? mission.userMissionId : null
                });

                if (res.success) {
                    console.log('Mission completed!', res.data);
                    // Refresh missions to show updated status
                    fetchMissions();
                } else {
                    console.error('Failed to complete mission:', res.message);
                }
            }
        } catch (error) {
            console.error('Error completing mission:', error);
        }
    };

    const completedDailyMissions = dailyMissions.filter(m => m.isCompleted).length;
    const completedPersonalizedMissions = personalizedMissions.filter(m => m.isCompleted).length;

    if (loading) {
        return (
            <View className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100 items-center justify-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-gray-600 mt-4">Loading missions...</Text>
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
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View className="px-6">
                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-6">
                        <View>
                            <Text className="text-3xl font-bold text-gray-800">Missions</Text>
                            <Text className="text-gray-600">Your digital wellness challenges</Text>
                        </View>
                        <TouchableOpacity className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm">
                            <Ionicons name="notifications-outline" size={20} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    {/* Stats Row */}
                    <View className="flex-row justify-between mb-6">
                        <View className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex-1 mr-2">
                            <View className="flex-row items-center">
                                <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
                                    <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />
                                </View>
                                <View>
                                    <Text className="text-xl font-bold text-gray-800">
                                        {completedDailyMissions + completedPersonalizedMissions}
                                    </Text>
                                    <Text className="text-xs text-gray-500">Completed Today</Text>
                                </View>
                            </View>
                        </View>
                        <View className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex-1 mx-1">
                            <View className="flex-row items-center">
                                <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center mr-3">
                                    <Ionicons name="star" size={16} color="#10B981" />
                                </View>
                                <View>
                                    <Text className="text-xl font-bold text-gray-800">
                                        {dailyMissions.length + personalizedMissions.length}
                                    </Text>
                                    <Text className="text-xs text-gray-500">Total Missions</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Daily Missions */}
                    <View className="mb-6">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-xl font-bold text-gray-800">Daily Missions</Text>
                            <View className="bg-blue-100 px-3 py-1 rounded-full">
                                <Text className="text-blue-700 font-medium text-sm">
                                    {completedDailyMissions}/{dailyMissions.length} Complete
                                </Text>
                            </View>
                        </View>
                        {dailyMissions.map(mission => (
                            <MissionCard 
                                key={mission.id} 
                                mission={mission} 
                                onStart={handleStartMission} 
                            />
                        ))}
                    </View>

                    {/* Personalized Missions */}
                    <View>
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-xl font-bold text-gray-800">Personalized Missions</Text>
                            <View className="bg-purple-100 px-3 py-1 rounded-full">
                                <Text className="text-purple-700 font-medium text-sm">
                                    {completedPersonalizedMissions}/{personalizedMissions.length} Complete
                                </Text>
                            </View>
                        </View>
                        {personalizedMissions.map(mission => (
                            <MissionCard 
                                key={mission.id} 
                                mission={mission} 
                                onStart={handleStartMission} 
                            />
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
