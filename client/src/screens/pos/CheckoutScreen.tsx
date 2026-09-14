import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  ShoppingCart,
  Receipt,
  Plus,
  Minus,
  Trash2,
  Banknote,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Button,
  Card,
  Divider,
  Row,
  SectionTitle,
  EmptyState,
  useToast,
} from '@/components/ui';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/auth/authStore';
import { orderService } from '@/services/orderService';
import { formatPHP, parseAmount } from '@/utils/currency';
import { CASH_CHIPS } from '@/constants';
import { toUserMessage } from '@/utils/errors';
import type { AppStackParamList } from '@/navigation/types';
import { cn } from '@/theme/cn';

type Nav = NativeStackNavigationProp<AppStackParamList>;

export function CheckoutScreen() {
  const navigation = useNavigation<Nav>();

  const items = useCartStore((s) => s.items);
  const increase = useCartStore((s) => s.increaseQty);
  const decrease = useCartStore((s) => s.decreaseQty);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const getSubtotal = useCartStore((s) => s.subtotal);

  const user = useAuthStore((s) => s.session?.user ?? null);
  const toast = useToast();

  const [cash, setCash] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reservedNumber, setReservedNumber] = useState<string | null>(null);
  const paymentLockedRef = useRef(false);

  const subtotal = useMemo(() => getSubtotal(), [items]);
  const total = subtotal;
  const cashNum = parseAmount(cash);
  const change = Math.max(0, Math.round((cashNum - total) * 100) / 100);
  const sufficient = cashNum >= total && total > 0;
  const remaining = Math.max(0, total - cashNum);

  useEffect(() => {
    try {
      const num = orderService.reserveOrderNumber();
      setReservedNumber(num);
    } catch {
      setReservedNumber(null);
    }
  }, []);

  const handleRemove = (productId: number) => {
    remove(productId);
    if (items.length <= 1) {
      navigation.goBack();
    }
  };

  const handleAddMore = () => {
    navigation.goBack();
  };

  const confirm = async () => {
    if (paymentLockedRef.current || submitting) return;
    if (!items.length) {
      toast.error('Your cart is empty');
      return;
    }
    if (!sufficient) {
      toast.error('Payment amount is insufficient');
      return;
    }
    paymentLockedRef.current = true;
    setSubmitting(true);
    try {
      const result = orderService.checkout({
        items,
        cashReceived: cashNum,
        cashierId: user?.id,
        orderNumber: reservedNumber ?? undefined,
      });
      clearCart();
      navigation.replace('Receipt', { orderId: result.orderId });
    } catch (err) {
      paymentLockedRef.current = false;
      toast.error(toUserMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-background">

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-xs text-muted-foreground">Order number</Text>
              <Text className="text-xl font-bold text-foreground">
                {reservedNumber ?? '—'}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10">
              <ShoppingCart size={14} color="#B45309" />
              <Text className="text-xs font-semibold text-primary">
                {items.reduce((s, it) => s + it.quantity, 0)} item{items.length === 1 ? '' : 's'}
              </Text>
            </View>
          </View>

          <SectionTitle>Order items</SectionTitle>
          {items.length === 0 ? (
            <EmptyState
              title="Cart is empty"
              description="Add products from the POS to start an order."
            />
          ) : (
            <View className="gap-2 mb-2">
              {items.map((it) => (
                <CheckoutLine
                  key={it.productId}
                  item={it}
                  onIncrease={() => increase(it.productId)}
                  onDecrease={() => decrease(it.productId)}
                  onSetQty={(qty) => setQty(it.productId, qty)}
                  onRemove={() => handleRemove(it.productId)}
                />
              ))}
            </View>
          )}

          {items.length > 0 ? (
            <Pressable
              onPress={handleAddMore}
              className="flex-row items-center justify-center gap-1.5 py-3 mt-1 rounded-xl border border-dashed border-border bg-card/50"
            >
              <Plus size={16} color="#0F172A" />
              <Text className="text-sm font-medium text-foreground">Add more items</Text>
            </Pressable>
          ) : null}

          <View className="h-6" />

          <SectionTitle>Payment</SectionTitle>
          <Card className="p-4">
            <Row label="Subtotal" value={formatPHP(subtotal)} />
            <View className="h-1" />
            <View className="flex-row items-center justify-between pt-1">
              <Text className="text-base font-bold text-foreground">Total</Text>
              <Text className="text-2xl font-bold text-primary">{formatPHP(total)}</Text>
            </View>

            <View className="h-4" />
            <Divider />
            <View className="h-4" />

            <Text className="text-sm font-medium text-foreground mb-2">Cash received</Text>
            <View className="h-14 px-4 rounded-xl border border-input bg-secondary/40 items-end justify-center flex-row items-center">
              <Banknote size={20} color="#64748B" />
              <Text className="flex-1 text-right text-2xl font-bold text-foreground ml-2">
                {cash ? formatPHP(cashNum) : '₱0.00'}
              </Text>
            </View>

            {!sufficient && cash.length > 0 ? (
              <View className="mt-2 px-3 py-2 rounded-lg bg-destructive/10">
                <Text className="text-xs font-medium text-destructive">
                  {formatPHP(remaining)} short
                </Text>
              </View>
            ) : null}

            <View className="flex-row flex-wrap gap-2 mt-3">
              {CASH_CHIPS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCash(String(c))}
                  className="px-4 h-10 rounded-full border border-border bg-card items-center justify-center"
                >
                  <Text className="text-sm font-medium text-foreground">₱{c}</Text>
                </Pressable>
              ))}
              <Pressable
                onPress={() => setCash(String(total))}
                className="px-4 h-10 rounded-full bg-primary items-center justify-center"
              >
                <Text className="text-sm font-semibold text-primary-foreground">Exact</Text>
              </Pressable>
            </View>

            <View className="flex-row gap-2 mt-3">
              {[1, 2, 3].map((n) => (
                <NumKey key={n} label={String(n)} onPress={() => setCash((c) => c + String(n))} />
              ))}
              <Pressable
                onPress={() => setCash((c) => c.slice(0, -1))}
                className="flex-1 h-12 rounded-xl border border-border bg-card items-center justify-center"
              >
                <Trash2 size={18} color="#0F172A" />
              </Pressable>
            </View>
            <View className="flex-row gap-2 mt-2">
              {[4, 5, 6].map((n) => (
                <NumKey key={n} label={String(n)} onPress={() => setCash((c) => c + String(n))} />
              ))}
              <Pressable
                onPress={() => setCash((c) => c + '0')}
                className="flex-1 h-12 rounded-xl border border-border bg-card items-center justify-center"
              >
                <Text className="text-base font-semibold text-foreground">0</Text>
              </Pressable>
            </View>
            <View className="flex-row gap-2 mt-2">
              {[7, 8, 9].map((n) => (
                <NumKey key={n} label={String(n)} onPress={() => setCash((c) => c + String(n))} />
              ))}
              <Pressable
                onPress={() => setCash('')}
                className="flex-1 h-12 rounded-xl border border-destructive/40 bg-destructive/5 items-center justify-center"
              >
                <Text className="text-xs font-semibold text-destructive">CLEAR</Text>
              </Pressable>
            </View>

            <View className="h-4" />
            <Divider />
            <View className="h-4" />

            <Row label="Cash" value={formatPHP(cashNum)} />
            <View className="h-1" />
            <Row
              label="Change"
              value={formatPHP(change)}
              valueClassName={cn('text-lg', change > 0 ? 'text-success' : 'text-foreground')}
            />
          </Card>
        </ScrollView>

        <View className="px-4 py-3 border-t border-border bg-card">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm text-muted-foreground">
              {items.length === 0 ? 'No items' : `${items.length} item${items.length === 1 ? '' : 's'} in cart`}
            </Text>
            <Text className="text-lg font-bold text-primary">{formatPHP(total)}</Text>
          </View>
          <View className="flex-row gap-2">
            <Button
              label="Cancel"
              variant="outline"
              onPress={() => navigation.goBack()}
              size="lg"
              className="flex-1"
            />
            <Button
              label={sufficient ? 'Confirm & Pay' : cash.length === 0 ? 'Enter cash' : `Need ${formatPHP(remaining)}`}
              onPress={confirm}
              disabled={!sufficient || items.length === 0}
              loading={submitting}
              size="lg"
              className="flex-[2]"
              leftIcon={<Receipt size={18} color="#FFFFFF" />}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function NumKey({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 h-12 rounded-xl border border-border bg-card items-center justify-center active:bg-secondary"
    >
      <Text className="text-lg font-semibold text-foreground">{label}</Text>
    </Pressable>
  );
}

function CheckoutLine({
  item,
  onIncrease,
  onDecrease,
  onSetQty,
  onRemove,
}: {
  item: { productId: number; name: string; price: number; quantity: number; availableStock: number };
  onIncrease: () => void;
  onDecrease: () => void;
  onSetQty: (qty: number) => void;
  onRemove: () => void;
}) {
  const lineTotal = item.price * item.quantity;
  const atMax = item.quantity >= item.availableStock;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(item.quantity));

  useEffect(() => {
    setDraft(String(item.quantity));
  }, [item.quantity]);

  const draftExceedsStock = editing && parseInt(draft, 10) > item.availableStock;

  const commitQty = () => {
    const parsed = parseInt(draft, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      onSetQty(parsed);
    }
    setEditing(false);
    setDraft(String(item.quantity));
  };

  return (
    <View className="bg-card border border-border rounded-xl p-3">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 pr-2">
          <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            {formatPHP(item.price)} each
          </Text>
        </View>
        <Pressable onPress={onRemove} hitSlop={8} className="h-7 w-7 items-center justify-center rounded-full bg-destructive/10">
          <Trash2 size={14} color="#B91C1C" />
        </Pressable>
      </View>
      <View className="flex-row items-center justify-between">
        <View className="items-start">
          <View className="flex-row items-center h-9 rounded-lg border border-border bg-secondary overflow-hidden">
            <Pressable
              onPress={onDecrease}
              className="h-9 w-9 items-center justify-center"
              hitSlop={4}
            >
              <Minus size={16} color="#0F172A" />
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
                className="w-12 text-center text-sm font-semibold text-foreground p-0"
              />
            ) : (
              <Pressable
                onPress={() => {
                  setDraft(String(item.quantity));
                  setEditing(true);
                }}
                className="w-12 items-center justify-center active:bg-border/40"
                hitSlop={4}
                accessibilityRole="button"
                accessibilityLabel={`Set quantity for ${item.name}`}
              >
                <Text className="text-sm font-semibold text-foreground">{item.quantity}</Text>
              </Pressable>
            )}
            <Pressable
              onPress={onIncrease}
              disabled={atMax}
              className={cn('h-9 w-9 items-center justify-center', atMax && 'opacity-40')}
              hitSlop={4}
            >
              <Plus size={16} color="#0F172A" />
            </Pressable>
          </View>
          {draftExceedsStock ? (
            <Text className="text-[10px] font-medium text-destructive mt-1">
              Max {item.availableStock}
            </Text>
          ) : null}
        </View>
        <Text className="text-base font-bold text-foreground">{formatPHP(lineTotal)}</Text>
      </View>
    </View>
  );
}
