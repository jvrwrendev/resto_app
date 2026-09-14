import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Camera, X } from 'lucide-react-native';
import { Button, Card, Input, useToast, cn } from '@/components/ui';
import { findProductById, createProduct, updateProduct, type Product } from '@/database/repositories/productRepository';
import { listCategories, type Category } from '@/database/repositories/categoryRepository';
import { useProductStore } from '@/stores/productStore';
import { toUserMessage } from '@/utils/errors';
import type { AppStackParamList } from '@/navigation/types';

export function ProductEditScreen() {
  const route = useRoute<RouteProp<AppStackParamList, 'ProductEdit'>>();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const productId = route.params?.productId;
  const load = useProductStore((s) => s.loadAdmin);

  const [categories, setCategories] = useState<Category[]>([]);
  const [existing, setExisting] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [threshold, setThreshold] = useState('5');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const cats = listCategories();
    setCategories(cats);
    if (productId) {
      const p = findProductById(productId);
      if (p) {
        setExisting(p);
        setName(p.name);
        setPrice(String(p.price));
        setStock(String(p.current_stock));
        setThreshold(String(p.low_stock_threshold));
        setCategoryId(p.category_id);
        setImageUri(p.image_uri ?? null);
      }
    } else {
      setCategoryId(cats[0]?.id ?? null);
    }
  }, [productId]);

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permission required',
          'Allow access to your photos to add a product image.',
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      toast.error(toUserMessage(e));
    }
  };

  const takePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission required', 'Allow camera access to take a product photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      toast.error(toUserMessage(e));
    }
  };

  const showImageOptions = () => {
    Alert.alert('Product image', 'Choose a source', [
      { text: 'Take photo', onPress: takePhoto },
      { text: 'Choose from library', onPress: pickImage },
      ...(imageUri ? [{ text: 'Remove', style: 'destructive' as const, onPress: () => setImageUri(null) }] : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const onSave = async () => {
    if (!name.trim() || !categoryId) {
      toast.error('Name and category are required');
      return;
    }
    const p = parseFloat(price);
    if (!Number.isFinite(p) || p < 0) {
      toast.error('Enter a valid price');
      return;
    }
    const t = parseInt(threshold, 10);
    if (!Number.isFinite(t) || t < 0) {
      toast.error('Enter a valid threshold');
      return;
    }
    setSubmitting(true);
    try {
      if (existing) {
        updateProduct(existing.id, {
          name: name.trim(),
          price: p,
          category_id: categoryId,
          low_stock_threshold: t,
          image_uri: imageUri,
        });
      } else {
        const initialStock = parseInt(stock, 10);
        createProduct({
          name: name.trim(),
          price: p,
          category_id: categoryId,
          stock: Number.isFinite(initialStock) ? initialStock : 0,
          threshold: t,
          image_uri: imageUri,
        });
      }
      load();
      toast.success(existing ? 'Product updated' : 'Product created');
      navigation.goBack();
    } catch (e) {
      toast.error(toUserMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-4 py-4">
        <Card>
          <Pressable
            onPress={showImageOptions}
            className="h-40 rounded-xl border-2 border-dashed border-border bg-muted/40 items-center justify-center overflow-hidden mb-1"
          >
            {imageUri ? (
              <>
                <Image source={{ uri: imageUri }} className="w-full h-full" resizeMode="cover" />
                <Pressable
                  onPress={() => setImageUri(null)}
                  hitSlop={8}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 items-center justify-center"
                >
                  <X size={16} color="#FFFFFF" />
                </Pressable>
              </>
            ) : (
              <View className="items-center">
                <Camera size={28} color="#64748B" />
                <Text className="text-sm font-medium text-muted-foreground mt-2">
                  Add product image
                </Text>
                <Text className="text-xs text-muted-foreground mt-0.5">
                  Tap to choose photo or take one
                </Text>
              </View>
            )}
          </Pressable>

          <View className="h-4" />
          <Input label="Product name" value={name} onChangeText={setName} placeholder="e.g. Pork BBQ" />
          <View className="h-3" />
          <Input
            label="Price (PHP)"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
          {!existing ? (
            <>
              <View className="h-3" />
              <Input
                label="Initial stock"
                value={stock}
                onChangeText={setStock}
                keyboardType="number-pad"
                placeholder="0"
              />
            </>
          ) : null}
          <View className="h-3" />
          <Input
            label="Low stock threshold"
            value={threshold}
            onChangeText={setThreshold}
            keyboardType="number-pad"
            placeholder="5"
          />

          <View className="h-4" />
          <Text className="text-sm font-medium text-foreground mb-2">Category</Text>
          <View className="flex-row flex-wrap gap-2">
            {categories.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setCategoryId(c.id)}
                className={cn(
                  'h-9 px-4 items-center justify-center rounded-full border',
                  categoryId === c.id ? 'bg-primary border-primary' : 'bg-card border-border',
                )}
              >
                <Text
                  className={cn(
                    'text-sm font-medium',
                    categoryId === c.id ? 'text-primary-foreground' : 'text-foreground',
                  )}
                >
                  {c.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <View className="h-4" />
        <Button
          label={existing ? 'Save changes' : 'Create product'}
          onPress={onSave}
          loading={submitting}
          fullWidth
          size="lg"
        />
      </View>
    </ScrollView>
  );
}
