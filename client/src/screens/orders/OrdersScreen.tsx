import React, { useCallback } from 'react';
import { FlatList, RefreshControl, View, Pressable, Text } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Trash2 } from 'lucide-react-native';
import { Header, ScreenContainer, Tabs, EmptyState, useDialog, useToast } from '@/components/ui';
import { OrderRowView } from '@/components/feature/OrderRowView';
import { useOrderStore, type OrderFilter } from '@/stores/orderStore';
import { formatPHP } from '@/utils/currency';
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

  useFocusEffect(
    useCallback(() => {
      loadToday();
    }, [loadToday]),
  );

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

  return (
    <ScreenContainer edges={['top']} scroll={false}>
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

      <View className="mb-3">
        <Tabs
          items={FILTERS.map((f) => ({ key: f.key, label: f.label }))}
          value={filter}
          onChange={(k) => setFilter(k as OrderFilter)}
          scrollable
        />
      </View>

      {orders.length === 0 ? (
        <View className="px-4">
          <EmptyState
            title="No orders yet"
            description="Completed transactions will appear here. Try creating one from the POS tab."
          />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => String(o.id)}
          renderItem={({ item }) => (
            <OrderRowView
              order={item}
              onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
              onDelete={() => handleDeleteOne(item.id, item.order_number)}
            />
          )}
          contentContainerStyle={{ flexGrow: 1, paddingTop: 4, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadToday} tintColor="#B45309" />
          }
        />
      )}
    </ScreenContainer>
  );
}
