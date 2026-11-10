import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
    Dimensions,
    FlatList,
    Pressable,
    StatusBar,
    Text,
    View,
    SafeAreaView
} from "react-native";
import { Button } from "~/components/ui/Button";

const { width } = Dimensions.get('window');

// --- Type Definition for a Slide ---
type OnboardingSlide = {
    id: string;
    color: string;
    title: string;
    description: string;
};

// --- Onboarding Data ---
const onboardingSlides: OnboardingSlide[] = [
    {
        id: '1',
        color: 'bg-blue-200', // Pastel Blue
        title: 'Monitor Your Digital Habits',
        description: 'Understand your screen time with detailed graphs and insights on your social media usage.',
    },
    {
        id: '2',
        color: 'bg-orange-200', // Pastel Orange
        title: 'Turn Healthy Habits into a Game',
        description: 'Complete missions, take on focus quests, and earn XP for regulating your app usage.',
    },
    {
        id: '3',
        color: 'bg-indigo-200', // Pastel Indigo
        title: 'Regain Your Focus & Wellbeing',
        description: 'Use our tools to self-regulate, reduce distractions, and improve your digital health.',
    },
];

// --- Onboarding Item Component ---
const OnboardingItem = ({ item }: { item: OnboardingSlide }) => {
    return (
        <View className="items-center justify-center" style={{ width }}>
            {/* Replaced Image with a colored View */}
            <View className={`w-72 h-72 mb-10 rounded-2xl ${item.color}`} />
            <Text className="text-3xl font-bold text-center text-gray-800 px-10 mb-4">
                {item.title}
            </Text>
            <Text className="text-base text-center text-gray-500 px-12">
                {item.description}
            </Text>
        </View>
    );
};

// --- Main Onboarding Screen Component ---
export default function Onboarding() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);

    // Correctly type the ref for the FlatList
    const slidesRef = useRef<FlatList<OnboardingSlide>>(null);

    // This function updates the current index when the user swipes
    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
        if (viewableItems.length > 0 && viewableItems[0].index !== null) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const scrollToNext = () => {
        if (currentIndex < onboardingSlides.length - 1) {
            slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
        }
    };

    // Navigate to other routes
    const handleRegister = () => {
        router.push('/(auth)/register');
    }

    const handleLogin = () => {
        router.push('/(auth)');
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />

            {/* Main content area that expands and centers the FlatList */}
            <View className="flex-1 justify-center items-center">
                <FlatList
                    ref={slidesRef}
                    data={onboardingSlides}
                    renderItem={({ item }) => <OnboardingItem item={item} />}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    bounces={false}
                    keyExtractor={(item) => item.id}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    scrollEventThrottle={32}
                />
            </View>

            {/* --- Footer with Buttons, anchored to the bottom --- */}
            <View className="justify-center items-center px-8 pb-10 pt-4">
                {/* Conditional rendering for the buttons */}
                {currentIndex < onboardingSlides.length - 1 ? (
                    // Show "Continue" or "Next" button for slides 1 and 2
                    <Button
                        title={currentIndex === 0 ? 'Continue' : 'Next'}
                        className="w-full"
                        onPress={scrollToNext}
                    />
                ) : (
                    // Show "Register" and "Login" buttons on the last slide
                    <View className="w-full">
                        <Button
                            title={'Register'}
                            className="w-full mb-4"
                            onPress={handleRegister}
                        />
                        <Button
                            title={'Login'}
                            className="w-full bg-transparent border-2 border-blue"
                            outline
                            onPress={handleLogin}
                        />
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}
