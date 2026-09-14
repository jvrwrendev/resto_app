import React from 'react';
import { View, Text } from 'react-native';
import { cn } from '@/theme/cn';
import { PackageOpen } from 'lucide-react-native';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <View className={cn('items-center justify-center py-12 px-6', className)}>
      <View className="h-14 w-14 rounded-full bg-muted items-center justify-center mb-3">
        {icon ?? <PackageOpen size={24} color="#64748B" />}
      </View>
      <Text className="text-base font-semibold text-foreground text-center">{title}</Text>
      {description ? (
        <Text className="text-sm text-muted-foreground text-center mt-1 max-w-[260px]">{description}</Text>
      ) : null}
      {action ? <View className="mt-4">{action}</View> : null}
    </View>
  );
}
