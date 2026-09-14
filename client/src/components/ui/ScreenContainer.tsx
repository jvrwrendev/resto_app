import React from 'react';
import { View, Text, ScrollView, RefreshControl, ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '@/theme/cn';

interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentClassName?: string;
  className?: string;
  edges?: ('top' | 'bottom')[];
}

export function ScreenContainer({
  children,
  scroll = true,
  refreshing,
  onRefresh,
  contentClassName,
  className,
  edges = ['top'],
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const padTop = edges.includes('top') ? insets.top : 0;
  const padBottom = edges.includes('bottom') ? insets.bottom : 0;
  if (scroll) {
    return (
      <ScrollView
        className={cn('flex-1 bg-background w-full', className)}
        contentContainerStyle={{
          paddingTop: padTop,
          paddingBottom: padBottom + 24,
          alignItems: 'center',
        }}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor="#B45309" />
          ) : undefined
        }
      >
        <View className={cn('w-full max-w-5xl px-4', contentClassName)}>{children}</View>
      </ScrollView>
    );
  }
  return (
    <View
      className={cn('flex-1 bg-background w-full', className)}
      style={{ paddingTop: padTop, paddingBottom: padBottom }}
    >
      <View className={cn('flex-1 w-full max-w-5xl px-4 self-center', contentClassName)}>
        {children}
      </View>
    </View>
  );
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  left?: React.ReactNode;
  className?: string;
}

export function Header({ title, subtitle, right, left, className }: HeaderProps) {
  return (
    <View className={cn('flex-row items-center justify-between mb-4', className)}>
      <View className="flex-row items-center gap-3 flex-1">
        {left}
        <View className="flex-1">
          <Text className="text-2xl font-bold text-foreground">{title}</Text>
          {subtitle ? <Text className="text-sm text-muted-foreground mt-0.5">{subtitle}</Text> : null}
        </View>
      </View>
      {right}
    </View>
  );
}
