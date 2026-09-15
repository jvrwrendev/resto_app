import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ShoppingCart } from 'lucide-react-native';
import { colors } from '@/theme/tokens';

export interface CartFlyRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FlyOptions {
  from: CartFlyRect;
  to: CartFlyRect;
  onReach?: () => void;
}

interface ActiveFly extends FlyOptions {
  id: number;
}

interface CartFlyContextValue {
  fly: (options: FlyOptions) => void;
}

const CartFlyContext = createContext<CartFlyContextValue | null>(null);

const DURATION = 600;

export function CartFlyProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<ActiveFly | null>(null);
  const counter = useRef(1);

  const fly = useCallback((options: FlyOptions) => {
    setActive({ ...options, id: counter.current++ });
  }, []);

  const clear = useCallback(() => setActive(null), []);

  return (
    <CartFlyContext.Provider value={{ fly }}>
      {children}
      {active ? <FlyItem key={active.id} fly={active} onDone={clear} /> : null}
    </CartFlyContext.Provider>
  );
}

export function useCartFly(): CartFlyContextValue {
  const ctx = useContext(CartFlyContext);
  if (!ctx) throw new Error('useCartFly must be used within CartFlyProvider');
  return ctx;
}

function FlyItem({ fly, onDone }: { fly: ActiveFly; onDone: () => void }) {
  const size = 44;
  const fromCenterX = fly.from.x + fly.from.width / 2;
  const fromCenterY = fly.from.y + fly.from.height / 2;
  const toCenterX = fly.to.x + fly.to.width / 2;
  const toCenterY = fly.to.y + fly.to.height / 2;

  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;
  const peak = dy * 0.5 - Math.max(24, size * 0.6);
  const left = fromCenterX - size / 2;
  const top = fromCenterY - size / 2;

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const { onReach } = fly;

  useEffect(() => {
    tx.value = withTiming(dx, {
      duration: DURATION,
      easing: Easing.out(Easing.quad),
    });
    ty.value = withSequence(
      withTiming(peak, {
        duration: DURATION * 0.5,
        easing: Easing.out(Easing.quad),
      }),
      withTiming(
        dy,
        {
          duration: DURATION * 0.5,
          easing: Easing.in(Easing.quad),
        },
        (finished) => {
          if (!finished) return;
          if (onReach) runOnJS(onReach)();
          runOnJS(onDone)();
        },
      ),
    );
    scale.value = withDelay(
      DURATION * 0.55,
      withTiming(0.5, { duration: DURATION * 0.45, easing: Easing.out(Easing.quad) }),
    );
    opacity.value = withDelay(
      DURATION * 0.55,
      withTiming(0, { duration: DURATION * 0.45, easing: Easing.out(Easing.quad) }),
    );
  }, [dx, dy, peak, onDone, onReach, opacity, scale, tx, ty]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            left,
            top,
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
            elevation: 6,
          },
          animatedStyle,
        ]}
      >
        <ShoppingCart size={20} color="#FFFFFF" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
});