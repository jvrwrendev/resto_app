import React, { useEffect } from 'react';
import { Modal, Pressable, View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { cn } from '@/theme/cn';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Sheet({ visible, onClose, title, children, className }: SheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className={cn('bg-card rounded-t-3xl border-t border-border', className)}
          style={{ paddingBottom: insets.bottom + 8 }}
        >
          <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-border">
            {title ? <Text className="text-lg font-semibold text-foreground">{title}</Text> : <View />}
            <Pressable onPress={onClose} hitSlop={8} className="h-9 w-9 items-center justify-center rounded-full bg-muted">
              <X size={18} color="#0F172A" />
            </Pressable>
          </View>
          <View className="px-5 py-4">{children}</View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
