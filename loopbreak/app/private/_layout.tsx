import { Stack } from "expo-router";
import { useEffect } from "react";
import { useAuthStore } from "~/lib/store/auth.store";
import { hasUsagePermission, requestUsagePermission } from "~/modules/ExpoAppUsage";

export default function ProtectedLayout() {

    const { profile } = useAuthStore();

    async function setupUsageModule() {
        const hasPerms = await hasUsagePermission();

        if (!hasPerms) {
            await requestUsagePermission();
        }
    }

    useEffect(() => {
        setupUsageModule();
    }, [])

    return (
        <Stack initialRouteName={profile?.onboardingDone ? "(tabs)" : "onboarding"} screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />

            <Stack.Screen name="onboarding" options={{ headerShown: true }} />
            <Stack.Screen name="editprofile" options={{ headerShown: true }} />
        </Stack>
    )
}