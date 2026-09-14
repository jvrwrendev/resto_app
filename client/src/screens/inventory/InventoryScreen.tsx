import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, Switch } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Plus, Edit2, PackagePlus } from 'lucide-react-native';
import { Header, ScreenContainer, Tabs, Button, Badge, EmptyState, useToast } from '@/components/ui';
import { useProductStore } from '@/stores/productStore';
import { setProductActive, listLowStockProducts } from '@/database/repositories/productRepository';
import { formatPHP } from '@/utils/currency';
import type { AppStackParamList } from '@/navigation/types';
import type { Product } from '@/database/repositories/productRepository';

export function InventoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const products = useProductStore((s) => s.products);
  const load = useProductStore((s) => s.loadAdmin);

  const [filter, setFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const toast = useToast();

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const lowStock = useMemo(() => listLowStockProducts(), [products]);

  const filtered = useMemo(() => {
    if (filter === 'LOW') return products.filter((p) => p.current_stock <= p.low_stock_threshold);
    if (filter === 'OUT') return products.filter((p) => p.current_stock <= 0);
    return products;
  }, [products, filter]);

  const onToggle = (p: Product, value: boolean) => {
    setProductActive(p.id, value);
    load();
    toast.success(value ? 'Product enabled' : 'Product disabled');
  };

  const renderItem = ({ item }: { item: Product }) => {
    const isOut = item.current_stock <= 0;
    const isLow = !isOut && item.current_stock <= item.low_stock_threshold;
    return (
      <View className="bg-card border border-border rounded-2xl p-3 mb-2">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-2">
            <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              {(item as any).category_name ?? ''}
            </Text>
            <Text className="text-base font-bold text-primary mt-1">{formatPHP(item.price)}</Text>
            <View className="flex-row items-center gap-1.5 mt-1.5">
              <Text className="text-xs text-muted-foreground">Stock: {item.current_stock}</Text>
              {isOut ? <Badge label="Out" variant="destructive" /> : isLow ? <Badge label="Low" variant="warning" /> : <Badge label="OK" variant="success" />}
              {item.is_active === 0 ? <Badge label="Disabled" variant="muted" /> : null}
            </View>
          </View>
          <View className="items-end gap-1.5">
            <View className="flex-row items-center">
              <Text className="text-xs text-muted-foreground mr-1">{item.is_active ? 'On' : 'Off'}</Text>
              <Switch
                value={item.is_active === 1}
                onValueChange={(v) => onToggle(item, v)}
                trackColor={{ false: '#E5E7EB', true: '#B45309' }}
              />
            </View>
            <Pressable
              onPress={() => navigation.navigate('AddStock', { productId: item.id })}
              className="flex-row items-center gap-1 px-2.5 h-8 rounded-lg border border-border bg-card"
            >
              <PackagePlus size={14} color="#0F172A" />
              <Text className="text-xs font-medium text-foreground">Add stock</Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('ProductEdit', { productId: item.id })}
              className="flex-row items-center gap-1 px-2.5 h-8 rounded-lg border border-border bg-card"
            >
              <Edit2 size={14} color="#0F172A" />
              <Text className="text-xs font-medium text-foreground">Edit</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer edges={['top']} onRefresh={load}>
      <Header
        title="Inventory"
        subtitle={`${products.length} products`}
        right={
          <Button
            label="New"
            size="sm"
            leftIcon={<Plus size={16} color="#FFFFFF" />}
            onPress={() => navigation.navigate('ProductEdit', { productId: undefined })}
          />
        }
      />

      <Tabs
        items={[
          { key: 'ALL', label: 'All' },
          { key: 'LOW', label: 'Low stock' },
          { key: 'OUT', label: 'Out of stock' },
        ]}
        value={filter}
        onChange={(k) => setFilter(k as any)}
        className="mb-3"
      />

      {lowStock.length > 0 && filter === 'ALL' ? (
        <View className="rounded-xl border border-warning/30 bg-warning/5 p-3 mb-3">
          <Text className="text-sm font-semibold text-warning">
            {lowStock.length} product{lowStock.length === 1 ? '' : 's'} low on stock
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            {lowStock.slice(0, 3).map((p) => p.name).join(', ')}
            {lowStock.length > 3 ? ` and ${lowStock.length - 3} more` : ''}
          </Text>
        </View>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState title="No products" description="Add your first product to start selling." />
      ) : (
        <View>
          {filtered.map((item) => (
            <View key={item.id}>{renderItem({ item })}</View>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}
