import React from 'react';
import { Text, View, ViewProps } from 'react-native';
import { cn } from '@/theme/cn';

type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'muted' | 'info';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary/10 border-primary/20',
  success: 'bg-success/10 border-success/30',
  warning: 'bg-warning/10 border-warning/30',
  destructive: 'bg-destructive/10 border-destructive/30',
  muted: 'bg-muted border-border',
  info: 'bg-info/10 border-info/30',
};

const variantText: Record<BadgeVariant, string> = {
  default: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  muted: 'text-muted-foreground',
  info: 'text-info',
};

interface BadgeProps extends ViewProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ label, variant = 'default', className }: BadgeProps) {
  return (
    <View
      className={cn(
        'self-start px-2.5 py-0.5 rounded-full border',
        variantClasses[variant],
        className,
      )}
    >
      <Text className={cn('text-xs font-medium', variantText[variant])}>{label}</Text>
    </View>
  );
}
