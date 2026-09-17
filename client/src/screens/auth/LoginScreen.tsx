import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '@/components/ui';
import { useAuthStore } from '@/auth/authStore';
import { APP_NAME } from '@/constants';

const PIN_LENGTH = 4;
const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'DEL'];

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const login = useAuthStore((s) => s.login);
  const isAuthenticating = useAuthStore((s) => s.isAuthenticating);
  const toast = useToast();

  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleKeyPress = (val: string) => {
    if (isAuthenticating) return;
    setError(null);

    if (val === 'DEL') {
      setPin((prev) => prev.slice(0, -1));
      return;
    }

    if (pin.length < PIN_LENGTH && val !== '') {
      setPin((prev) => prev + val);
    }
  };

  // Automatic login when target PIN length is reached
  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      const executeLogin = async () => {
        try {
          await login(pin);
          toast.success('Welcome back');
        } catch (e) {
          setError('Invalid PIN. Please try again.');
          setPin(''); // Reset PIN on error
        }
      };

      executeLogin();
    }
  }, [pin]);

  return (
    <View
      className="flex-1 bg-white justify-between px-6"
      style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }}
    >
      {/* Header */}
      <View className="items-center mt-6">
        <View className="h-20 w-20 rounded-3xl bg-primary items-center justify-center mb-4 shadow-sm">
          <Text className="text-white text-3xl font-extrabold">BBQ</Text>
        </View>
        <Text className="text-3xl font-bold text-zinc-900 tracking-wide">{APP_NAME}</Text>
        <Text className="text-base text-zinc-500 mt-2">Enter your 4-digit MPIN</Text>
      </View>

      {/* PIN Indicators & Status */}
      <View className="items-center my-6">
        <View className="flex-row gap-6 mb-4">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => {
            const isFilled = i < pin.length;
            return (
              <View
                key={i}
                className={`h-5 w-5 rounded-full border-2 border-primary ${
                  isFilled ? 'bg-primary' : 'bg-transparent'
                }`}
              />
            );
          })}
        </View>

        {isAuthenticating && (
          <ActivityIndicator size="small" className="mt-2 text-primary" />
        )}

        {error ? (
          <Text className="text-sm font-semibold text-rose-600 mt-2 text-center bg-rose-50 px-4 py-1 rounded-full border border-rose-100">
            {error}
          </Text>
        ) : null}
      </View>

      {/* GCash Style Numeric Keypad */}
      <View className="w-full max-w-sm self-center">
        <View className="flex-row flex-wrap justify-between">
          {KEYPAD.map((item, index) => {
            if (item === '') {
              return <View key={index} className="w-[30%] h-16 mb-4" />;
            }

            return (
              <Pressable
                key={index}
                onPress={() => handleKeyPress(item)}
                disabled={isAuthenticating}
                className="w-[30%] h-16 mb-4 rounded-full bg-zinc-100 active:bg-zinc-200 items-center justify-center"
              >
                <Text className="text-zinc-900 text-2xl font-semibold">{item}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}