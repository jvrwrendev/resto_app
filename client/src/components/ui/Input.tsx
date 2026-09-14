import React from 'react';
import { TextInput, View, Text, TextInputProps } from 'react-native';
import { cn } from '@/theme/cn';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  containerClassName?: string;
  ref?: React.Ref<TextInput>;
}

export function Input({ label, error, hint, leftSlot, rightSlot, containerClassName, className, ref, ...rest }: InputProps) {
  return (
    <View className={cn('w-full', containerClassName)}>
      {label ? (
        <Text className="text-sm font-medium text-foreground mb-1.5">{label}</Text>
      ) : null}
      <View
        className={cn(
          'flex-row items-center h-12 px-3 rounded-xl border bg-card',
          error ? 'border-destructive' : 'border-input',
        )}
      >
        {leftSlot ? <View className="mr-2">{leftSlot}</View> : null}
        <TextInput
          ref={ref}
          placeholderTextColor="#94A3B8"
          className={cn('flex-1 text-base text-foreground', className)}
          {...rest}
        />
        {rightSlot ? <View className="ml-2">{rightSlot}</View> : null}
      </View>
      {error ? (
        <Text className="text-xs text-destructive mt-1">{error}</Text>
      ) : hint ? (
        <Text className="text-xs text-muted-foreground mt-1">{hint}</Text>
      ) : null}
    </View>
  );
}
