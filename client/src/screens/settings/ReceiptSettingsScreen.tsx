import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Button, Card, Input, useToast, SectionTitle } from '@/components/ui';
import { useSettingsStore } from '@/stores/settingsStore';
import { toUserMessage } from '@/utils/errors';

export function ReceiptSettingsScreen() {
  const storeSettings = useSettingsStore((s) => s.storeSettings);
  const saveStore = useSettingsStore((s) => s.saveStore);
  const toast = useToast();

  const [storeName, setStoreName] = useState(storeSettings.storeName);
  const [ownerName, setOwnerName] = useState(storeSettings.ownerName);
  const [address, setAddress] = useState(storeSettings.address);
  const [contact, setContact] = useState(storeSettings.contact);
  const [footer, setFooter] = useState(storeSettings.footer);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!storeName.trim()) {
      toast.error('Store name is required');
      return;
    }
    setSaving(true);
    try {
      const current = useSettingsStore.getState().storeSettings;
      saveStore({
        ...current,
        storeName: storeName.trim(),
        ownerName: ownerName.trim(),
        address: address.trim(),
        contact: contact.trim(),
        footer: footer.trim(),
      });
      toast.success('Store details updated');
    } catch (e) {
      toast.error(toUserMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-4 py-4">
        <Card>
          <Input label="Store name" value={storeName} onChangeText={setStoreName} />
          <View className="h-3" />
          <Input label="Owner name" value={ownerName} onChangeText={setOwnerName} />
          <View className="h-3" />
          <Input label="Store address" value={address} onChangeText={setAddress} multiline />
          <View className="h-3" />
          <Input label="Contact number" value={contact} onChangeText={setContact} keyboardType="phone-pad" />
          <View className="h-3" />
          <Input label="Receipt footer" value={footer} onChangeText={setFooter} multiline />
        </Card>

        <View className="h-4" />
        <Button label="Save" onPress={onSave} loading={saving} fullWidth size="lg" />

        <View className="h-4" />
        <SectionTitle>Preview</SectionTitle>
        <Card>
          <Text className="text-base font-bold text-foreground text-center">{storeName || 'STORE NAME'}</Text>
          {ownerName ? (
            <Text className="text-xs text-foreground text-center mt-1">{ownerName}</Text>
          ) : null}
          <Text className="text-xs text-muted-foreground text-center mt-1">{address}</Text>
          <Text className="text-xs text-muted-foreground text-center">{contact}</Text>
          <View className="h-2" />
          <Text className="text-sm text-foreground text-center italic">{footer}</Text>
        </Card>
      </View>
    </ScrollView>
  );
}
