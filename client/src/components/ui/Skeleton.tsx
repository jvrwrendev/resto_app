import React from 'react';
import { View } from 'react-native';
import { cn } from '@/theme/cn';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <View className={cn('bg-muted rounded-md overflow-hidden', className)} />;
}
