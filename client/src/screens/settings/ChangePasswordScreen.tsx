import React, { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Eye, EyeOff, KeyRound, Lock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Card, Input, useToast } from '@/components/ui';
import { useAuthStore } from '@/auth/authStore';
import { toUserMessage } from '@/utils/errors';
import type { AppStackParamList } from '@/navigation/types';

const PIN_LENGTH = 4;

export function ChangePasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const changePassword = useAuthStore((s) => s.changePassword);
  const isChangingPassword = useAuthStore((s) => s.isChangingPassword);
  const toast = useToast();

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearFields = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setError(null);
  };

  const onSubmit = async () => {
    if (!currentPin || !newPin || !confirmPin) {
      setError('Enter your current PIN, new PIN, and confirmation');
      return;
    }
    if (!/^\d+$/.test(newPin)) {
      setError('New PIN must contain numbers only');
      return;
    }
    if (newPin.length !== PIN_LENGTH) {
      setError(`New PIN must be ${PIN_LENGTH} digits`);
      return;
    }
    if (newPin !== confirmPin) {
      setError('New PINs do not match. Please try again.');
      return;
    }
    setError(null);
    try {
      await changePassword(currentPin, newPin);
      toast.success('PIN updated successfully');
      clearFields();
      navigation.goBack();
    } catch (e) {
      if (e instanceof Error && e.message === 'INVALID_CURRENT_PASSWORD') {
        setError('Your current PIN is incorrect');
      } else {
        setError(toUserMessage(e));
      }
    }
  };

  const pinToggle = (visible: boolean, onToggle: () => void) => (
    <Pressable onPress={onToggle} hitSlop={8}>
      {visible ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
    </Pressable>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-6">
          <View className="h-12 w-12 rounded-2xl bg-primary items-center justify-center mb-3">
            <KeyRound size={22} color="#FFFFFF" />
          </View>
          <Text className="text-lg font-semibold text-foreground">Change PIN</Text>
          <Text className="text-sm text-muted-foreground mt-1 text-center">
            Choose a {PIN_LENGTH}-digit numeric PIN that is easy to remember.
          </Text>
        </View>

        <Card className="p-5">
          <Input
            label="Current PIN"
            value={currentPin}
            onChangeText={(v) => setCurrentPin(v.replace(/[^\d]/g, ''))}
            secureTextEntry={!showCurrent}
            keyboardType="number-pad"
            maxLength={PIN_LENGTH}
            placeholder="Enter your current PIN"
            leftSlot={<Lock size={18} color="#64748B" />}
            rightSlot={pinToggle(showCurrent, () => setShowCurrent((v) => !v))}
          />
          <View className="h-3" />
          <Input
            label="New PIN"
            value={newPin}
            onChangeText={(v) => setNewPin(v.replace(/[^\d]/g, ''))}
            secureTextEntry={!showNew}
            keyboardType="number-pad"
            maxLength={PIN_LENGTH}
            placeholder={`${PIN_LENGTH}-digit numeric PIN`}
            leftSlot={<Lock size={18} color="#64748B" />}
            rightSlot={pinToggle(showNew, () => setShowNew((v) => !v))}
          />
          <View className="h-3" />
          <Input
            label="Confirm New PIN"
            value={confirmPin}
            onChangeText={(v) => setConfirmPin(v.replace(/[^\d]/g, ''))}
            secureTextEntry={!showConfirm}
            keyboardType="number-pad"
            maxLength={PIN_LENGTH}
            placeholder="Re-enter your new PIN"
            leftSlot={<Lock size={18} color="#64748B" />}
            rightSlot={pinToggle(showConfirm, () => setShowConfirm((v) => !v))}
          />

          {error ? <Text className="text-xs text-destructive mt-3">{error}</Text> : null}
        </Card>

        <View className="mt-5">
          <Button
            label="Update PIN"
            onPress={onSubmit}
            loading={isChangingPassword}
            fullWidth
            size="lg"
            leftIcon={<KeyRound size={18} color="#FFFFFF" />}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}