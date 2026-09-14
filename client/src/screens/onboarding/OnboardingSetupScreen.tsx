import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { ArrowRight, Store, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Input, useToast } from '@/components/ui';
import { useSettingsStore } from '@/stores/settingsStore';
import { toUserMessage } from '@/utils/errors';
import * as SecureStore from 'expo-secure-store';

const ONBOARDING_COMPLETE_KEY = 'bbqpos.onboardingComplete';

interface OnboardingSetupScreenProps {
  onComplete: () => void;
}

export function OnboardingSetupScreen({ onComplete }: OnboardingSetupScreenProps) {
  const insets = useSafeAreaInsets();
  const saveStore = useSettingsStore((s) => s.saveStore);
  const toast = useToast();

  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [saving, setSaving] = useState(false);

  const onSubmit = async () => {
    if (!storeName.trim() || !ownerName.trim()) {
      toast.error('Store name and owner name are required');
      return;
    }
    setSaving(true);
    try {
      const current = useSettingsStore.getState().storeSettings;
      saveStore({
        ...current,
        storeName: storeName.trim(),
        ownerName: ownerName.trim(),
      });
      await SecureStore.setItemAsync(ONBOARDING_COMPLETE_KEY, 'true');
      onComplete();
    } catch (e) {
      toast.error(toUserMessage(e));
      setSaving(false);
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
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-8">
          <View className="h-16 w-16 rounded-2xl bg-primary items-center justify-center mb-4">
            <Text className="text-white text-2xl font-bold">BBQ</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground text-center">Set Up Your Store</Text>
          <Text className="text-sm text-muted-foreground mt-1.5 text-center max-w-sm">
            Tell us a little about your business so your receipts look professional right from day one.
          </Text>
        </View>

        <Card className="p-5">
          <Input
            label="Store Name"
            value={storeName}
            onChangeText={setStoreName}
            placeholder="e.g. Juan's BBQ House"
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="next"
            leftSlot={<Store size={18} color="#64748B" />}
          />
          <View className="h-3" />
          <Input
            label="Owner Name"
            value={ownerName}
            onChangeText={setOwnerName}
            placeholder="e.g. Juan Dela Cruz"
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="done"
            onSubmitEditing={onSubmit}
            leftSlot={<User size={18} color="#64748B" />}
          />
        </Card>

        <View className="mt-6">
          <Button
            label="Complete Setup"
            onPress={onSubmit}
            loading={saving}
            fullWidth
            size="lg"
            rightIcon={<ArrowRight size={20} color="#FFFFFF" />}
          />
        </View>

        <Text className="text-xs text-muted-foreground text-center mt-6 px-4">
          This sets up your device for first use. You can always edit store details later in Settings.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}