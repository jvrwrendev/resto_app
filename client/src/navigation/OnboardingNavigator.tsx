import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingTutorialScreen } from '@/screens/onboarding/OnboardingTutorialScreen';
import { OnboardingSetupScreen } from '@/screens/onboarding/OnboardingSetupScreen';
import type { OnboardingStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

interface OnboardingNavigatorProps {
  onComplete: () => void;
}

export function OnboardingNavigator({ onComplete }: OnboardingNavigatorProps) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OnboardingTutorial" component={OnboardingTutorialScreen} />
      <Stack.Screen name="OnboardingSetup" options={{ gestureEnabled: false }}>
        {(props) => <OnboardingSetupScreen {...props} onComplete={onComplete} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}