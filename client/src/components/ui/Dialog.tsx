import React, { createContext, useContext, useState, useCallback } from 'react';
import { Modal, Pressable, Text, View, ActivityIndicator } from 'react-native';
import { Button } from './Button';

type Variant = 'info' | 'success' | 'warning' | 'error';

interface AlertConfig {
  title: string;
  description?: string;
  variant?: Variant;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ConfirmContextValue {
  alert: (cfg: AlertConfig | string) => Promise<boolean>;
  confirm: (cfg: AlertConfig | string) => Promise<boolean>;
  loading: (active: boolean, message?: string) => void;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useDialog(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useDialog must be used within DialogProvider');
  return ctx;
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [cfg, setCfg] = useState<AlertConfig | null>(null);
  const [resolver, setResolver] = useState<((v: boolean) => void) | null>(null);
  const [loadingActive, setLoadingActive] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>();

  const openDialog = useCallback((c: AlertConfig) => {
    return new Promise<boolean>((resolve) => {
      setCfg(c);
      setResolver(() => resolve);
      setOpen(true);
    });
  }, []);

  const close = useCallback(
    (value: boolean) => {
      if (resolver) resolver(value);
      setResolver(null);
      setOpen(false);
      setCfg(null);
    },
    [resolver],
  );

  const value: ConfirmContextValue = {
    alert: (input) => {
      const c: AlertConfig = typeof input === 'string' ? { title: input } : input;
      return openDialog(c).then((v) => {
        if (v && c.onConfirm) c.onConfirm();
        if (!v && c.onCancel) c.onCancel();
        return v;
      });
    },
    confirm: (input) => {
      const c: AlertConfig = typeof input === 'string' ? { title: input, confirmLabel: 'Confirm', cancelLabel: 'Cancel' } : input;
      return openDialog(c).then((v) => {
        if (v && c.onConfirm) c.onConfirm();
        if (!v && c.onCancel) c.onCancel();
        return v;
      });
    },
    loading: (active, message) => {
      setLoadingActive(active);
      setLoadingMessage(message);
    },
  };

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => close(false)}>
        <Pressable className="flex-1 bg-black/50 items-center justify-center px-6" onPress={() => close(false)}>
          <Pressable onPress={() => {}} className="w-full">
            {cfg ? (
              <View className="bg-card rounded-2xl border border-border p-5">
                <Text className="text-lg font-semibold text-foreground">{cfg.title}</Text>
                {cfg.description ? (
                  <Text className="text-sm text-muted-foreground mt-2">{cfg.description}</Text>
                ) : null}
                <View className="flex-row gap-2 mt-5 justify-end">
                  {cfg.cancelLabel ? (
                    <Button label={cfg.cancelLabel} variant="outline" onPress={() => close(false)} />
                  ) : null}
                  <Button
                    label={cfg.confirmLabel ?? 'OK'}
                    variant={cfg.variant === 'error' || cfg.variant === 'warning' ? 'destructive' : 'default'}
                    onPress={() => close(true)}
                  />
                </View>
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
      <Modal visible={loadingActive} transparent animationType="fade">
        <View className="flex-1 bg-black/40 items-center justify-center">
          <View className="bg-card rounded-2xl border border-border p-6 items-center min-w-[160px]">
            <ActivityIndicator color="#B45309" />
            {loadingMessage ? (
              <Text className="text-sm text-foreground mt-3">{loadingMessage}</Text>
            ) : null}
          </View>
        </View>
      </Modal>
    </ConfirmContext.Provider>
  );
}
