import React, { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Banknote, ClipboardList, Package, AlertTriangle, ShoppingBag } from 'lucide-react-native';
import { Header, ScreenContainer, Card, SectionTitle, EmptyState } from '@/components/ui';
import { StatCard } from '@/components/feature/StatCard';
import { OrderRowView } from '@/components/feature/OrderRowView';
import { SalesBarChart } from '@/components/feature/SalesBarChart';
import { todayStats, hourlySales, listOrdersByDate } from '@/database/repositories/orderRepository';
import { listLowStockProducts } from '@/database/repositories/productRepository';
import { formatPHP } from '@/utils/currency';
import { todayKey } from '@/utils/date';
import type { AppStackParamList } from '@/navigation/types';
import type { OrderRow } from '@/database/repositories/orderRepository';
import type { Product } from '@/database/repositories/productRepository';

export function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
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

  return (
    <ScreenContainer edges={['top']} onRefresh={load}>
      <Header title="Dashboard" subtitle="Today's summary" />

      <View className="flex-row gap-3 mb-3">
        <StatCard
          className="flex-1"
          label="Sales"
          value={formatPHP(stats.totalSales)}
          icon={<Banknote size={18} color="#B45309" />}
          tone="default"
        />
        <StatCard
          className="flex-1"
          label="Orders"
          value={String(stats.orderCount)}
          icon={<ClipboardList size={18} color="#15803D" />}
          tone="success"
        />
      </View>
      <View className="flex-row gap-3 mb-3">
        <StatCard
          className="flex-1"
          label="Items sold"
          value={String(stats.itemsSold)}
          icon={<ShoppingBag size={18} color="#1D4ED8" />}
          tone="default"
        />
        <StatCard
          className="flex-1"
          label="Pending"
          value={String(stats.notServedCount)}
          hint={stats.notServedCount > 0 ? 'not served' : 'all served'}
          icon={<Package size={18} color="#D97706" />}
          tone={stats.notServedCount > 0 ? 'warning' : 'success'}
        />
      </View>

      <View className="h-2" />

      <SalesBarChart data={hourly} />

      <View className="h-4" />

      <SectionTitle>Low stock products</SectionTitle>
      {lowStock.length === 0 ? (
        <Card>
          <Text className="text-sm text-muted-foreground text-center py-2">All products are well stocked.</Text>
        </Card>
      ) : (
        lowStock.map((p) => (
          <View key={p.id} className="bg-card border border-border rounded-2xl p-3 mb-2 flex-row items-center justify-between">
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
        ))
      )}

      <View className="h-4" />

      <SectionTitle>Recent transactions</SectionTitle>
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
