import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { CheckCircle2, Database as DbIcon, WifiOff, HardDrive } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card, Row, SectionTitle } from '@/components/ui';
import { APP_NAME, APP_VERSION } from '@/constants';
import { listProducts } from '@/database/repositories/productRepository';
import { listAllOrders } from '@/database/repositories/orderRepository';
import { syncService } from '@/services/syncService';
import { formatStorageSize, getAppStorageUsage, type StorageBreakdown } from '@/services/storageService';

export function ApplicationInfoScreen() {
  const productCount = listProducts().length;
  const orderCount = listAllOrders().length;
  const pendingSync = syncService.pending();

  const [storage, setStorage] = useState<StorageBreakdown>(() => getAppStorageUsage());

  useFocusEffect(
    useCallback(() => {
      setStorage(getAppStorageUsage());
    }, []),
  );

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-4 py-4">
        <Card>
          <Row label="Application" value={APP_NAME} />
          <Row label="Version" value={`v${APP_VERSION}`} />
          <Row label="Platform" value="React Native + Expo" />
          <Row label="App Storage" value={formatStorageSize(storage.totalBytes)} />
        </Card>

        <View className="h-4" />
        <SectionTitle>Status</SectionTitle>
        <Card>
          <View className="flex-row items-center gap-3 py-1">
            <View className="h-10 w-10 rounded-xl bg-success/10 items-center justify-center">
              <WifiOff size={18} color="#15803D" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">Offline mode</Text>
              <Text className="text-xs text-muted-foreground mt-0.5">Always available. No internet required.</Text>
            </View>
            <CheckCircle2 size={18} color="#15803D" />
          </View>
          <View className="h-3" />
          <View className="flex-row items-center gap-3 py-1">
            <View className="h-10 w-10 rounded-xl bg-primary/10 items-center justify-center">
              <DbIcon size={18} color="#B45309" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">Local database</Text>
              <Text className="text-xs text-muted-foreground mt-0.5">SQLite (expo-sqlite) — ready</Text>
            </View>
            <CheckCircle2 size={18} color="#15803D" />
          </View>
          <View className="h-3" />
          <View className="flex-row items-center gap-3 py-1">
            <View className="h-10 w-10 rounded-xl bg-primary/10 items-center justify-center">
              <HardDrive size={18} color="#B45309" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">On-device storage</Text>
              <Text className="text-xs text-muted-foreground mt-0.5">
                Includes inventory images, database, and other app data.
              </Text>
            </View>
            <Text className="text-sm font-bold text-foreground">{formatStorageSize(storage.totalBytes)}</Text>
          </View>
        </Card>

        <View className="h-4" />
        <SectionTitle>Database</SectionTitle>
        <Card>
          <Row label="Products" value={String(productCount)} />
          <Row label="Orders (lifetime)" value={String(orderCount)} />
          <Row label="Pending sync" value={String(pendingSync)} />
          <Row label="Engine" value="expo-sqlite" />
          <Row label="Database size" value={formatStorageSize(storage.databaseBytes)} />
          <Row label="Product images" value={formatStorageSize(storage.imagesBytes)} />
        </Card>

        <View className="h-4" />
        <SectionTitle>Architecture</SectionTitle>
        <Card>
          <View className="gap-1.5">
            <Text className="text-sm text-foreground">• React Native + TypeScript</Text>
            <Text className="text-sm text-foreground">• NativeWind / Tailwind CSS</Text>
            <Text className="text-sm text-foreground">• Zustand state management</Text>
            <Text className="text-sm text-foreground">• Repository / service layered DB</Text>
            <Text className="text-sm text-foreground">• Bluetooth ESC/POS printer</Text>
            <Text className="text-sm text-foreground">• Modular auth ready for NestJS</Text>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}
