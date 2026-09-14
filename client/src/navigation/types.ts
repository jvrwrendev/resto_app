import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Dashboard: undefined;
  POS: undefined;
  Orders: undefined;
  Inventory: undefined;
  Settings: undefined;
};

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  OrderDetails: { orderId: number };
  ProductEdit: { productId?: number };
  AddStock: { productId: number };
  Checkout: undefined;
  Receipt: { orderId: number };
  PrinterSettings: undefined;
  ReceiptSettings: undefined;
  ApplicationInfo: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type OnboardingStackParamList = {
  OnboardingTutorial: undefined;
  OnboardingSetup: undefined;
};
