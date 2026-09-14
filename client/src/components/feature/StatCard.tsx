import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '@/components/ui';
import { cn } from '@/theme/cn';

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'destructive';
  className?: string;
}

const toneClasses: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-primary/5 border-primary/20',
  success: 'bg-success/5 border-success/20',
  warning: 'bg-warning/5 border-warning/20',
  destructive: 'bg-destructive/5 border-destructive/20',
};

const iconWrap: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-primary/15',
  success: 'bg-success/15',
  warning: 'bg-warning/15',
  destructive: 'bg-destructive/15',
};

export function StatCard({ label, value, hint, icon, tone = 'default', className }: StatCardProps) {
  return (
    <Card className={cn(toneClasses[tone], 'h-[112px] p-4 justify-between', className)}>
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </Text>
          <Text
            className="text-2xl font-bold text-foreground mt-1"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
          >
            {value}
          </Text>
        </View>
        <View className={cn('h-10 w-10 shrink-0 rounded-xl items-center justify-center', iconWrap[tone])}>
          {icon}
        </View>
      </View>
      <Text className="text-xs text-muted-foreground" numberOfLines={1}>
        {hint ? hint : ' '}
      </Text>
    </Card>
  );
}
