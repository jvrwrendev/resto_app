import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { Printer, CheckCircle2, AlertTriangle } from 'lucide-react-native';
import { Button } from '@/components/ui';
import type { ReceiptPrintPhase } from '@/hooks/useReceiptPrinting';

interface ReceiptPrintOverlayProps {
  visible: boolean;
  phase: ReceiptPrintPhase;
  step: number;
  printed: boolean;
  shortNo: string;
  error?: string;
  onRetry: () => void;
  onContinue: () => void;
}

export function ReceiptPrintOverlay({
  visible,
  phase,
  step,
  printed,
  shortNo,
  error,
  onRetry,
  onContinue,
}: ReceiptPrintOverlayProps) {
  if (!visible) return null;
  return (
    <View className="absolute inset-0 bg-black/50 items-center justify-center px-6">
      <View className="w-full max-w-md bg-card rounded-2xl border border-border p-6 items-center">
        {phase === 'printing' ? (
          <PrintingBody step={step} shortNo={shortNo} />
        ) : phase === 'failed' ? (
          <FailedBody shortNo={shortNo} error={error} onRetry={onRetry} onContinue={onContinue} />
        ) : (
          <DoneBody printed={printed} shortNo={shortNo} />
        )}
      </View>
    </View>
  );
}

const PRINT_STEPS = ['1...', '2...', '3...', 'Printing Receipt...'];
const STEP_CAPTIONS = [
  'Saving your order',
  'Generating order number',
  'Preparing receipt',
  'Sending to your Bluetooth printer',
];

function PrintStepLabel({ step }: { step: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [step, opacity]);
  const isFinal = step === PRINT_STEPS.length - 1;
  return (
    <Animated.View style={{ opacity }} className="items-center">
      {isFinal ? (
        <Text className="text-xl font-bold text-foreground">{PRINT_STEPS[step]}</Text>
      ) : (
        <Text className="text-5xl font-bold text-primary">{PRINT_STEPS[step]}</Text>
      )}
      <Text className="text-sm text-muted-foreground mt-1 text-center">
        {STEP_CAPTIONS[step]}
      </Text>
    </Animated.View>
  );
}

function usePulse(active: boolean) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration: 650, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [active, value]);

  const scale = value.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const opacity = value.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  return { scale, opacity };
}

function IconBubble({
  children,
  bgClass,
}: {
  children: React.ReactNode;
  bgClass: string;
}) {
  return (
    <View className={`h-16 w-16 rounded-full items-center justify-center mb-3 ${bgClass}`}>
      {children}
    </View>
  );
}

function PrintingBody({ step, shortNo }: { step: number; shortNo: string }) {
  const { scale, opacity } = usePulse(true);
  return (
    <>
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        <IconBubble bgClass="bg-primary/15">
          <Printer size={30} color="#B45309" />
        </IconBubble>
      </Animated.View>
      <PrintStepLabel step={Math.min(step, PRINT_STEPS.length - 1)} />
      {shortNo ? (
        <View className="mt-3 px-4 py-1.5 rounded-full bg-primary/10">
          <Text className="text-xs font-semibold text-primary">ORDER NO: {shortNo}</Text>
        </View>
      ) : null}
    </>
  );
}

function FailedBody({
  shortNo,
  error,
  onRetry,
  onContinue,
}: {
  shortNo: string;
  error?: string;
  onRetry: () => void;
  onContinue: () => void;
}) {
  return (
    <>
      <IconBubble bgClass="bg-destructive/15">
        <AlertTriangle size={28} color="#B91C1C" />
      </IconBubble>
      <Text className="text-xl font-bold text-foreground">Printing failed</Text>
      <Text className="text-sm text-muted-foreground mt-1 text-center">
        {error ?? 'The receipt could not be sent to the printer.'}
      </Text>
      <Text className="text-xs text-muted-foreground mt-3 text-center">
        {shortNo
          ? `Order ${shortNo} is saved. You can retry printing or continue.`
          : 'Your order is saved. You can retry printing or continue.'}
      </Text>
      <View className="w-full mt-5 gap-2">
        <Button
          label="Retry printing"
          onPress={onRetry}
          size="lg"
          fullWidth
          leftIcon={<Printer size={18} color="#FFFFFF" />}
        />
        <Button
          label="Continue without printing"
          variant="outline"
          onPress={onContinue}
          size="lg"
          fullWidth
        />
      </View>
    </>
  );
}

function DoneBody({ printed, shortNo }: { printed: boolean; shortNo: string }) {
  return (
    <>
      <IconBubble bgClass="bg-success/15">
        <CheckCircle2 size={28} color="#15803D" />
      </IconBubble>
      <Text className="text-xl font-bold text-foreground">
        {printed ? '✓  Receipt Printed' : 'Payment received'}
      </Text>
      {shortNo ? (
        <View className="mt-2 px-4 py-1.5 rounded-lg bg-primary/10">
          <Text className="text-sm font-semibold text-primary">Order No: {shortNo}</Text>
        </View>
      ) : null}
      <Text className="text-xs text-muted-foreground mt-3">Returning to POS…</Text>
    </>
  );
}