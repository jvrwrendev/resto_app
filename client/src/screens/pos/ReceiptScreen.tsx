import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Printer } from 'lucide-react-native';
import { Button } from '@/components/ui';
import {
  findOrderById,
  listOrderItems,
  type OrderItemRow,
  type OrderRow,
} from '@/database/repositories/orderRepository';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore, currentUser } from '@/auth/authStore';
import { receiptService } from '@/services/receiptService';
import { useReceiptPrinting } from '@/hooks/useReceiptPrinting';
import { ReceiptPrintOverlay } from '@/components/feature/ReceiptPrintOverlay';
import { formatPHP } from '@/utils/currency';
import { formatDateTime } from '@/utils/date';
import type { AppStackParamList } from '@/navigation/types';

export function ReceiptScreen() {
  const route = useRoute<RouteProp<AppStackParamList, 'Receipt'>>();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { orderId } = route.params;
  const autoPrint = useSettingsStore((s) => s.autoPrint);
  const printing = useReceiptPrinting();

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<OrderItemRow[]>([]);

  useEffect(() => {
    setOrder(findOrderById(orderId));
    setItems(listOrderItems(orderId));
  }, [orderId]);

  const data = useMemo(() => {
    if (!order) return null;
    return receiptService.assemble(order, items, {
      cashier: currentUser(useAuthStore.getState())?.name,
    });
  }, [order, items]);

  const text = useMemo(() => (data ? receiptService.toText(data) : ''), [data]);

  const shortNo = useMemo(() => {
    if (!order) return '';
    const parts = order.order_number.split('-');
    return parts[parts.length - 1] ?? order.order_number;
  }, [order]);

  useEffect(() => {
    if (!autoPrint || !order) return;
    printing.start(order, text);
  }, [autoPrint, order, text, printing.start]);

  useEffect(() => {
    if (printing.phase !== 'done') return;
    const t = setTimeout(() => navigation.popToTop(), 1900);
    return () => clearTimeout(t);
  }, [printing.phase, navigation]);

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Order not found.</Text>
      </View>
    );
  }

  const busy = printing.phase === 'printing' || printing.phase === 'done';

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <View className="bg-card rounded-2xl border border-border p-5">
          <Text className="text-center text-lg font-extrabold text-foreground">{data?.storeName}</Text>
          {data?.address ? (
            <Text className="text-center text-xs text-muted-foreground mt-0.5">{data.address}</Text>
          ) : null}
          {data?.contact ? (
            <Text className="text-center text-xs text-muted-foreground">{data.contact}</Text>
          ) : null}

          <View className="h-3" />
          <View className="border-t border-border" />
          <View className="h-3" />

          <View className="items-center">
            <Text className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Order Number
            </Text>
            <Text className="text-2xl font-extrabold text-primary">{order.order_number}</Text>
          </View>

          <View className="mt-2">
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted-foreground">Date</Text>
              <Text className="text-sm text-foreground">{formatDateTime(order.created_at)}</Text>
            </View>
            <View className="flex-row justify-between mt-0.5">
              <Text className="text-sm text-muted-foreground">Status</Text>
              <Text className="text-sm font-semibold text-success">
                {order.payment_status === 'PAID' ? 'PAID' : order.payment_status}
              </Text>
            </View>
          </View>

          <View className="h-3" />
          <View className="border-t border-border" />
          <View className="h-3" />

          <Text className="text-sm font-semibold text-foreground mb-2">Items</Text>
          {data?.items.map((it, idx) => (
            <View key={idx} className="flex-row justify-between py-1">
              <View className="flex-1 pr-2">
                <Text className="text-sm text-foreground">{it.name}</Text>
                <Text className="text-xs text-muted-foreground">
                  {it.qty} × {formatPHP(it.unitPrice)}
                </Text>
              </View>
              <Text className="text-sm font-semibold text-foreground">{formatPHP(it.subtotal)}</Text>
            </View>
          ))}

          <View className="border-t border-border pt-3 mt-2">
            <View className="flex-row justify-between py-0.5">
              <Text className="text-sm text-muted-foreground">Subtotal</Text>
              <Text className="text-sm text-foreground">{formatPHP(data?.subtotal ?? 0)}</Text>
            </View>
            <View className="flex-row justify-between py-1">
              <Text className="text-lg font-bold text-foreground">TOTAL</Text>
              <Text className="text-lg font-extrabold text-primary">{formatPHP(order.total)}</Text>
            </View>
            <View className="flex-row justify-between py-0.5">
              <Text className="text-sm text-muted-foreground">Cash</Text>
              <Text className="text-sm text-foreground">{formatPHP(order.cash_received)}</Text>
            </View>
            <View className="flex-row justify-between py-0.5">
              <Text className="text-sm text-muted-foreground">Change</Text>
              <Text className="text-sm font-semibold text-success">
                {formatPHP(order.change_amount)}
              </Text>
            </View>
            <View className="flex-row justify-between py-0.5">
              <Text className="text-sm text-muted-foreground">Payment</Text>
              <Text className="text-sm font-semibold text-foreground">
                {data?.paymentMethod} {data?.paymentStatus}
              </Text>
            </View>
            {data?.cashier ? (
              <View className="flex-row justify-between py-0.5">
                <Text className="text-sm text-muted-foreground">Cashier</Text>
                <Text className="text-sm text-foreground">{data.cashier}</Text>
              </View>
            ) : null}
          </View>

          <View className="border-t border-border mt-3 pt-3">
            <Text className="text-center text-xs text-muted-foreground">{data?.footer}</Text>
          </View>
        </View>

        <View className="mt-5">
          <Button
            label="Print Receipt"
            size="lg"
            fullWidth
            disabled={busy}
            leftIcon={<Printer size={18} color="#FFFFFF" />}
            onPress={() => order && printing.start(order, text)}
          />
          <Text className="text-center text-xs text-muted-foreground mt-2">
            Receipt is sent to the Bluetooth printer connected in Settings.
          </Text>
        </View>
      </ScrollView>

      <ReceiptPrintOverlay
        visible={printing.phase !== 'idle'}
        phase={printing.phase}
        step={printing.step}
        printed={printing.printed}
        shortNo={shortNo}
        error={printing.error}
        onRetry={printing.retry}
        onContinue={printing.close}
      />
    </View>
  );
}