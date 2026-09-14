import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated';
import './global.css';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ToastProvider, DialogProvider } from '@/components/ui';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReducedMotionConfig mode={ReduceMotion.Never} />
      <SafeAreaProvider>
        <DialogProvider>
          <ToastProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </ToastProvider>
        </DialogProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
