import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useIAP, ErrorCode } from 'react-native-iap';

const PRODUCT_IDS = ['boost_1', 'boost_2', 'boost_3', 'p2'];

export default function GetBoost() {
  const {
    connected,
    products,
    requestPurchase,
    fetchProducts,
    finishTransaction,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      await finishTransaction({ purchase, isConsumable: true });

      Alert.alert('Success', 'Purchase successful!');
      setSelectedProduct(null);
    },

    onPurchaseError: (error) => {
      if (error.code !== ErrorCode.UserCancelled) {
        Alert.alert('Error', error.message);
      }
    },
  });

  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (connected) {
      fetchProducts({
        skus: PRODUCT_IDS,
        type: 'in-app',
      }).finally(() => setLoading(false));
    }
  }, [connected, fetchProducts]);

  const boostProducts = products.filter(
    (item) => (item.productId || item.id) !== 'p2'
  );

  const goldProduct = products.find(
    (item) => (item.productId || item.id) === 'p2'
  );

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
  };

  const handleBuy = () => {
    if (!selectedProduct || !connected) {
      Alert.alert('Error', 'Please select a plan first');
      return;
    }

    const productId =
      selectedProduct.productId || selectedProduct.id;

    requestPurchase({
      request: {
        google: {
          skus: [productId],
        },
        apple: {
          sku: productId,
        },
      },
      type: 'in-app',
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#f8f8f8"
      />

      {/* BOOST CARD */}
      <View style={styles.hargaCard}>
        <Text style={styles.card2Title}>
          Be a top profile in your area and get more likes
        </Text>

        <View style={styles.verticalProductList}>
          {boostProducts.map((item) => {
            const isSelected =
              selectedProduct &&
              (selectedProduct.productId ||
                selectedProduct.id) ===
                (item.productId || item.id);

            return (
              <TouchableOpacity
                key={item.productId || item.id}
                style={[
                  styles.priceCardVertical,
                  isSelected && styles.selectedCard,
                ]}
                onPress={() => handleSelectProduct(item)}
                activeOpacity={0.8}
              >
                <View style={styles.priceInfoVertical}>
                  <Text style={styles.planNameVertical}>
                    {item.displayName ||
                      item.title ||
                      item.productId}
                  </Text>

                  <Text style={styles.priceValueVertical}>
                    {item.displayPrice}
                  </Text>

                  <Text style={styles.smallDescription}>
                    Boost your profile visibility instantly
                  </Text>

                  {isSelected && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>
                        ✓ Selected
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* GOLD OFFER CARD (P2) */}
      {goldProduct && (
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.goldCard,
            selectedProduct &&
              (selectedProduct.productId ||
                selectedProduct.id) ===
                (goldProduct.productId || goldProduct.id) &&
              styles.goldCardSelected,
          ]}
          onPress={() => handleSelectProduct(goldProduct)}
        >
          <View style={styles.goldBadge}>
            <Text style={styles.goldBadgeText}>
              GOLD OFFER
            </Text>
          </View>

          <Text style={styles.goldTitle}>
            {goldProduct.displayName ||
              goldProduct.title ||
              'Gold Membership'}
          </Text>

          <Text style={styles.goldPrice}>
            {goldProduct.displayPrice}
          </Text>

        </TouchableOpacity>
      )}

      {/* BUY BUTTON */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.buyButton,
            !selectedProduct &&
              styles.buyButtonDisabled,
          ]}
          onPress={handleBuy}
          activeOpacity={0.8}
          disabled={!selectedProduct}
        >
          <Text style={styles.buyButtonText}>
            {selectedProduct
              ? `Buy ${
                  selectedProduct.displayName ||
                  selectedProduct.title ||
                  selectedProduct.productId
                } - ${selectedProduct.displayPrice}`
              : 'Select a plan to continue'}
          </Text>
        </TouchableOpacity>
      </View>

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
  },

  hargaCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  card2Title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },

  verticalProductList: {
    flexDirection: 'column',
  },

  priceCardVertical: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#eee',
  },

  selectedCard: {
    borderColor: '#e253ed',
    shadowColor: '#e253ed',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  priceInfoVertical: {
    position: 'relative',
  },

  planNameVertical: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },

  priceValueVertical: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
    marginBottom: 6,
  },

  smallDescription: {
    fontSize: 13,
    color: '#666',
  },

  selectedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#e253ed',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  selectedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },

  goldCard: {
    backgroundColor: '#464646',
    borderRadius: 24,
    padding: 22,
    marginHorizontal: 16,
    marginTop: 4,
  },

  goldCardSelected: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },

  goldBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 14,
  },

  goldBadgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '800',
  },

  goldTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },

  goldPrice: {
    color: '#FFD700',
    fontSize: 34,
    fontWeight: '900',
    marginBottom: 10,
  },

  goldSelected: {
    marginTop: 16,
    backgroundColor: '#FFD700',
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },

  goldSelectedText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },

  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  buyButton: {
    backgroundColor: '#e239ee',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buyButtonDisabled: {
    backgroundColor: '#ccc',
  },

  buyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  bottomSpacer: {
    height: 30,
  },
});