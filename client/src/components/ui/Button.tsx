import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import { cn } from '@/theme/cn';

type Variant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  default: 'bg-primary active:opacity-80',
  secondary: 'bg-secondary active:opacity-80',
  outline: 'border border-border bg-card active:bg-secondary',
  ghost: 'bg-transparent active:bg-secondary',
  destructive: 'bg-destructive active:opacity-80',
};

const variantText: Record<Variant, string> = {
  default: 'text-primary-foreground',
  secondary: 'text-secondary-foreground',
  outline: 'text-foreground',
  ghost: 'text-foreground',
  destructive: 'text-destructive-foreground',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3 rounded-lg',
  md: 'h-11 px-4 rounded-xl',
  lg: 'h-14 px-5 rounded-2xl',
};

const sizeText: Record<Size, string> = {
  sm: 'text-sm',
  md: 'text-base font-semibold',
  lg: 'text-lg font-semibold',
};

export function Button({
  label,
  children,
  onPress,
  variant = 'default',
  size = 'md',
  loading,
  disabled,
  className,
  textClassName,
  fullWidth,
  leftIcon,
  rightIcon,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      className={cn(
        'flex-row items-center justify-center',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        isDisabled && 'opacity-50',
        className,
      )}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#0F172A' : '#FFFFFF'} />
      ) : (
        <View className="flex-row items-center gap-2">
          {leftIcon}
          {label ? (
            <Text className={cn(variantText[variant], sizeText[size], textClassName)}>
              {label}
            </Text>
          ) : (
            children
          )}
          {rightIcon}
        </View>
      )}
    </Pressable>
  );
}
