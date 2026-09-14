import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Switch } from 'react-native';
import { Bluetooth, RefreshCw, Plug, Unplug, Printer as PrinterIcon, Info } from 'lucide-react-native';
import { Button, Card, SectionTitle, useToast, Badge } from '@/components/ui';
import { printerService, type PrinterDevice } from '@/services/printerService';
import { useSettingsStore } from '@/stores/settingsStore';
import { toUserMessage } from '@/utils/errors';

export function PrinterSettingsScreen() {
  const toast = useToast();
  const autoPrint = useSettingsStore((s) => s.autoPrint);
  const setAutoPrint = useSettingsStore((s) => s.setAutoPrint);
  const setPrinter = useSettingsStore((s) => s.setPrinter);
  const connectedMac = useSettingsStore((s) => s.connectedPrinterMac);

  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<PrinterDevice[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = printerService.status();
  const nativeAvailable = printerService.isAvailable();

  const onScan = async () => {
    setError(null);
    if (!nativeAvailable) return;
    setScanning(true);
    try {
      const list = await printerService.scan();
      setDevices(list);
      if (list.length === 0) {
        toast.error('No Bluetooth printer found');
      }
    } catch (e) {
      setError(toUserMessage(e));
      toast.error(toUserMessage(e));
    } finally {
      setScanning(false);
    }
  };

  const onConnect = async (d: PrinterDevice) => {
    setConnecting(d.macAddress);
    setError(null);
    try {
      const ok = await printerService.connect(d.macAddress);
      if (ok) {
        setPrinter(d.name, d.macAddress);
        toast.success('Printer connected');
      } else {
        setError('Unable to connect to printer');
        toast.error('Unable to connect to printer');
      }
    } catch (e) {
      setError(toUserMessage(e));
      toast.error(toUserMessage(e));
    } finally {
      setConnecting(null);
    }
  };

  const onDisconnect = async () => {
    await printerService.disconnect();
    setPrinter('', '');
    toast.info('Printer disconnected');
  };

  const onTestPrint = async () => {
    setTesting(true);
    try {
      const r = await printerService.testPrint();
      if (r.ok) toast.success('Test print sent');
      else toast.error('Transaction saved, but receipt printing failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-4 py-4">
        <Card>
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 rounded-xl bg-primary/10 items-center justify-center">
              <Bluetooth size={22} color="#B45309" />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-muted-foreground">Connected printer</Text>
              <Text className="text-base font-semibold text-foreground">
                {status.connected ? status.name : 'Not connected'}
              </Text>
              {status.connected ? (
                <Text className="text-xs text-muted-foreground mt-0.5">{status.macAddress}</Text>
              ) : null}
            </View>
            {status.connected ? <Badge label="Connected" variant="success" /> : <Badge label="Idle" variant="muted" />}
          </View>

          {status.connected ? (
            <View className="flex-row gap-2 mt-4">
              <Button
                label={testing ? 'Printing…' : 'Test print'}
                onPress={onTestPrint}
                loading={testing}
                variant="outline"
                className="flex-1"
                leftIcon={<PrinterIcon size={16} color="#0F172A" />}
              />
              <Button
                label="Disconnect"
                onPress={onDisconnect}
                variant="destructive"
                className="flex-1"
                leftIcon={<Unplug size={16} color="#FFFFFF" />}
              />
            </View>
          ) : null}
        </Card>

        {!nativeAvailable ? (
          <>
            <View className="h-4" />
            <Card className="bg-amber-500/10 border-amber-500/40">
              <View className="flex-row gap-3">
                <View className="mt-0.5">
                  <Info size={18} color="#B45309" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    Bluetooth printing unavailable
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-1 leading-5">
                    You are running this app in Expo Go, which does not include the native
                    Bluetooth module used for scanning and printing receipts. Build a development
                    build and run it on a physical device:
                  </Text>
                  <View className="mt-2 rounded-lg bg-background/80 border border-border px-3 py-2">
                    <Text className="text-xs text-foreground">npx expo run:android</Text>
                    <Text className="text-xs text-foreground mt-1">npx expo run:ios</Text>
                  </View>
                  <Text className="text-xs text-muted-foreground mt-2 leading-5">
                    Transactions will still be saved normally even without a printer connected.
                  </Text>
                </View>
              </View>
            </Card>
          </>
        ) : null}

        <View className="h-4" />

        <SectionTitle>Available printers</SectionTitle>
        <Button
          label={scanning ? 'Scanning…' : 'Scan for printers'}
          onPress={onScan}
          loading={scanning}
          disabled={!nativeAvailable}
          variant="outline"
          leftIcon={<RefreshCw size={16} color="#0F172A" />}
          fullWidth
        />

        {error ? <Text className="text-xs text-destructive mt-3">{error}</Text> : null}

        <View className="h-3" />
        {scanning ? (
          <View className="py-6 items-center">
            <ActivityIndicator color="#B45309" />
            <Text className="text-xs text-muted-foreground mt-2">Looking for nearby devices…</Text>
          </View>
        ) : devices.length === 0 ? (
          <View className="py-6 items-center">
            <Text className="text-sm text-muted-foreground">
              {nativeAvailable
                ? 'No devices yet. Tap “Scan for printers”.'
                : 'Scanning is only available in a development build.'}
            </Text>
          </View>
        ) : (
          devices.map((d) => (
            <View key={d.macAddress} className="bg-card border border-border rounded-2xl p-3 mb-2 flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                  {d.name}
                </Text>
                <Text className="text-xs text-muted-foreground mt-0.5">{d.macAddress}</Text>
                {connectedMac === d.macAddress ? <Badge label="Connected" variant="success" className="mt-1" /> : null}
              </View>
              <Button
                label="Connect"
                onPress={() => onConnect(d)}
                loading={connecting === d.macAddress}
                size="sm"
                leftIcon={<Plug size={14} color="#FFFFFF" />}
              />
            </View>
          ))
        )}

        <View className="h-4" />

        <Card>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-2">
              <Text className="text-sm font-semibold text-foreground">Auto-print receipt</Text>
              <Text className="text-xs text-muted-foreground mt-0.5">
                Automatically print after every successful checkout.
              </Text>
            </View>
            <Switch
              value={autoPrint}
              onValueChange={(v) => {
                setAutoPrint(v);
                toast.success(v ? 'Auto-print enabled' : 'Auto-print disabled');
              }}
              trackColor={{ false: '#E5E7EB', true: '#B45309' }}
            />
          </View>
        </Card>

        <Text className="text-xs text-muted-foreground text-center mt-4 px-4">
          If printing fails, the transaction is still saved. You can reprint from Orders.
        </Text>
      </View>
    </ScrollView>
  );
}
