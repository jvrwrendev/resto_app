import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ShoppingCart, CreditCard, ReceiptText, LayoutDashboard, ArrowRight } from 'lucide-react-native';
import { Button, Card } from '@/components/ui';
import { APP_NAME } from '@/constants';
import type { OnboardingStackParamList } from '@/navigation/types';

const STEPS = [
  {
    icon: ShoppingCart,
    title: 'Add items to the cart',
    description: 'Browse your product catalog and tap items to build an order in seconds.',
  },
  {
    icon: CreditCard,
    title: 'Check out and pay',
    description: 'Enter the cash received and the app calculates the change automatically.',
  },
  {
    icon: ReceiptText,
    title: 'Print the receipt',
    description: 'Send a receipt to your Bluetooth thermal printer after every sale.',
  },
  {
    icon: LayoutDashboard,
    title: 'Track and manage',
    description: 'Monitor daily sales, review orders, and keep your inventory in check.',
  },
];

export function OnboardingTutorialScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-8">
          <View className="h-16 w-16 rounded-2xl bg-primary items-center justify-center mb-4">
            <Text className="text-white text-2xl font-bold">BBQ</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground text-center">Welcome to {APP_NAME}</Text>
          <Text className="text-sm text-muted-foreground mt-1.5 text-center max-w-sm">
            Your complete point-of-sale for everyday BBQ. Here's how to use the app in four simple steps.
          </Text>
        </View>

        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card key={step.title} className="mb-4 flex-row items-start p-4">
              <View className="h-11 w-11 rounded-xl bg-primary/10 items-center justify-center mr-3">
                <Icon size={22} color="#B45309" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-semibold text-primary mb-0.5">Step {index + 1}</Text>
                <Text className="text-base font-semibold text-foreground">{step.title}</Text>
                <Text className="text-sm text-muted-foreground mt-1 leading-5">{step.description}</Text>
              </View>
            </Card>
          );
        })}

        <View className="mt-4">
          <Button
            label="Get Started"
            onPress={() => navigation.navigate('OnboardingSetup')}
            fullWidth
            size="lg"
            rightIcon={<ArrowRight size={20} color="#FFFFFF" />}
          />
        </View>

        <Text className="text-xs text-muted-foreground text-center mt-6 px-4">
          You can adjust these details later anytime from Settings.
        </Text>
      </ScrollView>
    </View>
  );
}