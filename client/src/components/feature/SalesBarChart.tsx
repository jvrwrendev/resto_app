import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { BarChart3 } from 'lucide-react-native';
import { Card, SectionTitle } from '@/components/ui';
import { cn } from '@/theme/cn';
import { formatPHP } from '@/utils/currency';
import { formatHourLabel } from '@/utils/date';

interface HourlySale {
  hour: number;
  total: number;
}

interface SalesBarChartProps {
  data: HourlySale[];
}

const CHART_HEIGHT = 128;
const VALUE_SLOT_HEIGHT = 22;

export function SalesBarChart({ data }: SalesBarChartProps) {
  const [selected, setSelected] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <Card>
        <SectionTitle>Today's sales by hour</SectionTitle>
        <View className="py-6 items-center">
          <BarChart3 size={32} color="#D6D3D1" />
          <Text className="text-sm text-muted-foreground mt-2 text-center">
            No paid orders yet today.
          </Text>
        </View>
      </Card>
    );
  }

  const max = Math.max(1, ...data.map((d) => d.total));
  const total = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <Card>
      <View className="flex-row items-start justify-between mb-4">
        <View>
          <SectionTitle>Today's sales by hour</SectionTitle>
          <Text className="text-xs text-muted-foreground">
            Tap a bar to see the exact amount
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-xs text-muted-foreground">Total</Text>
          <Text className="text-lg font-bold text-primary">{formatPHP(total)}</Text>
        </View>
      </View>

      <View className="flex-row items-end gap-1.5">
        {data.map((d, idx) => {
          const isSelected = selected === idx;
          const barHeight = Math.max(8, Math.round((d.total / max) * CHART_HEIGHT));
          const colors = isSelected ? 'bg-primary' : 'bg-primary/40';
          const labelColor = isSelected ? 'text-primary' : 'text-muted-foreground';
          return (
            <Pressable
              key={d.hour}
              onPress={() => setSelected(isSelected ? null : idx)}
              className="flex-1 items-center"
              accessibilityRole="button"
              accessibilityLabel={`${formatHourLabel(new Date(2024, 0, 1, d.hour))}: ${formatPHP(d.total)}`}
            >
              <View style={{ height: VALUE_SLOT_HEIGHT }} className="justify-end mb-1">
                {isSelected ? (
                  <Text className="text-[11px] font-bold text-foreground">
                    {formatPHP(d.total)}
                  </Text>
                ) : null}
              </View>
              <View
                className={cn('w-full max-w-[36px] rounded-t-md', colors)}
                style={{ height: barHeight }}
              />
              <Text className={cn('text-[10px] mt-1.5', labelColor)}>
                {formatHourLabel(new Date(2024, 0, 1, d.hour))}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}