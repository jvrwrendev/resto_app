import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { ImageOff } from 'lucide-react-native';
import { Button, Card, Row, Badge, useDialog, useToast } from '@/components/ui';
import { findOrderById, listOrderItems, type OrderItemRow, type OrderRow } from '@/database/repositories/orderRepository';
import { formatPHP } from '@/utils/currency';
import { formatDateTime } from '@/utils/date';
import { receiptService } from '@/services/receiptService';
import { printerService } from '@/services/printerService';
import { useOrderStore } from '@/stores/orderStore';
import { useAuthStore, currentUser } from '@/auth/authStore';
import type { AppStackParamList } from '@/navigation/types';

export function OrderDetailsScreen() {
  const route = useRoute<RouteProp<AppStackParamList, 'OrderDetails'>>();
  const { orderId } = route.params;
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [printing, setPrinting] = useState(false);
  const markServed = useOrderStore((s) => s.markOrderServed);
  const toast = useToast();
  const dialog = useDialog();

  const load = () => {
    setOrder(findOrderById(orderId));
    setItems(listOrderItems(orderId));
  };

  useEffect(() => {
    load();
  }, [orderId]);

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Order not found.</Text>
      </View>
    );
  }

  const handleMarkServed = async () => {
    const ok = await dialog.confirm({
      title: 'Mark as served?',
      description: `Order ${order.order_number} will be marked as SERVED.`,
      confirmLabel: 'Mark served',
    });
    if (!ok) return;
    markServed(order.id);
    toast.success('Order marked as served');
    load();
  };

  const handlePrint = async () => {
    if (!printerService.status().connected) {
      toast.error('No Bluetooth printer found');
      return;
    }
    setPrinting(true);
    try {
      const text = receiptService.toText(
        receiptService.assemble(order, items, { cashier: currentUser(useAuthStore.getState())?.name }),
      );
      const r = await printerService.printText(text);
      if (r.ok) toast.success('Receipt printed');
      else toast.error('Transaction saved, but receipt printing failed');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-4 py-4">
        <Card>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs text-muted-foreground">Order number</Text>
              <Text className="text-xl font-bold text-foreground mt-0.5">{order.order_number}</Text>
            </View>
            <View className="items-end gap-1.5">
              <Badge
                label={order.payment_status === 'PAID' ? 'Paid' : 'Unpaid'}
                variant={order.payment_status === 'PAID' ? 'success' : 'warning'}
              />
              <Badge
                label={order.serving_status === 'SERVED' ? 'Served' : 'Not served'}
                variant={order.serving_status === 'SERVED' ? 'muted' : 'info'}
              />
            </View>
          </View>
          <View className="mt-2">
            <Row label="Date" value={formatDateTime(order.created_at)} />
          </View>
        </Card>

        <View className="h-4" />
        <Card>
          <Text className="text-sm font-semibold text-foreground mb-2">Items</Text>
          {items.map((it) => (
            <View key={it.id} className="flex-row items-center py-2 border-b border-border">
              <View className="h-10 w-10 rounded-lg bg-muted items-center justify-center overflow-hidden">
                {it.image_uri ? (
                  <Image source={{ uri: it.image_uri }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <ImageOff size={18} color="#94A3B8" />
                )}
              </View>
              <View className="flex-1 pl-3">
                <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                  {it.product_name}
                </Text>
                <Text className="text-xs text-muted-foreground mt-0.5">
                  {it.quantity} × {formatPHP(it.unit_price)}
                </Text>
              </View>
              <Text className="text-sm font-semibold text-foreground">{formatPHP(it.subtotal)}</Text>
            </View>
          ))}
          <View className="pt-3">
            <Row label="Subtotal" value={formatPHP(order.subtotal)} />
            <Row label="Total" value={formatPHP(order.total)} valueClassName="text-lg text-primary" />
            <Row label="Cash" value={formatPHP(order.cash_received)} />
            <Row label="Change" value={formatPHP(order.change_amount)} valueClassName="text-success" />
          </View>
        </Card>

        <View className="h-4" />
        <View className="flex-row justify-between gap-3">
          {order.serving_status !== 'SERVED' ? (
            <Button
              label="Mark as served"
              onPress={handleMarkServed}
              size="lg"
              className="flex-1"
            />
          ) : null}
          <Button
            label={printing ? 'Printing…' : 'Print receipt'}
            variant="outline"
            onPress={handlePrint}
            loading={printing}
            size="lg"
            className="flex-1"
          />
        </View>
      </View>
    </ScrollView>
  );
}
