import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, ShoppingCart, Receipt, Package, Settings as SettingsIcon } from 'lucide-react-native';
import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { PosScreen } from '@/screens/pos/PosScreen';
import { OrdersScreen } from '@/screens/orders/OrdersScreen';
import { InventoryScreen } from '@/screens/inventory/InventoryScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { cn } from '@/theme/cn';
import type { MainTabParamList } from './types';
import { Text, View } from 'react-native';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#B45309',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          backgroundColor: '#FFFFFF',
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabel: ({ color, focused }) => (
          <Text
            className={cn('text-[10px] mt-1', focused ? 'font-semibold' : 'font-medium')}
            style={{ color }}
          >
            {route.name}
          </Text>
        ),
        tabBarIcon: ({ color, size, focused }) => {
          const s = focused ? size + 1 : size;
          const icons: Record<keyof MainTabParamList, React.ReactNode> = {
            Dashboard: <LayoutDashboard size={s} color={color} />,
            POS: <ShoppingCart size={s} color={color} />,
            Orders: <Receipt size={s} color={color} />,
            Inventory: <Package size={s} color={color} />,
            Settings: <SettingsIcon size={s} color={color} />,
          };
          return <View>{icons[route.name]}</View>;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen
        name="POS"
        component={PosScreen}
        options={{
          tabBarBadge: undefined,
        }}
      />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
