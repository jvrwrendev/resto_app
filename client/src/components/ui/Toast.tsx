import React, { createContext, useCallback, useContext, useState } from 'react';
import { Pressable, Text, View, Platform } from 'react-native';
import Animated, { 
  FadeInUp, 
  FadeOutUp, 
  Layout, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  runOnJS 
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';
import { cn } from '@/theme/cn';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

let _id = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const insets = useSafeAreaInsets();

  const remove = useCallback((id: number) => {
    setToasts((cur) => cur.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = _id++;
      setToasts((cur) => [...cur, { id, message, variant }]);
      setTimeout(() => remove(id), 3500);
    },
    [remove],
  );

  const value: ToastContextValue = {
    show,
    success: (m) => show(m, 'success'),
    error: (m) => show(m, 'error'),
    info: (m) => show(m, 'info'),
  };

  return (
    <ToastContext.Provider value={value}>
      <GestureHandlerRootView className="flex-1">
        {children}
        <View
          pointerEvents="box-none"
          className="absolute inset-0"
        >
          <View
            pointerEvents="box-none"
            className="absolute left-4 right-4 gap-2.5 z-[9999]"
            style={{ top: insets.top + 8 }}
          >
            {toasts.map((t) => (
              <ToastView key={t.id} item={t} onDismiss={() => remove(t.id)} />
            ))}
          </View>
        </View>
      </GestureHandlerRootView>
    </ToastContext.Provider>
  );
}

function ToastView({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const translateY = useSharedValue(0);

  // Swipe-up gesture to dismiss
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY < 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY < -20 || e.velocityY < -300) {
        runOnJS(onDismiss)();
      } else {
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const variantStyles: Record<
    ToastVariant,
    { border: string; iconBg: string; text: string; icon: React.ReactNode }
  > = {
    success: {
      border: 'border-emerald-500/20 dark:border-emerald-500/30',
      iconBg: 'bg-emerald-500/10 text-emerald-500',
      text: 'text-zinc-900 dark:text-zinc-100',
      icon: <CheckCircle2 size={18} className="text-emerald-500" />,
    },
    error: {
      border: 'border-rose-500/20 dark:border-rose-500/30',
      iconBg: 'bg-rose-500/10 text-rose-500',
      text: 'text-zinc-900 dark:text-zinc-100',
      icon: <AlertCircle size={18} className="text-rose-500" />,
    },
    info: {
      border: 'border-blue-500/20 dark:border-blue-500/30',
      iconBg: 'bg-blue-500/10 text-blue-500',
      text: 'text-zinc-900 dark:text-zinc-100',
      icon: <Info size={18} className="text-blue-500" />,
    },
  };

  const s = variantStyles[item.variant];

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        entering={FadeInUp.springify().damping(15).stiffness(120)}
        exiting={FadeOutUp.duration(200)}
        layout={Layout.springify()}
        style={[
          animatedStyle,
          Platform.OS === 'android'
            ? { elevation: 6 }
            : {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 12,
              },
        ]}
        className={cn(
          'flex-row items-center gap-3 px-3.5 py-3 rounded-2xl border bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md',
          s.border
        )}
      >
        <View className={cn('p-1.5 rounded-full items-center justify-center', s.iconBg)}>
          {s.icon}
        </View>

        <Text className={cn('flex-1 text-sm font-medium leading-5', s.text)}>
          {item.message}
        </Text>

        <Pressable
          onPress={onDismiss}
          hitSlop={12}
          className="p-1 rounded-full active:bg-zinc-100 dark:active:bg-zinc-800"
        >
          <X size={16} className="text-zinc-400 dark:text-zinc-500" />
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}