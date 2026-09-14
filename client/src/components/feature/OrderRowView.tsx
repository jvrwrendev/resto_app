import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { Card, Badge } from '@/components/ui';
import { formatPHP } from '@/utils/currency';
import { formatTime } from '@/utils/date';
import type { OrderRow } from '@/database/repositories/orderRepository';

interface OrderRowViewProps {
  order: OrderRow;
  onPress?: () => void;
  onDelete?: () => void;
}

export function OrderRowView({ order, onPress, onDelete }: OrderRowViewProps) {
  return (
    <Pressable
      onPress={onPress}
      className="active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.order_number}, ${formatPHP(order.total)}`}
    >
      <Card
        className="mb-3 p-4"
        style={{
          shadowColor: '#000',
          shadowOpacity: 0.04,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 1,
        }}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text
              className="text-base font-semibold text-foreground"
              numberOfLines={1}
            >
              {order.order_number}
            </Text>
            <Text className="text-xs text-muted-foreground mt-1">
              {formatTime(order.created_at)}
            </Text>
          </View>
          <View className="items-end">
            <Text
              className="text-lg font-bold text-primary"
              numberOfLines={1}
            >
              {formatPHP(order.total)}
            </Text>
          </View>
        </View>

        <View className="h-3" />

        <View className="flex-row items-center justify-between">
          <View className="flex-row flex-wrap gap-1.5">
            <Badge
              label={order.payment_status === 'PAID' ? 'Paid' : 'Unpaid'}
              variant={order.payment_status === 'PAID' ? 'success' : 'warning'}
            />
            <Badge
              label={order.serving_status === 'SERVED' ? 'Served' : 'Not served'}
              variant={order.serving_status === 'SERVED' ? 'muted' : 'info'}
            />
          </View>
          {onDelete ? (
            <Pressable
              onPress={onDelete}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Delete order ${order.order_number}`}
              className="h-8 w-8 items-center justify-center rounded-full bg-destructive/10 active:bg-destructive/20"
            >
              <Trash2 size={15} color="#B91C1C" />
            </Pressable>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}
