import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';
import { OrderDetailsScreen } from '@/screens/orders/OrderDetailsScreen';
import { ProductEditScreen } from '@/screens/inventory/ProductEditScreen';
import { AddStockScreen } from '@/screens/inventory/AddStockScreen';
import { CheckoutScreen } from '@/screens/pos/CheckoutScreen';
import { ReceiptScreen } from '@/screens/pos/ReceiptScreen';
import { PrinterSettingsScreen } from '@/screens/settings/PrinterSettingsScreen';
import { ReceiptSettingsScreen } from '@/screens/settings/ReceiptSettingsScreen';
import { ApplicationInfoScreen } from '@/screens/settings/ApplicationInfoScreen';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FAFAF9' },
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{ title: 'Order details' }}
      />
      <Stack.Screen
        name="ProductEdit"
        component={ProductEditScreen}
        options={{ title: 'Product' }}
      />
      <Stack.Screen
        name="AddStock"
        component={AddStockScreen}
        options={{ title: 'Add stock' }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: 'Checkout' }}
      />
      <Stack.Screen
        name="Receipt"
        component={ReceiptScreen}
        options={{ title: 'Receipt', headerBackTitleVisible: false }}
      />
      <Stack.Screen
        name="PrinterSettings"
        component={PrinterSettingsScreen}
        options={{ title: 'Printer settings' }}
      />
      <Stack.Screen
        name="ReceiptSettings"
        component={ReceiptSettingsScreen}
        options={{ title: 'Store & owner' }}
      />
      <Stack.Screen
        name="ApplicationInfo"
        component={ApplicationInfoScreen}
        options={{ title: 'Application' }}
      />
    </Stack.Navigator>
  );
}
