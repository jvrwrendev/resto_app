import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Modal, Pressable, Text, View, Platform } from 'react-native';
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
      setTimeout(() => remove(id), 2800);
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
      {children}
      <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: insets.top + 8,
            left: 16,
            right: 16,
            gap: 8,
            zIndex: 9999,
          }}
        >
          {toasts.map((t) => (
            <ToastView key={t.id} item={t} onDismiss={() => remove(t.id)} />
          ))}
        </View>
      </View>
    </ToastContext.Provider>
  );
}

function ToastView({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const variantStyles: Record<ToastVariant, { bg: string; text: string; icon: React.ReactNode }> = {
    success: { bg: 'bg-success', text: 'text-white', icon: <CheckCircle2 size={18} color="#fff" /> },
    error: { bg: 'bg-destructive', text: 'text-white', icon: <AlertCircle size={18} color="#fff" /> },
    info: { bg: 'bg-foreground', text: 'text-white', icon: <Info size={18} color="#fff" /> },
  };
  const s = variantStyles[item.variant];
  return (
    <View
      className={cn('flex-row items-center gap-3 px-4 py-3 rounded-xl', s.bg)}
      style={Platform.OS === 'android' ? { elevation: 4 } : {}}
    >
      {s.icon}
      <Text className={cn('flex-1 text-sm font-medium', s.text)}>{item.message}</Text>
      <Pressable onPress={onDismiss} hitSlop={8}>
        <X size={16} color="#fff" />
      </Pressable>
    </View>
  );
}
