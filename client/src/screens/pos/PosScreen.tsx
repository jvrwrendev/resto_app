import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { ShoppingCart, Search, X } from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Header, ScreenContainer, Tabs, EmptyState, Input, useToast } from '@/components/ui';
import { ProductCard } from '@/components/feature/ProductCard';
import { useProductStore } from '@/stores/productStore';
import { useCartStore } from '@/stores/cartStore';
import type { AppStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList>;

export function PosScreen() {
  const navigation = useNavigation<Nav>();
  const products = useProductStore((s) => s.products);
  const categories = useProductStore((s) => s.categories);
  const selectedCategoryId = useProductStore((s) => s.selectedCategoryId);
  const setCategory = useProductStore((s) => s.setCategory);
  const load = useProductStore((s) => s.load);

  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const increase = useCartStore((s) => s.increaseQty);
  const decrease = useCartStore((s) => s.decreaseQty);
  const setQty = useCartStore((s) => s.setQty);
  const refreshStockLimits = useCartStore((s) => s.refreshStockLimits);
  const getItemCount = useCartStore((s) => s.itemCount);

  const itemCount = getItemCount();

  const [query, setQuery] = useState('');

  const toast = useToast();

  useFocusEffect(
    useCallback(() => {
      load();
      refreshStockLimits(useProductStore.getState().products);
    }, [load, refreshStockLimits]),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products;
    if (selectedCategoryId != null) {
      list = list.filter((p) => p.category_id === selectedCategoryId);
    }
    if (q) {
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, selectedCategoryId, query]);

  const cartByProduct = useMemo(() => {
    const map = new Map<number, number>();
    for (const it of items) map.set(it.productId, it.quantity);
    return map;
  }, [items]);

  const onAdd = (p: typeof products[number]) => {
    if (p.current_stock <= 0) {
      toast.error('Insufficient stock');
      return;
    }
    addItem({
      productId: p.id,
      name: p.name,
      price: p.price,
      availableStock: p.current_stock,
    });
  };

  const tabs = [
    { key: 'all', label: 'All' },
    ...categories.map((c) => ({ key: String(c.id), label: c.name })),
  ];
  const activeKey = selectedCategoryId == null ? 'all' : String(selectedCategoryId);

  const goToCheckout = () => {
    if (items.length === 0) {
      toast.info('Add at least one item to checkout');
      return;
    }
    navigation.navigate('Checkout');
  };

  return (
    <ScreenContainer edges={['top']} scroll={false} contentClassName="px-0">
      <View className="px-4">
        <Header
          title="Point of Sale"
          subtitle="Tap a product to add to cart"
          right={
            <Pressable
              onPress={goToCheckout}
              className="relative p-2 -mr-2 active:opacity-60"
              accessibilityRole="button"
              accessibilityLabel={`Cart, ${itemCount} items`}
              hitSlop={6}
            >
              <ShoppingCart size={22} color="#0F172A" />
              {itemCount > 0 ? (
                <View className="absolute top-0 right-0 h-4 min-w-[16px] px-1 rounded-full bg-destructive items-center justify-center">
                  <Text className="text-[10px] font-bold text-white leading-none">
                    {itemCount > 99 ? '99+' : itemCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          }
        />
      </View>

      <View className="px-4 mb-3">
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Search products…"
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

      <View className="mb-3">
        <Tabs
          items={tabs}
          value={activeKey}
          onChange={(k) => setCategory(k === 'all' ? null : Number(k))}
          scrollable
        />
      </View>

      {filtered.length === 0 ? (
        <View className="px-4">
          <EmptyState
            title={query ? 'No matches' : 'No products'}
            description={
              query
                ? `No products match "${query}".`
                : 'There are no products in this category. Add some from Inventory.'
            }
          />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => String(p.id)}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          contentContainerStyle={{ flexGrow: 1, paddingTop: 4, paddingBottom: 24, gap: 12 }}
          renderItem={({ item }) => (
            <View className="flex-1">
              <ProductCard
                id={item.id}
                name={item.name}
                price={item.price}
                currentStock={item.current_stock}
                lowStockThreshold={item.low_stock_threshold}
                isActive={item.is_active === 1}
                imageUri={item.image_uri}
                inCartQty={cartByProduct.get(item.id) ?? 0}
                onAdd={() => onAdd(item)}
                onIncrease={() => increase(item.id)}
                onDecrease={() => decrease(item.id)}
                onSetQty={(qty) => setQty(item.id, qty)}
              />
            </View>
          )}
        />
      )}
    </ScreenContainer>
  );
}
