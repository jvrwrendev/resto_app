import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/auth/authStore';
import { initDatabase } from '@/database/initDatabase';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { APP_NAME } from '@/constants';
import { useProductStore } from '@/stores/productStore';
import { useSettingsStore } from '@/stores/settingsStore';

const ONBOARDING_COMPLETE_KEY = 'bbqpos.onboardingComplete';

export function RootNavigator() {
  const session = useAuthStore((s) => s.session);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const loadProducts = useProductStore((s) => s.load);
  const loadSettings = useSettingsStore((s) => s.load);

  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      initDatabase();
      setDbReady(true);
    } catch (e) {
      setDbError('Database initialization failed');
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const val = await SecureStore.getItemAsync(ONBOARDING_COMPLETE_KEY);
        if (mounted) setOnboardingComplete(val === 'true');
      } catch {
        if (mounted) setOnboardingComplete(false);
      }
    };
    check();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (dbReady && session) {
      loadProducts();
      loadSettings();
    }
  }, [dbReady, session, loadProducts, loadSettings]);

  if (!dbReady || !isHydrated || onboardingComplete === null) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        {dbError ? (
          <View className="px-8 items-center">
            <Text className="text-lg font-semibold text-destructive mb-2">{dbError}</Text>
            <Text className="text-sm text-muted-foreground text-center mb-4">
              Please restart the app. If the problem persists, reinstall.
            </Text>
          </View>
        ) : (
          <View className="items-center">
            <ActivityIndicator color="#B45309" size="large" />
            <Text className="text-sm text-muted-foreground mt-3">Loading {APP_NAME}…</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!onboardingComplete ? (
        <OnboardingNavigator onComplete={() => setOnboardingComplete(true)} />
      ) : session ? (
        <AppNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
