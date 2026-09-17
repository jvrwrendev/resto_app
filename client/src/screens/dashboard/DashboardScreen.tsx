import React, { useCallback, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Banknote, ClipboardList, Package, AlertTriangle, ShoppingBag, Store, User, ChevronRight } from 'lucide-react-native';
import { Header, ScreenContainer, Card, SectionTitle, EmptyState } from '@/components/ui';
import { StatCard } from '@/components/feature/StatCard';
import { OrderRowView } from '@/components/feature/OrderRowView';
import { SalesBarChart } from '@/components/feature/SalesBarChart';
import { useSettingsStore } from '@/stores/settingsStore';
import { useOrderStore, type OrderFilter } from '@/stores/orderStore';
import { todayStats, hourlySales, listOrdersByDate } from '@/database/repositories/orderRepository';
import { listLowStockProducts } from '@/database/repositories/productRepository';
import { formatPHP } from '@/utils/currency';
import { todayKey } from '@/utils/date';
import type { AppStackParamList } from '@/navigation/types';
import type { OrderRow } from '@/database/repositories/orderRepository';
import type { Product } from '@/database/repositories/productRepository';

export function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const storeSettings = useSettingsStore((s) => s.storeSettings);
  const [stats, setStats] = useState(() => todayStats(todayKey()));
  const [hourly, setHourly] = useState(() => hourlySales(todayKey()));
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [recent, setRecent] = useState<OrderRow[]>([]);

  const load = useCallback(() => {
    setStats(todayStats(todayKey()));
    setHourly(hourlySales(todayKey()));
    setLowStock(listLowStockProducts().slice(0, 5));
    setRecent(listOrdersByDate(todayKey()).slice(0, 5));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const goToOrders = (filter: OrderFilter) => {
    useOrderStore.getState().setFilter(filter);
    navigation.navigate('MainTabs', { screen: 'Orders' });
  };

  const goToInventory = () => {
    navigation.navigate('MainTabs', { screen: 'Inventory' });
  };

  return (
    <ScreenContainer edges={['top']} onRefresh={load}>
      <Header title="Dashboard" subtitle="Today's summary" />

      <Card className="mb-4">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 rounded-2xl bg-primary/10 items-center justify-center">
            <User size={22} color="#B45309" />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-muted-foreground">Welcome back</Text>
            <Text className="text-lg font-semibold text-foreground">
              {storeSettings.ownerName || 'Store Owner'}
            </Text>
            <View className="flex-row items-center gap-1 mt-0.5">
              <Store size={12} color="#64748B" />
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {storeSettings.storeName}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      <View className="flex-row gap-3 mb-3">
        <StatCard
          className="flex-1"
          label="Sales"
          value={formatPHP(stats.totalSales)}
          icon={<Banknote size={18} color="#B45309" />}
          tone="default"
          onPress={() => goToOrders('PAID')}
        />
        <StatCard
          className="flex-1"
          label="Orders"
          value={String(stats.orderCount)}
          icon={<ClipboardList size={18} color="#15803D" />}
          tone="success"
          onPress={() => goToOrders('ALL')}
        />
      </View>
      <View className="flex-row gap-3 mb-3">
        <StatCard
          className="flex-1"
          label="Items sold"
          value={String(stats.itemsSold)}
          icon={<ShoppingBag size={18} color="#1D4ED8" />}
          tone="default"
          onPress={() => goToOrders('ALL')}
        />
        <StatCard
          className="flex-1"
          label="Pending"
          value={String(stats.notServedCount)}
          hint={stats.notServedCount > 0 ? 'not served' : 'all served'}
          icon={<Package size={18} color="#D97706" />}
          tone={stats.notServedCount > 0 ? 'warning' : 'success'}
          onPress={() => goToOrders('NOT_SERVED')}
        />
      </View>

      <View className="h-2" />

      <SalesBarChart data={hourly} />

      <View className="h-4" />

      <View className="flex-row items-center justify-between mb-2">
        <SectionTitle className="mb-0">Low stock products</SectionTitle>
        <Pressable onPress={goToInventory} className="flex-row items-center gap-0.5 py-1" hitSlop={8}>
          <Text className="text-xs font-semibold text-primary">View all</Text>
          <ChevronRight size={14} color="#B45309" />
        </Pressable>
      </View>
      {lowStock.length === 0 ? (
        <Card>
          <Text className="text-sm text-muted-foreground text-center py-2">All products are well stocked.</Text>
        </Card>
      ) : (
        lowStock.map((p) => (
          <Pressable key={p.id} onPress={goToInventory}>
            <View className="bg-card border border-border rounded-2xl p-3 mb-2 flex-row items-center justify-between active:opacity-80">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                  {p.name}
                </Text>
                <Text className="text-xs text-muted-foreground mt-0.5">
                  Stock: {p.current_stock} / threshold {p.low_stock_threshold}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <AlertTriangle size={16} color="#D97706" />
                <Text className="text-xs font-semibold text-warning">
                  {p.current_stock <= 0 ? 'Out' : 'Low'}
                </Text>
              </View>
            </View>
          </Pressable>
        ))
      )}

      <View className="h-4" />

      <View className="flex-row items-center justify-between mb-2">
        <SectionTitle className="mb-0">Recent transactions</SectionTitle>
        <Pressable onPress={() => goToOrders('ALL')} className="flex-row items-center gap-0.5 py-1" hitSlop={8}>
          <Text className="text-xs font-semibold text-primary">View all</Text>
          <ChevronRight size={14} color="#B45309" />
        </Pressable>
      </View>
      {recent.length === 0 ? (
        <EmptyState title="No transactions yet" description="Orders you complete will appear here." />
      ) : (
        recent.map((o) => (
          <OrderRowView
            key={o.id}
            order={o}
            onPress={() => navigation.navigate('OrderDetails', { orderId: o.id })}
          />
        ))
      )}
    </ScreenContainer>
  );
}
