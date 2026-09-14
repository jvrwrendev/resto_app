import React from 'react';
import { View, Text, Pressable, ViewProps } from 'react-native';
import { cn } from '@/theme/cn';

interface DividerProps {
  className?: string;
}

export function Divider({ className }: DividerProps) {
  return <View className={cn('h-px bg-border', className)} />;
}

interface RowProps {
  label: string;
  value: string;
  valueClassName?: string;
  className?: string;
}

export function Row({ label, value, valueClassName, className }: RowProps) {
  return (
    <View className={cn('flex-row items-center justify-between py-2', className)}>
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className={cn('text-sm font-semibold text-foreground', valueClassName)}>{value}</Text>
    </View>
  );
}

interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionTitle({ children, className }: SectionTitleProps) {
  return (
    <Text className={cn('text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2', className)}>
      {children}
    </Text>
  );
}
