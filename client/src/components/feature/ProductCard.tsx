import React, { useEffect, useState } from 'react';
import { Pressable, Text, View, Image, TextInput } from 'react-native';
import { Minus, Plus, ImageOff } from 'lucide-react-native';
import { Card, Badge } from '@/components/ui';
import { cn } from '@/theme/cn';
import { formatPHP } from '@/utils/currency';

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  currentStock: number;
  lowStockThreshold: number;
  isActive: boolean;
  imageUri?: string | null;
  inCartQty: number;
  onAdd: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  onSetQty?: (qty: number) => void;
}

const ACTION_HEIGHT = 44;

export function ProductCard({
  name,
  price,
  currentStock,
  lowStockThreshold,
  isActive,
  imageUri,
  inCartQty,
  onAdd,
  onIncrease,
  onDecrease,
  onSetQty,
}: ProductCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(inCartQty));

  useEffect(() => {
    setDraft(String(inCartQty));
  }, [inCartQty]);

  const isOutOfStock = !isActive || currentStock <= 0;
  const isLow = !isOutOfStock && currentStock <= lowStockThreshold;
  const inCart = inCartQty > 0;
  const draftExceedsStock = editing && parseInt(draft, 10) > currentStock;

  const commitQty = () => {
    const parsed = parseInt(draft, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      onSetQty?.(parsed);
    }
    setEditing(false);
    setDraft(String(inCartQty));
  };

  const startEditing = () => {
    setDraft(String(inCartQty));
    setEditing(true);
  };

  return (
    <Card
      className={cn(
        'p-0 overflow-hidden',
        isOutOfStock && 'opacity-60',
      )}
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      }}
    >
      <View className="aspect-[4/3] w-full bg-muted items-center justify-center overflow-hidden">
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <ImageOff size={32} color="#94A3B8" />
        )}
      </View>

      <View className="p-3">
        <Text
          className="text-[15px] font-semibold text-foreground leading-tight"
          numberOfLines={2}
        >
          {name}
        </Text>

        <View className="flex-row items-baseline justify-between mt-2">
          <Text className="text-xl font-bold text-primary" numberOfLines={1}>
            {formatPHP(price)}
          </Text>
          {isLow ? <Badge label="Low" variant="warning" /> : null}
        </View>

        <Text className="text-xs text-muted-foreground mt-0.5">
          {isOutOfStock ? 'Out of stock' : `Stock: ${currentStock}`}
        </Text>

        <View className="mt-3" style={{ minHeight: ACTION_HEIGHT }}>
          {inCart ? (
            <View className="items-stretch">
              <View
                className="flex-row items-center justify-between rounded-xl border border-border bg-secondary overflow-hidden"
                style={{ height: ACTION_HEIGHT }}
              >
                <Pressable
                  onPress={onDecrease}
                  className="w-11 items-center justify-center"
                  style={{ height: ACTION_HEIGHT }}
                  hitSlop={4}
                >
                  <Minus size={18} color="#0F172A" />
                </Pressable>
                {editing ? (
                  <TextInput
                    value={draft}
                    onChangeText={(t) => setDraft(t.replace(/[^0-9]/g, ''))}
                    onBlur={commitQty}
                    onSubmitEditing={commitQty}
                    keyboardType="number-pad"
                    autoFocus
                    selectTextOnFocus
                    maxLength={5}
                    className="w-14 text-center text-base font-semibold text-foreground p-0"
                    style={{ height: ACTION_HEIGHT }}
                  />
                ) : (
                  <Pressable
                    onPress={startEditing}
                    className="flex-1 items-center justify-center active:bg-border/40"
                    style={{ height: ACTION_HEIGHT }}
                    hitSlop={4}
                    accessibilityRole="button"
                    accessibilityLabel={`Set quantity for ${name}`}
                  >
                    <Text className="text-base font-semibold text-foreground">{inCartQty}</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={onIncrease}
                  disabled={inCartQty >= currentStock}
                  className={cn(
                    'w-11 items-center justify-center',
                    inCartQty >= currentStock && 'opacity-40',
                  )}
                  style={{ height: ACTION_HEIGHT }}
                  hitSlop={4}
                >
                  <Plus size={18} color="#0F172A" />
                </Pressable>
              </View>
              {draftExceedsStock ? (
                <Text className="text-[10px] font-medium text-destructive mt-1 text-center">
                  Max {currentStock}
                </Text>
              ) : null}
            </View>
          ) : (
            <Pressable
              onPress={onAdd}
              disabled={isOutOfStock}
              className={cn(
                'rounded-xl items-center justify-center',
                isOutOfStock ? 'bg-muted' : 'bg-primary active:opacity-80',
              )}
              style={{ height: ACTION_HEIGHT }}
            >
              <Text
                className={cn(
                  'text-sm font-semibold',
                  isOutOfStock ? 'text-muted-foreground' : 'text-primary-foreground',
                )}
              >
                {isOutOfStock ? 'Out of stock' : 'Add'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Card>
  );
}
