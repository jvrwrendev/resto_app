import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, View, Pressable, Text } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Trash2, Search, X, CircleDollarSign, ReceiptText, ShoppingBag } from 'lucide-react-native';
import { Header, ScreenContainer, Tabs, EmptyState, Input, useDialog, useToast, cn } from '@/components/ui';
import { OrderRowView } from '@/components/feature/OrderRowView';
import { useOrderStore, type OrderFilter } from '@/stores/orderStore';
import { todayStats } from '@/database/repositories/orderRepository';
import { formatPHP } from '@/utils/currency';
import { todayKey } from '@/utils/date';
import type { AppStackParamList } from '@/navigation/types';

const FILTERS: { key: OrderFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PAID', label: 'Paid' },
  { key: 'UNPAID', label: 'Unpaid' },
  { key: 'SERVED', label: 'Served' },
  { key: 'NOT_SERVED', label: 'Not served' },
];

export function OrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const orders = useOrderStore((s) => s.orders);
  const loading = useOrderStore((s) => s.loading);
  const filter = useOrderStore((s) => s.filter);
  const setFilter = useOrderStore((s) => s.setFilter);
  const loadToday = useOrderStore((s) => s.loadToday);
  const deleteOrder = useOrderStore((s) => s.deleteOrder);
  const clearAllToday = useOrderStore((s) => s.clearAllToday);
  const toast = useToast();
  const dialog = useDialog();

  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadToday();
    }, [loadToday]),
  );

  const stats = useMemo(() => todayStats(todayKey()), [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => o.order_number.toLowerCase().includes(q));
  }, [orders, query]);

  const handleDeleteOne = async (orderId: number, orderNumber: string) => {
    const ok = await dialog.confirm({
      title: 'Delete this order?',
      description: `Order ${orderNumber} will be permanently deleted and all deducted stock will be restored.`,
      variant: 'error',
      confirmLabel: 'Delete',
      cancelLabel: 'Keep',
    });
    if (!ok) return;
    try {
      deleteOrder(orderId);
      toast.success(`Order ${orderNumber} deleted`);
    } catch {
      toast.error('Could not delete this order');
    }
  };

  const handleClearAll = async () => {
    const total = orders.reduce((sum, o) => sum + o.total, 0);
    const ok = await dialog.confirm({
      title: 'Delete all orders?',
      description: `All ${orders.length} order${orders.length === 1 ? '' : 's'} today (${formatPHP(total)}) will be permanently deleted and all deducted stock will be restored. This cannot be undone.`,
      variant: 'error',
      confirmLabel: 'Delete all',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    try {
      const deleted = clearAllToday();
      toast.success(`${deleted} order${deleted === 1 ? '' : 's'} deleted`);
    } catch {
      toast.error('Could not delete orders');
    }
  };

  const listHeader = (
    <View>
      <Header
        title="Orders"
        subtitle="Today's transactions"
        right={
          orders.length > 0 ? (
            <Pressable
              onPress={handleClearAll}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Delete all orders"
              className="flex-row items-center gap-1.5 h-9 px-3 rounded-full border border-destructive/40 bg-destructive/5 active:bg-destructive/10"
            >
              <Trash2 size={14} color="#B91C1C" />
              <Text className="text-xs font-semibold text-destructive">Clear all</Text>
            </Pressable>
          ) : null
        }
      />

      <View className="flex-row gap-2.5 mb-4">
        <StatTile
          label="Sales"
          value={formatPHP(stats.totalSales)}
          icon={<CircleDollarSign size={16} color="#15803D" />}
          tone="bg-success/10"
          textTone="text-success"
        />
        <StatTile
          label="Orders"
          value={`${stats.orderCount}`}
          icon={<ReceiptText size={16} color="#B45309" />}
          tone="bg-primary/10"
          textTone="text-primary"
        />
        <StatTile
          label="Items sold"
          value={`${stats.itemsSold}`}
          icon={<ShoppingBag size={16} color="#D97706" />}
          tone="bg-warning/10"
          textTone="text-warning"
        />
      </View>

      <View className="mb-3">
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Search by order number…"
          autoCapitalize="none"
          autoCorrect={false}
          leftSlot={<Search size={18} color="#64748B" />}
          rightSlot={
            query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <X size={18} color="#64748B" />
              </Pressable>
            ) : null
          }
        />
      </View>

      <View className="mb-3">
        <Tabs
          items={FILTERS.map((f) => ({
            key: f.key,
            label:
              f.key === 'ALL'
                ? `All (${stats.orderCount})`
                : f.key === 'PAID'
                  ? `Paid (${stats.paidCount})`
                  : f.key === 'UNPAID'
                    ? `Unpaid (${stats.unpaidCount})`
                    : f.key === 'SERVED'
                      ? `Served (${stats.servedCount})`
                      : `Not served (${stats.notServedCount})`,
          }))}
          value={filter}
          onChange={(k) => setFilter(k as OrderFilter)}
          scrollable
        />
      </View>
    </View>
  );

  return (
    <ScreenContainer edges={['top']} scroll={false}>
      <FlatList
        data={filtered}
        keyExtractor={(o) => String(o.id)}
        renderItem={({ item }) => (
          <OrderRowView
            order={item}
            onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
            onDelete={() => handleDeleteOne(item.id, item.order_number)}
          />
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View className="px-4">
            <EmptyState
              title={query ? 'No matches found' : 'No orders yet'}
              description={
                query
                  ? `No orders match "${query}".`
                  : 'Completed transactions will appear here. Try creating one from the POS tab.'
              }
            />
          </View>
        }
        contentContainerStyle={{ flexGrow: 1, paddingTop: 4, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onRefresh={loadToday}
        refreshing={loading}
      />
    </ScreenContainer>
  );
}

function StatTile({
  label,
  value,
  icon,
  tone,
  textTone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: string;
  textTone: string;
}) {
  return (
    <View className="flex-1 bg-card border border-border rounded-2xl p-3">
      <View className={cn('h-8 w-8 rounded-lg items-center justify-center mb-1.5', tone)}>{icon}</View>
      <Text className={cn('text-lg font-bold leading-tight', textTone)} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text className="text-[11px] font-medium text-muted-foreground mt-0.5">{label}</Text>
    </View>
  );
}