import React from 'react';
import { Pressable, View, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Settings as SettingsIcon,
} from 'lucide-react-native';
import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { PosScreen } from '@/screens/pos/PosScreen';
import { OrdersScreen } from '@/screens/orders/OrdersScreen';
import { InventoryScreen } from '@/screens/inventory/InventoryScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Adjusted height dimensions to 100px
const TAB_BAR_HEIGHT = 80;
const FAB_SIZE = 64;
const FAB_LIFT = 28;

function PosRaisedButton(props: BottomTabBarButtonProps) {
  const { onPress, accessibilityRole, accessibilityState, testID, ...rest } = props;
  return (
    <Pressable
      {...rest}
      onPress={onPress}
      testID={testID}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      className="flex-1 items-center justify-center active:opacity-80"
      hitSlop={{ top: FAB_LIFT + FAB_SIZE / 2 + 8, bottom: 4, left: 4, right: 4 }}
    >
      <View className="items-center justify-center -top-3 pointer-events-none">
        <View
          className="bg-amber-600 items-center justify-center rounded-full border-4 border-white active:bg-amber-700"
          style={{
            width: FAB_SIZE,
            height: FAB_SIZE,
            transform: [{ translateY: -FAB_LIFT }],
            ...(Platform.OS === 'android'
              ? { elevation: 8 }
              : {
                  shadowColor: '#B45309',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 10,
                }),
          }}
        >
          <ShoppingCart size={28} color="#FFFFFF" />
        </View>
        <Text className="text-[11px] font-bold text-amber-700 -mt-4">
          POS
        </Text>
      </View>
    </Pressable>
  );
}

export function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 10);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: '#B45309',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          height: TAB_BAR_HEIGHT,
          borderRadius: 36,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          paddingTop: 12,
          paddingBottom: 12,
          ...(Platform.OS === 'android'
            ? { elevation: 12 }
            : {
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.12,
                shadowRadius: 18,
              }),
        },
        tabBarLabel: ({ color, focused }) => {
          if (route.name === 'POS') return null;
          return (
            <Text
              className={`text-[11px] mt-1 tracking-tight ${
                focused ? 'font-bold text-amber-700' : 'font-medium text-slate-500'
              }`}
            >
              {route.name}
            </Text>
          );
        },
        tabBarIcon: ({ focused }) => {
          if (route.name === 'POS') return null;
          const color = focused ? '#B45309' : '#64748B';
          const size = 24;
          const icons: Record<Exclude<keyof MainTabParamList, 'POS'>, React.ReactNode> = {
            Dashboard: <LayoutDashboard size={size} color={color} />,
            Orders: <Receipt size={size} color={color} />,
            Inventory: <Package size={size} color={color} />,
            Settings: <SettingsIcon size={size} color={color} />,
          };
          return <View className="items-center justify-center mt-1">{icons[route.name]}</View>;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen
        name="POS"
        component={PosScreen}
        options={{
          tabBarButton: (props) => <PosRaisedButton {...props} />,
        }}
      />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}