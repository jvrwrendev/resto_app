import React, { useEffect, useState } from 'react';
import { Modal, Pressable, View, Text, ScrollView } from 'react-native';
import { CheckCircle2, Printer, Plus, X } from 'lucide-react-native';
import { Button, Row, useToast } from '@/components/ui';
import { receiptService } from '@/services/receiptService';
import { printerService } from '@/services/printerService';
import type { OrderRow } from '@/database/repositories/orderRepository';
import { listOrderItems, type OrderItemRow } from '@/database/repositories/orderRepository';
import { formatPHP } from '@/utils/currency';
import { useAuthStore, currentUser } from '@/auth/authStore';

interface ReceiptDialogProps {
  visible: boolean;
  order: OrderRow | null;
  onClose: () => void;
  onNewOrder?: () => void;
}

export function ReceiptDialog({ visible, order, onClose, onNewOrder }: ReceiptDialogProps) {
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [printing, setPrinting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (visible && order) {
      setItems(listOrderItems(order.id));
    }
  }, [visible, order]);

  if (!order) return null;

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const text = receiptService.toText(
        receiptService.assemble(order, items, { cashier: currentUser(useAuthStore.getState())?.name }),
      );
      if (!printerService.status().connected) {
        toast.error('No Bluetooth printer found');
        return;
      }
      const r = await printerService.printText(text);
      if (r.ok) toast.success('Receipt printed');
      else toast.error('Transaction saved, but receipt printing failed');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 items-center justify-center px-5" onPress={onClose}>
        <Pressable onPress={() => {}} className="w-full max-w-md">
          <View className="bg-card rounded-2xl border border-border overflow-hidden">
            <View className="px-5 pt-5 pb-3 flex-row items-start justify-between">
              <View className="items-center flex-1">
                <View className="h-12 w-12 rounded-full bg-success/15 items-center justify-center mb-2">
                  <CheckCircle2 size={24} color="#15803D" />
                </View>
                <Text className="text-lg font-bold text-foreground">Payment successful</Text>
                <Text className="text-xs text-muted-foreground mt-0.5">{order.order_number}</Text>
              </View>
              <Pressable onPress={onClose} hitSlop={8} className="h-8 w-8 items-center justify-center rounded-full bg-muted">
                <X size={16} color="#0F172A" />
              </Pressable>
            </View>

            <ScrollView className="px-5" style={{ maxHeight: 320 }}>
              {items.map((it) => (
                <View key={it.id} className="py-2 border-b border-border">
                  <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                    {it.product_name}
                  </Text>
                  <View className="flex-row items-center justify-between mt-0.5">
                    <Text className="text-xs text-muted-foreground">
                      {it.quantity} × {formatPHP(it.unit_price)}
                    </Text>
                    <Text className="text-sm font-semibold text-foreground">{formatPHP(it.subtotal)}</Text>
                  </View>
                </View>
              ))}
              <View className="py-3">
                <Row label="Total" value={formatPHP(order.total)} valueClassName="text-lg text-primary" />
                <Row label="Cash" value={formatPHP(order.cash_received)} />
                <Row label="Change" value={formatPHP(order.change_amount)} valueClassName="text-success" />
              </View>
            </ScrollView>

            <View className="p-4 border-t border-border flex-row gap-2">
              <Button
                label={printing ? 'Printing…' : 'Print receipt'}
                onPress={handlePrint}
                variant="outline"
                loading={printing}
                leftIcon={<Printer size={16} color="#0F172A" />}
                className="flex-1"
              />
              <Button
                label="New order"
                onPress={onNewOrder ?? onClose}
                leftIcon={<Plus size={16} color="#FFFFFF" />}
                className="flex-1"
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
