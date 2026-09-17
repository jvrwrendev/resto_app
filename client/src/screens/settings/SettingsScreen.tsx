import React, { useCallback } from 'react';
import { View, Text, Pressable, Switch } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  User,
  KeyRound,
  ReceiptText,
  Info,
  LogOut,
  ChevronRight,
  Printer as PrinterIcon,
} from 'lucide-react-native';
import { Header, ScreenContainer, Card, SectionTitle, useDialog, useToast, Button, Divider } from '@/components/ui';
import { useAuthStore } from '@/auth/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { printerService } from '@/services/printerService';
import type { AppStackParamList } from '@/navigation/types';
import { APP_NAME, APP_VERSION } from '@/constants';

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const session = useAuthStore((s) => s.session);
  const logout = useAuthStore((s) => s.logout);
  const autoPrint = useSettingsStore((s) => s.autoPrint);
  const setAutoPrint = useSettingsStore((s) => s.setAutoPrint);
  const load = useSettingsStore((s) => s.load);
  const toast = useToast();
  const dialog = useDialog();

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleLogout = async () => {
    const ok = await dialog.confirm({
      title: 'Sign out?',
      description: 'You will need to sign in again to use the POS.',
      confirmLabel: 'Sign out',
      variant: 'warning',
    });
    if (!ok) return;
    await logout();
  };

  const onToggleAutoPrint = (v: boolean) => {
    setAutoPrint(v);
    toast.success(v ? 'Auto-print enabled' : 'Auto-print disabled');
  };

  const printerStatus = printerService.status();

  return (
    <ScreenContainer edges={['top']}>
      <Header title="Settings" subtitle="App preferences" />

      <SectionTitle>Account</SectionTitle>
      <Card>
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 rounded-full bg-primary/15 items-center justify-center">
            <User size={20} color="#B45309" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground">{session?.user.name ?? 'User'}</Text>
            <Text className="text-xs text-muted-foreground">
              {session?.user.role === 'ADMIN' ? 'Administrator' : 'Cashier'}
            </Text>
          </View>
        </View>
        <View className="h-3" />
        <Pressable
          onPress={() => navigation.navigate('ChangePassword')}
          className="flex-row items-center gap-3 py-1.5"
        >
          <View className="h-10 w-10 rounded-xl bg-primary/10 items-center justify-center">
            <KeyRound size={18} color="#B45309" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">Change PIN</Text>
            <Text className="text-xs text-muted-foreground mt-0.5">Update your numeric login PIN</Text>
          </View>
          <ChevronRight size={18} color="#64748B" />
        </Pressable>
        <Divider className="my-3" />
        <Button
          label="Sign out"
          variant="outline"
          onPress={handleLogout}
          leftIcon={<LogOut size={16} color="#0F172A" />}
          fullWidth
        />
      </Card>

      <View className="h-4" />
      <SectionTitle>Printer</SectionTitle>
      <Card>
        <Pressable
          onPress={() => navigation.navigate('PrinterSettings')}
          className="flex-row items-center gap-3 py-1"
        >
          <View className="h-10 w-10 rounded-xl bg-primary/10 items-center justify-center">
            <PrinterIcon size={18} color="#B45309" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">Bluetooth printer</Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              {printerStatus.connected ? printerStatus.name : 'Not connected'}
            </Text>
          </View>
          <ChevronRight size={18} color="#64748B" />
        </Pressable>
        <Divider className="my-3" />
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-2">
            <Text className="text-sm font-semibold text-foreground">Auto-print receipt</Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              Print automatically after every successful checkout.
            </Text>
          </View>
          <Switch
            value={autoPrint}
            onValueChange={onToggleAutoPrint}
            trackColor={{ false: '#E5E7EB', true: '#B45309' }}
          />
        </View>
      </Card>

      <View className="h-4" />
      <SectionTitle>Receipt</SectionTitle>
      <Card>
        <Pressable
          onPress={() => navigation.navigate('ReceiptSettings')}
          className="flex-row items-center gap-3 py-1"
        >
          <View className="h-10 w-10 rounded-xl bg-primary/10 items-center justify-center">
            <ReceiptText size={18} color="#B45309" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">Store & owner</Text>
            <Text className="text-xs text-muted-foreground mt-0.5">Name, owner, address, contact, footer</Text>
          </View>
          <ChevronRight size={18} color="#64748B" />
        </Pressable>
      </Card>

      <View className="h-4" />
      <SectionTitle>Application</SectionTitle>
      <Card>
        <Pressable
          onPress={() => navigation.navigate('ApplicationInfo')}
          className="flex-row items-center gap-3 py-1"
        >
          <View className="h-10 w-10 rounded-xl bg-primary/10 items-center justify-center">
            <Info size={18} color="#B45309" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">Application info</Text>
            <Text className="text-xs text-muted-foreground mt-0.5">Version, database, offline status</Text>
          </View>
          <ChevronRight size={18} color="#64748B" />
        </Pressable>
      </Card>

      <Text className="text-xs text-muted-foreground text-center mt-6">
        {APP_NAME} v{APP_VERSION}
      </Text>
    </ScreenContainer>
  );
}
