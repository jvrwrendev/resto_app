import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { cn } from '@/theme/cn';

interface TabItem<T extends string> {
  key: T;
  label: string;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (key: T) => void;
  className?: string;
  scrollable?: boolean;
}

export function Tabs<T extends string>({ items, value, onChange, className, scrollable }: TabsProps<T>) {
  const Container = scrollable ? ScrollView : View;
  return (
    <Container
      horizontal={scrollable}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={scrollable ? { paddingHorizontal: 16, gap: 8 } : undefined}
      className={cn(scrollable ? '' : 'flex-row gap-2 px-4', className)}
    >
      {!scrollable &&
        items.map((it) => (
          <Pressable
            key={it.key}
            onPress={() => onChange(it.key)}
            className={cn(
              'h-9 px-4 items-center justify-center rounded-full border',
              value === it.key ? 'bg-primary border-primary' : 'bg-card border-border',
            )}
          >
            <Text
              className={cn(
                'text-sm font-medium',
                value === it.key ? 'text-primary-foreground' : 'text-foreground',
              )}
            >
              {it.label}
            </Text>
          </Pressable>
        ))}
      {scrollable &&
        items.map((it) => (
          <Pressable
            key={it.key}
            onPress={() => onChange(it.key)}
            className={cn(
              'h-9 px-4 items-center justify-center rounded-full border',
              value === it.key ? 'bg-primary border-primary' : 'bg-card border-border',
            )}
          >
            <Text
              className={cn(
                'text-sm font-medium',
                value === it.key ? 'text-primary-foreground' : 'text-foreground',
              )}
            >
              {it.label}
            </Text>
          </Pressable>
        ))}
    </Container>
  );
}
