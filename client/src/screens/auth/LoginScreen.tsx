import React, { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Input, useToast } from '@/components/ui';
import { useAuthStore } from '@/auth/authStore';
import { APP_NAME, MOCK_CREDENTIALS } from '@/constants';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const login = useAuthStore((s) => s.login);
  const isAuthenticating = useAuthStore((s) => s.isAuthenticating);
  const toast = useToast();

  const [email, setEmail] = useState(MOCK_CREDENTIALS.email);
  const [password, setPassword] = useState(MOCK_CREDENTIALS.password);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password');
      return;
    }
    setError(null);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back');
    } catch (e) {
      setError('Invalid email or password');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-8">
          <View className="h-16 w-16 rounded-2xl bg-primary items-center justify-center mb-4">
            <Text className="text-white text-2xl font-bold">BBQ</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground">{APP_NAME}</Text>
          <Text className="text-sm text-muted-foreground mt-1">Sign in to start taking orders</Text>
        </View>

        <Card className="p-5">
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@example.com"
            leftSlot={<Mail size={18} color="#64748B" />}
          />
          <View className="h-3" />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholder="Your password"
            leftSlot={<Lock size={18} color="#64748B" />}
            rightSlot={
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                {showPassword ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
              </Pressable>
            }
          />

          {error ? <Text className="text-xs text-destructive mt-3">{error}</Text> : null}

          <Pressable
            onPress={() => setRemember((v) => !v)}
            className="flex-row items-center gap-2 mt-4"
            hitSlop={4}
          >
            <View
              className={`h-5 w-5 rounded border ${remember ? 'bg-primary border-primary' : 'border-border bg-card'}`}
            />
            <Text className="text-sm text-foreground">Remember me on this device</Text>
          </Pressable>

          <View className="mt-5">
            <Button
              label="Sign in"
              onPress={onSubmit}
              loading={isAuthenticating}
              fullWidth
              size="lg"
              leftIcon={<LogIn size={18} color="#FFFFFF" />}
            />
          </View>
        </Card>

        <Text className="text-xs text-muted-foreground text-center mt-6 px-4">
          Demo credentials are pre-filled. The auth layer is structured to plug into a future NestJS /auth/login endpoint.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
