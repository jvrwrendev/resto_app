import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Card, Input, useToast } from '@/components/ui';
import { inventoryService } from '@/services/inventoryService';
import { useProductStore } from '@/stores/productStore';
import type { AppStackParamList } from '@/navigation/types';
import { toUserMessage } from '@/utils/errors';

export function AddStockScreen() {
  const route = useRoute<RouteProp<AppStackParamList, 'AddStock'>>();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { productId } = route.params;
  const load = useProductStore((s) => s.loadAdmin);
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const onSave = async () => {
    const q = parseInt(qty, 10);
    if (!Number.isFinite(q) || q <= 0) {
      toast.error('Enter a valid quantity');
      return;
    }
    setSubmitting(true);
    try {
      inventoryService.addStock({ productId, quantity: q, note });
      load();
      toast.success('Stock added');
      navigation.goBack();
    } catch (e) {
      toast.error(toUserMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-4 py-4">
        <Card>
          <Input
            label="Quantity to add"
            value={qty}
            onChangeText={setQty}
            keyboardType="number-pad"
            placeholder="e.g. 50"
          />
          <View className="h-3" />
          <Input
            label="Note (optional)"
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Morning delivery"
          />
          <Text className="text-xs text-muted-foreground mt-2">
            Current stock + added stock = new stock. Every stock change is recorded in the inventory log.
          </Text>
        </Card>

        <View className="h-4" />
        <Button label="Add stock" onPress={onSave} loading={submitting} fullWidth size="lg" />
      </View>
    </ScrollView>
  );
}
