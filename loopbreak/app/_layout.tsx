import { useAuthStore } from '~/lib/store/auth.store';
import '../global.css';

import { SplashScreen, Stack } from 'expo-router';
import { useEffect } from 'react';
import { useFonts, Poppins_300Light, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import CustomSplashScreen from '~/components/layout/SplashScreen';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

export default function RootLayout() {

  const { profile, session, rehydrateSession, isLoading, isSessionInitialized } = useAuthStore();

  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const isLoggedIn = !!(session && profile);

  async function checkSession() {
    await rehydrateSession();
  }

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(console.warn);
      checkSession();
    }
  }, [fontsLoaded]);

  // Show custom splash screen until session is initialized
  if (!fontsLoaded || !isSessionInitialized) {
    return <CustomSplashScreen message="Checking session..." />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="index" />
      </Stack.Protected>

      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="private" />
      </Stack.Protected>
    </Stack>
  );
}
