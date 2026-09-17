import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, Switch, Image, FlatList, ListRenderItem } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Plus,
  Edit2,
  PackagePlus,
  Search,
  X,
  Package,
  PackageX,
  AlertTriangle,
  ImageOff,
} from 'lucide-react-native';
import { Header, ScreenContainer, Tabs, Button, Badge, EmptyState, Input, useToast, cn } from '@/components/ui';
import { useProductStore } from '@/stores/productStore';
import { setProductActive, listLowStockProducts } from '@/database/repositories/productRepository';
import { formatPHP } from '@/utils/currency';
import type { AppStackParamList } from '@/navigation/types';
import type { Product } from '@/database/repositories/productRepository';

type Filter = 'ALL' | 'LOW' | 'OUT';

export function InventoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const products = useProductStore((s) => s.products);
  const load = useProductStore((s) => s.loadAdmin);

  const [filter, setFilter] = useState<Filter>('ALL');
  const [query, setQuery] = useState('');
  const toast = useToast();

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const lowStockCount = useMemo(
    () => products.filter((p) => p.current_stock <= p.low_stock_threshold).length,
    [products],
  );
  const outCount = useMemo(() => products.filter((p) => p.current_stock <= 0).length, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products;
    if (filter === 'LOW') list = list.filter((p) => p.current_stock <= p.low_stock_threshold);
    if (filter === 'OUT') list = list.filter((p) => p.current_stock <= 0);
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category_name ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [products, filter, query]);

  const onToggle = (p: Product, value: boolean) => {
    setProductActive(p.id, value);
    load();
    toast.success(value ? 'Product enabled' : 'Product disabled');
  };

  const renderItem: ListRenderItem<Product> = ({ item }) => {
    const isOut = item.current_stock <= 0;
    const isLow = !isOut && item.current_stock <= item.low_stock_threshold;
    return (
      <View
        className="bg-card border border-border rounded-2xl p-3 mb-2.5"
        style={{
          shadowColor: '#000',
          shadowOpacity: 0.04,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 1,
        }}
      >
        <View className="flex-row">
          <View className="h-16 w-16 rounded-xl bg-muted items-center justify-center overflow-hidden">
            {item.image_uri ? (
              <Image source={{ uri: item.image_uri }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <ImageOff size={22} color="#94A3B8" />
            )}
          </View>

          <View className="flex-1 pl-3">
            <View className="flex-row items-start justify-between gap-2">
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="text-xs text-muted-foreground mt-0.5">
                  {item.category_name ?? ''}
                </Text>
              </View>
              <Switch
                value={item.is_active === 1}
                onValueChange={(v) => onToggle(item, v)}
                trackColor={{ false: '#E5E7EB', true: '#B45309' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View className="flex-row items-center justify-between mt-1.5">
              <Text className="text-lg font-bold text-primary">{formatPHP(item.price)}</Text>
              <Text className="text-xs text-muted-foreground">Stock: {item.current_stock}</Text>
            </View>

            <View className="flex-row items-center gap-1.5 mt-1.5">
              {isOut ? (
                <Badge label="Out of stock" variant="destructive" />
              ) : isLow ? (
                <Badge label="Low stock" variant="warning" />
              ) : (
                <Badge label="In stock" variant="success" />
              )}
              {item.is_active === 0 ? <Badge label="Disabled" variant="muted" /> : null}
            </View>
          </View>
        </View>

        <View className="h-px bg-border my-3" />

        <View className="flex-row gap-2">
          <Pressable
            onPress={() => navigation.navigate('AddStock', { productId: item.id })}
            className="flex-1 flex-row items-center justify-center gap-1.5 h-9 rounded-lg border border-border bg-card active:bg-secondary"
          >
            <PackagePlus size={15} color="#0F172A" />
            <Text className="text-xs font-semibold text-foreground">Add stock</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('ProductEdit', { productId: item.id })}
            className="flex-1 flex-row items-center justify-center gap-1.5 h-9 rounded-lg border border-border bg-card active:bg-secondary"
          >
            <Edit2 size={15} color="#0F172A" />
            <Text className="text-xs font-semibold text-foreground">Edit</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const listHeader = (
    <View>
      <Header
        title="Inventory"
        subtitle={`${products.length} products in total`}
        right={
          <Button
            label="New"
            size="sm"
            leftIcon={<Plus size={16} color="#FFFFFF" />}
            onPress={() => navigation.navigate('ProductEdit', { productId: undefined })}
          />
        }
      />

      <View className="flex-row gap-2.5 mb-4">
        <StatTile
          label="Products"
          value={products.length}
          icon={<Package size={16} color="#B45309" />}
          tone="bg-primary/10"
          textTone="text-primary"
        />
        <StatTile
          label="Low stock"
          value={lowStockCount}
          icon={<AlertTriangle size={16} color="#D97706" />}
          tone="bg-warning/10"
          textTone="text-warning"
        />
        <StatTile
          label="Out of stock"
          value={outCount}
          icon={<PackageX size={16} color="#DC2626" />}
          tone="bg-destructive/10"
          textTone="text-destructive"
        />
      </View>

      <View className="mb-3">
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or category…"
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

      <Tabs
        items={[
          { key: 'ALL', label: `All (${products.length})` },
          { key: 'LOW', label: `Low (${lowStockCount})` },
          { key: 'OUT', label: `Out (${outCount})` },
        ]}
        value={filter}
        onChange={(k) => setFilter(k as Filter)}
        className="mb-3"
      />

      <OnlyLowStockBanner products={products} filter={filter} />
    </View>
  );

  return (
    <ScreenContainer edges={['top']} scroll={false} contentClassName="px-0">
      <FlatList
        data={filtered}
        keyExtractor={(p) => String(p.id)}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <EmptyState
            title={query ? 'No matches found' : filter === 'ALL' ? 'No products yet' : 'All good here'}
            description={
              query
                ? `No products match "${query}".`
                : filter === 'ALL'
                  ? 'Add your first product to start selling.'
                  : 'No items in this view right now.'
            }
            action={
              !query && filter === 'ALL' ? (
                <Button
                  label="Add your first product"
                  size="md"
                  leftIcon={<Plus size={16} color="#FFFFFF" />}
                  onPress={() => navigation.navigate('ProductEdit', { productId: undefined })}
                />
              ) : undefined
            }
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 24,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
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
  value: number;
  icon: React.ReactNode;
  tone: string;
  textTone: string;
}) {
  return (
    <View className="flex-1 bg-card border border-border rounded-2xl p-3">
      <View className={cn('h-8 w-8 rounded-lg items-center justify-center mb-1.5', tone)}>{icon}</View>
      <Text className={cn('text-xl font-bold leading-tight', textTone)}>{value}</Text>
      <Text className="text-[11px] font-medium text-muted-foreground mt-0.5">{label}</Text>
    </View>
  );
}

function OnlyLowStockBanner({ products, filter }: { products: Product[]; filter: Filter }) {
  const lowStock = useMemo(() => listLowStockProducts(), [products]);
  if (lowStock.length === 0 || filter !== 'ALL') return null;
  return (
    <View className="rounded-xl border border-warning/30 bg-warning/5 p-3 mb-3">
      <View className="flex-row items-center gap-2">
        <AlertTriangle size={16} color="#D97706" />
        <Text className="text-sm font-semibold text-warning">
          {lowStock.length} product{lowStock.length === 1 ? '' : 's'} running low
        </Text>
      </View>
      <Text className="text-xs text-muted-foreground mt-1 leading-relaxed">
        {lowStock.slice(0, 3).map((p) => p.name).join(', ')}
        {lowStock.length > 3 ? ` and ${lowStock.length - 3} more` : ''} — restock soon.
      </Text>
    </View>
  );
}