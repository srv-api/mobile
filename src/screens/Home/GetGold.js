import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, Alert, StyleSheet, TouchableOpacity,
  ActivityIndicator, Dimensions, ScrollView, StatusBar
} from 'react-native';
import { useIAP, ErrorCode } from 'react-native-iap';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PRODUCT_IDS = ['gold_like_1','gl2','gl3'];

export default function GetGold() {
  const {
    connected,
    products,
    requestPurchase,
    fetchProducts,
    finishTransaction,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      await finishTransaction({ purchase, isConsumable: true });
      Alert.alert('Success', 'Premium activated');
      setSelectedProduct(null); // Reset selection setelah sukses
    },
    onPurchaseError: (error) => {
      if (error.code !== ErrorCode.UserCancelled) {
        Alert.alert('Error', error.message);
      }
    },
  });

  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null); // State untuk produk yang dipilih

  useEffect(() => {
    if (connected) {
      fetchProducts({ skus: PRODUCT_IDS, type: 'in-app' })
        .finally(() => setLoading(false));
    }
  }, [connected, fetchProducts]);

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
  };

  const handleBuy = () => {
    if (!selectedProduct || !connected) {
      Alert.alert('Error', 'Please select a plan first');
      return;
    }
    
    const productId = selectedProduct.id || selectedProduct.productId;
    requestPurchase({
      request: {
        google: { skus: [productId] },
        apple: { sku: productId },
      },
      type: 'in-app',
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f8f8" />

      {/* CARD HARGA - SCROLL HORIZONTAL */}
      <View style={styles.hargaCard}>
        <Text style={styles.card2Title}>See Who Like You and Match Instantly</Text>
        
        {/* ScrollView HORIZONTAL untuk produk */}
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={true}
          pagingEnabled={false}
          decelerationRate="fast"
          style={styles.horizontalScrollArea}
          contentContainerStyle={styles.horizontalContentContainer}
        >
          {products.map((item, idx) => {
            const isSelected = selectedProduct && 
              (selectedProduct.id || selectedProduct.productId) === (item.id || item.productId);
            
            return (
              <TouchableOpacity
                key={item.id || item.productId}
                style={[
                  styles.priceCardHorizontal,
                  isSelected && styles.selectedCard, // Style khusus jika dipilih
                  idx === products.length - 1 && styles.lastCard
                ]}
                onPress={() => handleSelectProduct(item)}
                activeOpacity={0.7}
              >
                <View style={styles.priceInfoHorizontal}>
                  <Text style={styles.planNameHorizontal}>
                    {item.displayName} 
                  </Text>
                  <Text style={styles.priceValueHorizontal}>
                    {item.displayPrice}
                  </Text>
                </View>
                {/* Indikator terpilih */}
                {isSelected && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>✓ Selected</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* CARD DESKRIPSI */}
      <View style={styles.deskripsiCard}>
        <Text style={styles.card1Title}>Get Star Like</Text>
        <Text style={styles.card1Subtitle}>Premium Membership</Text>
        
        <View style={styles.divider} />
        
        <View style={styles.featureList}>
          <View style={styles.featureRow}>
            <Text style={styles.bulet}>●</Text>
            <Text style={styles.featureText}>Unlimited access to all premium content</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.bulet}>●</Text>
            <Text style={styles.featureText}>No ads, seamless experience</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.bulet}>●</Text>
            <Text style={styles.featureText}>Priority customer support 24/7</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.bulet}>●</Text>
            <Text style={styles.featureText}>Exclusive monthly content drops</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.bulet}>●</Text>
            <Text style={styles.featureText}>Sync across all your devices</Text>
          </View>
        </View>
        
        <Text style={styles.card1Footer}>Cancel anytime • No commitment</Text>
      </View>

      {/* BUTTON BUY - Muncul di bawah card deskripsi */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[
            styles.buyButton,
            !selectedProduct && styles.buyButtonDisabled // Jika belum pilih, button disable
          ]}
          onPress={handleBuy}
          activeOpacity={0.8}
          disabled={!selectedProduct}
        >
          <Text style={styles.buyButtonText}>
            {selectedProduct 
              ? `Buy ${selectedProduct.displayName} - ${selectedProduct.displayPrice}`
              : 'Select a plan to continue'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Spacer untuk padding bawah */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  
  hargaCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    margin: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  card2Title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    textAlign: 'left',
    marginBottom: 16,
  },
  
  // SCROLL HORIZONTAL
  horizontalScrollArea: {
    flexDirection: 'row',
  },
  horizontalContentContainer: {
    paddingHorizontal: 4,
  },
  priceCardHorizontal: {
    width: screenWidth * 0.7,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#eee',
  },
  selectedCard: {
    borderColor: '#ecd902',
    backgroundColor: '#fff',
    shadowColor: '#ecd902',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lastCard: {
    marginRight: 0,
  },
  priceInfoHorizontal: {
    marginBottom: 12,
  },
  planNameHorizontal: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 10,
  },
  priceValueHorizontal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    marginBottom: 4,
  },
  debugTextHorizontal: {
    fontSize: 11,
    color: '#999',
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  
  // CARD DESKRIPSI
  deskripsiCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    margin: 16,
    marginTop: 0,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  card1Title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: '#000',
    letterSpacing: -0.5,
  },
  card1Subtitle: {
    fontSize: 13,
    textAlign: 'center',
    color: '#888',
    marginTop: 4,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  featureList: {
    marginTop: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bulet: {
    fontSize: 12,
    color: '#000',
    marginRight: 10,
    fontWeight: '600',
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  card1Footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#aaa',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },

  // BUTTON BUY
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  buyButton: {
    backgroundColor: '#e7d300',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buyButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  buyButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 30,
  },
});