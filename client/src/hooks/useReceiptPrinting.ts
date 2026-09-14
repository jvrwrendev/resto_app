import { useCallback, useEffect, useRef, useState } from 'react';
import { printerService } from '@/services/printerService';
import type { OrderRow } from '@/database/repositories/orderRepository';

export type ReceiptPrintPhase = 'idle' | 'printing' | 'done' | 'failed';

const STEP_DELAYS = [620, 620, 620, 520];
const PRINT_TIMEOUT_MS = 15000;

export function useReceiptPrinting() {
  const [phase, setPhase] = useState<ReceiptPrintPhase>('idle');
  const [step, setStep] = useState(0);
  const [printed, setPrinted] = useState(false);
  const [error, setError] = useState('');

  const stepTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const printTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentRef = useRef<{ order: OrderRow; text: string } | null>(null);
  const phaseRef = useRef<ReceiptPrintPhase>('idle');

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const clearTimers = useCallback(() => {
    stepTimersRef.current.forEach((t) => clearTimeout(t));
    stepTimersRef.current = [];
    if (printTimeoutRef.current) clearTimeout(printTimeoutRef.current);
    printTimeoutRef.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const runSteps = useCallback(
    (onDone: () => void) => {
      clearTimers();
      let i = 0;
      const tick = () => {
        if (i >= STEP_DELAYS.length) {
          onDone();
          return;
        }
        setStep(i);
        const wait = STEP_DELAYS[i];
        i += 1;
        const t = setTimeout(tick, wait);
        stepTimersRef.current.push(t);
      };
      tick();
    },
    [clearTimers],
  );

  const runPrint = useCallback(
    async (order: OrderRow, text: string) => {
      if (!printerService.status().connected) {
        setPrinted(false);
        setError('No Bluetooth printer found. Connect one in Settings, then retry.');
        setPhase('failed');
        return;
      }
      clearTimers();
      setPrinted(false);
      setError('');
      setStep(0);
      setPhase('printing');

      let resolveSteps = () => {};
      const stepsDone = new Promise<void>((res) => {
        resolveSteps = res;
      });
      runSteps(resolveSteps);

      const r = await Promise.race([
        printerService.printReceipt(order.id, text),
        new Promise<never>((_, reject) => {
          printTimeoutRef.current = setTimeout(() => reject(new Error('PRINT_TIMEOUT')), PRINT_TIMEOUT_MS);
        }),
      ]).catch(() => ({ ok: false, error: 'PRINT_FAILED' }));

      await stepsDone;

      if (r.ok) {
        setPrinted(true);
        setPhase('done');
      } else {
        setError(
          r.error === 'PRINTER_NOT_FOUND'
            ? 'No Bluetooth printer found. Connect one in Settings, then retry.'
            : 'The receipt could not be sent to the printer. Check that it is turned on and nearby.',
        );
        setPhase('failed');
      }
    },
    [clearTimers, runSteps],
  );

  const start = useCallback(
    (order: OrderRow, text: string) => {
      if (phaseRef.current === 'printing' || phaseRef.current === 'done') return;
      currentRef.current = { order, text };
      void runPrint(order, text);
    },
    [runPrint],
  );

  const retry = useCallback(() => {
    const c = currentRef.current;
    if (!c) return;
    void runPrint(c.order, c.text);
  }, [runPrint]);

  const close = useCallback(() => {
    clearTimers();
    setPhase('idle');
    setStep(0);
    setPrinted(false);
    setError('');
  }, [clearTimers]);

  return { phase, step, printed, error, start, retry, close };
}