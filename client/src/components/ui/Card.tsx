import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { cn } from '@/theme/cn';

export function Card({ className, children, ...rest }: ViewProps) {
  return (
    <View
      className={cn('bg-card border border-border rounded-2xl p-4', className)}
      {...rest}
    >
      {children}
    </View>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <View className={cn('mb-2', className)}>{children}</View>;
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <Text className={cn('text-lg font-semibold text-foreground', className)}>{children}</Text>;
}

export function CardDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  return <Text className={cn('text-sm text-muted-foreground', className)}>{children}</Text>;
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <View className={cn('', className)}>{children}</View>;
}

export function CardFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <View className={cn('mt-3', className)}>{children}</View>;
}
