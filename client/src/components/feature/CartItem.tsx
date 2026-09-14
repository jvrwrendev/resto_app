import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { formatPHP } from '@/utils/currency';
import { cn } from '@/theme/cn';
import type { CartLineItem } from '@/services/orderService';

interface CartItemProps {
  item: CartLineItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

export function CartItem({ item, onIncrease, onDecrease, onRemove }: CartItemProps) {
  const canIncrease = item.quantity < item.availableStock;
  return (
    <View className="flex-row items-center py-3 border-b border-border">
      <View className="flex-1 pr-2">
        <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-xs text-muted-foreground mt-0.5">
          {formatPHP(item.price)} each
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={onDecrease}
          className="h-9 w-9 items-center justify-center rounded-lg border border-border bg-card"
          hitSlop={4}
        >
          <Minus size={16} color="#0F172A" />
        </Pressable>
        <Text className="w-6 text-center text-base font-semibold text-foreground">
          {item.quantity}
        </Text>
        <Pressable
          onPress={onIncrease}
          disabled={!canIncrease}
          className={cn(
            'h-9 w-9 items-center justify-center rounded-lg border border-border bg-card',
            !canIncrease && 'opacity-40',
          )}
          hitSlop={4}
        >
          <Plus size={16} color="#0F172A" />
        </Pressable>
        <View className="w-20 items-end">
          <Text className="text-sm font-bold text-foreground">
            {formatPHP(item.price * item.quantity)}
          </Text>
        </View>
        <Pressable
          onPress={onRemove}
          className="h-9 w-9 items-center justify-center rounded-lg"
          hitSlop={4}
        >
          <Trash2 size={16} color="#DC2626" />
        </Pressable>
      </View>
    </View>
  );
}
