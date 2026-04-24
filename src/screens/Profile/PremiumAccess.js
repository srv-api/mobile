import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  FlatList,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as RNIap from 'react-native-iap';
import Footer from '../components/Footer';

const { width, height } = Dimensions.get('window');
const USE_MOCK = true;
const CARD_WIDTH = width - 64;

const skus = ['premium_1_month', 'premium_3_month', 'premium_12_month'];

const mockProducts = [
  {
    productId: 'premium_1_month',
    title: 'Monthly',
    duration: '1 Bulan',
    price: 'Rp 49.000',
    originalPrice: 'Rp 99.000',
    save: '50%',
    pricePerMonth: 'Rp 49.000/bulan',
    color: '#FF6B6B',
    benefits: [
      'Unlimited Swipes',
      'See Who Likes You',
      'Rewind Last Swipe',
      '1 Boost / Month',
      'No Ads',
    ],
  },
  {
    productId: 'premium_3_month',
    title: 'Quarterly',
    duration: '3 Bulan',
    price: 'Rp 129.000',
    originalPrice: 'Rp 297.000',
    save: '56%',
    pricePerMonth: 'Rp 43.000/bulan',
    color: '#FFA500',
    popular: true,
    benefits: [
      'Unlimited Swipes',
      'See Who Likes You',
      'Rewind Last Swipe',
      '5 Boosts / Month',
      'No Ads',
      'Priority Likes',
    ],
  },
  {
    productId: 'premium_12_month',
    title: 'Yearly',
    duration: '12 Bulan',
    price: 'Rp 399.000',
    originalPrice: 'Rp 1.188.000',
    save: '66%',
    pricePerMonth: 'Rp 33.250/bulan',
    color: '#7C3AED',
    benefits: [
      'Unlimited Swipes',
      'See Who Likes You',
      'Rewind Last Swipe',
      'Unlimited Boosts',
      'No Ads',
      'Priority Likes',
      'VIP Badge',
    ],
  },
];

const PremiumAccess = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('premium_3_month');
  const flatListRef = useRef(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      setLoading(true);
      if (USE_MOCK) {
        setTimeout(() => {
          setProducts(mockProducts);
          setLoading(false);
        }, 500);
        return;
      }
      await RNIap.initConnection();
      const result = await RNIap.getSubscriptions({ skus });
      setProducts(result);
    } catch (err) {
      console.log('ERROR:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (sku) => {
    if (processing) return;
    try {
      setProcessing(true);
      if (USE_MOCK) {
        setTimeout(() => {
          setProcessing(false);
          Alert.alert('🎉 Success!', 'Welcome to Premium!', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        }, 1500);
        return;
      }
      await RNIap.requestSubscription({ sku });
    } catch (err) {
      console.log('ERROR:', err);
      setProcessing(false);
      Alert.alert('Error', err.message);
    }
  };

  const renderPlanCard = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => setSelectedPlan(item.productId)}
      style={[
        styles.card,
        selectedPlan === item.productId && styles.cardSelected,
        { borderTopColor: item.color }
      ]}
    >
      {item.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>⭐ POPULAR</Text>
        </View>
      )}
      
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.duration}>{item.duration}</Text>
      </View>
      
      <View style={styles.priceRow}>
        <Text style={styles.price}>{item.price}</Text>
        <Text style={styles.originalPrice}>{item.originalPrice}</Text>
      </View>
      
      <Text style={styles.perMonth}>{item.pricePerMonth}</Text>
      
      <View style={styles.saveBadge}>
        <Text style={styles.saveText}>Save {item.save}</Text>
      </View>
      
      <View style={styles.divider} />
      
      <Text style={styles.benefitsTitle}>What you'll get:</Text>
      {item.benefits.map((benefit, idx) => (
        <View key={idx} style={styles.benefitRow}>
          <Icon name="checkmark-circle" size={16} color="#4CAF50" />
          <Text style={styles.benefitText}>{benefit}</Text>
        </View>
      ))}
      
      {selectedPlan === item.productId && (
        <View style={styles.selectedIcon}>
          <Icon name="checkmark-circle" size={32} color="#FF3B6F" />
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#FF3B6F" />
      </SafeAreaView>
    );
  }

  const selectedProduct = products.find(p => p.productId === selectedPlan);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero */}
        <View style={styles.hero}></View>

        {/* Cards Section */}
        <View style={styles.cardsSection}>
          <FlatList
            ref={flatListRef}
            data={products}
            keyExtractor={(item) => item.productId}
            renderItem={renderPlanCard}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + 16}
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContent}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / (CARD_WIDTH + 16));
              if (products[index]) {
                setSelectedPlan(products[index].productId);
              }
            }}
          />

          {/* Dots */}
          <View style={styles.dots}>
            {products.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: selectedPlan === products[i].productId ? 20 : 6,
                    backgroundColor: selectedPlan === products[i].productId ? '#FF3B6F' : '#ddd',
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={[styles.buyButton, processing && styles.buyButtonDisabled]}
            onPress={() => handleBuy(selectedPlan)}
            disabled={processing}
          >
            <Text style={styles.buyButtonText}>
              {processing ? 'Processing...' : `Get ${selectedProduct?.title || ''} Premium`}
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          
        </View>
                <Footer navigation={navigation} active="profile" />

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
  },

  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  cardsSection: {
    marginBottom: 10,
  },
  carouselContent: {
    paddingHorizontal: 32,
    gap: 16,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 12,
    borderTopWidth: 4,
    borderTopColor: '#FF6B6B',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardSelected: {
    shadowColor: '#FF3B6F',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#FFA500',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  popularText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardHeader: {
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  duration: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 4,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  perMonth: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  saveBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  saveText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 16,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 13,
    color: '#555',
  },
  selectedIcon: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ddd',
  },
  ctaSection: {
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 5,
  },
  buyButton: {
    backgroundColor: '#FF3B6F',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 16,
  },
  buyButtonDisabled: {
    backgroundColor: '#ccc',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#999',
  },
});

export default PremiumAccess;