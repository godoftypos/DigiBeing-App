import React from 'react';
import { View, Image, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface SplashScreenProps {
  message?: string;
}

export default function CustomSplashScreen({ message = "Loading..." }: SplashScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={require('~/assets/icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>
          LoopBreak
        </Text>
        <Text style={styles.tagline}>
          Break the Digital Loop
        </Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{message}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  appName: {
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#666666',
    marginBottom: 40,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#999999',
    textAlign: 'center',
  },
});
