import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, Pressable, ScrollView } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { ShoppingCart, Search, X } from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Header,
  ScreenContainer,
  EmptyState,
  Input,
  useToast,
  useCartFly,
} from '@/components/ui';
import type { CartFlyRect } from '@/components/ui/CartFly';
import { ProductCard } from '@/components/feature/ProductCard';
import { useProductStore } from '@/stores/productStore';
import { useCartStore } from '@/stores/cartStore';
import type { AppStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList>;

function measure(node: View | null): Promise<CartFlyRect | null> {
  return new Promise((resolve) => {
    if (!node) return resolve(null);
    node.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }));
  });
}

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
  const [pulseToken, setPulseToken] = useState(0);

  const toast = useToast();
  const cartFly = useCartFly();

  const cartRef = useRef<View | null>(null);
  const cardRefs = useRef<Record<number, View | null>>({});

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

  const onAdd = async (p: (typeof products)[number]) => {
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

    const [from, to] = await Promise.all([
      measure(cardRefs.current[p.id] ?? null),
      measure(cartRef.current),
    ]);
    if (!from || !to) return;

    cartFly.fly({
      from,
      to,
      onReach: () => {
        setPulseToken((t) => t + 1);
      },
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
            <CartIcon
              count={itemCount}
              pulseToken={pulseToken}
              onPress={goToCheckout}
              registerRef={(node) => {
                cartRef.current = node;
              }}
            />
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

      <View className="px-4 mb-3">
        <View
          className="bg-card border border-border rounded-full overflow-hidden"
          style={{
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 6,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            {tabs.map((it) => {
              const active = it.key === activeKey;
              return (
                <Pressable
                  key={it.key}
                  onPress={() => setCategory(it.key === 'all' ? null : Number(it.key))}
                  className={`h-9 px-4 items-center justify-center rounded-full border ${
                    active ? 'bg-primary border-primary' : 'bg-card border-border'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      active ? 'text-primary-foreground' : 'text-foreground'
                    }`}
                  >
                    {it.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
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
            <View
              className="flex-1"
              ref={(node) => {
                cardRefs.current[item.id] = node;
              }}
            >
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

function CartIcon({
  count,
  pulseToken,
  onPress,
  registerRef,
}: {
  count: number;
  pulseToken: number;
  onPress: () => void;
  registerRef: (node: View | null) => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    if (pulseToken === 0) return;
    scale.value = withSequence(
      withSpring(1.28, { damping: 10, stiffness: 240 }),
      withSpring(1, { damping: 14, stiffness: 220 }),
    );
  }, [pulseToken, scale]);

  return (
    <View ref={registerRef} className="relative -mr-2">
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={onPress}
          className="p-2 active:opacity-60"
          accessibilityRole="button"
          accessibilityLabel={`Cart, ${count} items`}
          hitSlop={6}
        >
          <ShoppingCart size={22} color="#0F172A" />
          {count > 0 ? (
            <View className="absolute top-0 right-0 h-4 min-w-[16px] px-1 rounded-full bg-destructive items-center justify-center">
              <Text className="text-[10px] font-bold text-white leading-none">
                {count > 99 ? '99+' : count}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </Animated.View>
    </View>
  );
}
