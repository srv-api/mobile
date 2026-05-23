import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, Alert, StyleSheet, TouchableOpacity, 
  FlatList, ActivityIndicator, Dimensions, 
  Animated, StatusBar, ScrollView 
} from 'react-native';
import { useIAP, ErrorCode } from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.82;
const CARD_HEIGHT = screenHeight * 0.62;

const PRODUCT_IDS = ['p1', 'p2', 'p3'];
const API_BASE_URL = 'http://103.150.227.223:2388';

// Debug Panel Component
const DebugPanel = ({ logs, visible, onClose }) => {
  if (!visible) return null;
  
  return (
    <View style={styles.debugOverlay}>
      <View style={styles.debugContainer}>
        <View style={styles.debugHeader}>
          <Text style={styles.debugTitle}>📱 Payment Debug Console</Text>
          <TouchableOpacity onPress={onClose} style={styles.debugClose}>
            <Text style={styles.debugCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.debugLogs} ref={scrollRef => {
          if (scrollRef) {
            setTimeout(() => scrollRef.scrollToEnd({ animated: true }), 100);
          }
        }}>
          {logs.map((log, index) => (
            <View key={index} style={[styles.logItem, styles[`log${log.type}`]]}>
              <Text style={styles.logTime}>{log.time}</Text>
              <Text style={styles.logMessage}>{log.message}</Text>
              {log.data && (
                <Text style={styles.logData}>
                  {typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : log.data}
                </Text>
              )}
            </View>
          ))}
          {logs.length === 0 && (
            <Text style={styles.noLogs}>Waiting for payment events...</Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default function Store({ navigation }) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [debugVisible, setDebugVisible] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Debug function
  const addDebugLog = (message, type = 'info', data = null) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    
    setDebugLogs(prev => [...prev, {
      id: Date.now() + Math.random(),
      time,
      message,
      type,
      data
    }]);
    
    console.log(`[${time}] [${type.toUpperCase()}] ${message}`, data || '');
  };

  // API Helper Functions
  const getAccessToken = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      return token;
    } catch (error) {
      addDebugLog('❌ Failed to get access token', 'error', error.message);
      return null;
    }
  };

  const refreshAccessToken = async () => {
    try {
      addDebugLog('🔄 Refreshing access token...', 'info');
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const data = await response.json();
      
      if (data.success) {
        await AsyncStorage.setItem('access_token', data.data.access_token);
        await AsyncStorage.setItem('refresh_token', data.data.refresh_token);
        addDebugLog('✅ Token refreshed successfully', 'success');
        return data.data.access_token;
      } else {
        throw new Error('Refresh failed');
      }
    } catch (error) {
      addDebugLog('❌ Failed to refresh token', 'error', error.message);
      // Navigate to login
      navigation.navigate('Login');
      return null;
    }
  };

  const apiRequest = async (endpoint, options = {}) => {
    try {
      let token = await getAccessToken();
      
      if (!token) {
        throw new Error('No access token');
      }

      const makeRequest = async (accessToken) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            ...options.headers,
          },
        });

        if (response.status === 401) {
          // Token expired, try to refresh
          const newToken = await refreshAccessToken();
          if (newToken) {
            // Retry with new token
            return makeRequest(newToken);
          }
          throw new Error('Unauthorized');
        }

        return response;
      };

      return await makeRequest(token);
    } catch (error) {
      addDebugLog('❌ API Request failed', 'error', error.message);
      throw error;
    }
  };

  const {
    connected,
    products,
    requestPurchase,
    fetchProducts,
    finishTransaction,
    currentPurchase,
    pendingTransactions,
    getAvailablePurchases,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      addDebugLog('✅ PURCHASE SUCCESS - Transaction completed', 'success', {
        transactionId: purchase.transactionId,
        productId: purchase.productId,
        purchaseToken: purchase.purchaseToken,
      });
      
      setIsProcessing(true);
      
      try {
        // Kirim ke backend untuk verifikasi
        addDebugLog('📤 Sending purchase to backend for verification...', 'info');
        
        const purchaseData = {
          transaction_id: purchase.transactionId,
          product_id: purchase.productId,
          purchase_token: purchase.purchaseToken,
          receipt_data: purchase.originalJson,
          signature: purchase.signature,
        };
        
        addDebugLog('📦 Purchase payload', 'debug', purchaseData);
        
        const response = await apiRequest('/merchant/purchase', {
          method: 'POST',
          body: JSON.stringify(purchaseData),
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          addDebugLog('🎉 Backend verification successful! Premium activated', 'success', result.data);
          
          // Finish transaction di mobile
          await finishTransaction({ purchase, isConsumable: true });
          addDebugLog('✅ Transaction finished successfully', 'success');
          
          Alert.alert(
            'Success', 
            'Premium activated successfully! You now have unlimited access.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } else {
          addDebugLog('❌ Backend verification failed', 'error', result.message);
          Alert.alert('Error', result.message || 'Failed to activate premium. Please contact support.');
        }
      } catch (error) {
        addDebugLog('❌ Error sending to backend', 'error', error.message);
        Alert.alert('Error', 'Network error. Please check your connection and try again.');
      } finally {
        setIsProcessing(false);
      }
    },
    onPurchaseError: (error) => {
      addDebugLog('❌ PURCHASE ERROR', 'error', {
        code: error.code,
        message: error.message
      });
      
      if (error.code !== ErrorCode.UserCancelled) {
        Alert.alert('Error', error.message);
      } else {
        addDebugLog('ℹ️ User cancelled purchase', 'info');
      }
      setIsProcessing(false);
    },
  });

  const [loading, setLoading] = useState(true);

  // Monitor koneksi IAP
  useEffect(() => {
    addDebugLog('🔌 IAP Service initializing...', 'info');
    addDebugLog(`📱 Connection status: ${connected ? 'Connected' : 'Disconnected'}`, connected ? 'success' : 'warning');
    
    if (connected) {
      addDebugLog('🔄 Fetching products from store...', 'info');
      fetchProducts({ skus: PRODUCT_IDS, type: 'in-app' })
        .then(() => {
          addDebugLog('✅ Products fetched successfully', 'success');
          setLoading(false);
        })
        .catch((error) => {
          addDebugLog('❌ Failed to fetch products', 'error', error.message);
          setLoading(false);
        });
    }
  }, [connected, fetchProducts]);

  // Monitor current purchase
  useEffect(() => {
    if (currentPurchase) {
      addDebugLog('🛒 Current purchase detected', 'info', {
        productId: currentPurchase.productId,
        transactionId: currentPurchase.transactionId
      });
    }
  }, [currentPurchase]);

  // Monitor pending transactions
  useEffect(() => {
    if (pendingTransactions && pendingTransactions.length > 0) {
      addDebugLog(`⏳ ${pendingTransactions.length} pending transaction(s)`, 'warning', pendingTransactions);
    }
  }, [pendingTransactions]);

  const handleBuy = async (productId) => {
    if (isProcessing) {
      addDebugLog('⏳ Purchase already in progress', 'warning');
      return;
    }
    
    addDebugLog(`🛍️ Purchase initiated for product: ${productId}`, 'info');
    
    if (!productId) {
      addDebugLog('❌ Invalid product ID', 'error');
      return;
    }
    
    if (!connected) {
      addDebugLog('❌ IAP not connected', 'error');
      Alert.alert('Error', 'Payment service not available');
      return;
    }
    
    addDebugLog('📤 Sending purchase request to Google Play...', 'info', {
      productId,
      type: 'in-app'
    });
    
    try {
      const request = {
        request: {
          google: { skus: [productId] },
          apple: { sku: productId },
        },
        type: 'in-app',
      };
      
      addDebugLog('🚀 RequestPurchase payload', 'debug', request);
      
      await requestPurchase(request);
      
      addDebugLog('⏳ Waiting for Google Play response...', 'info');
    } catch (error) {
      addDebugLog('💥 RequestPurchase failed', 'error', error.message);
    }
  };

  // Check existing purchases on mount
  useEffect(() => {
    const checkExistingPurchases = async () => {
      if (connected) {
        try {
          addDebugLog('🔍 Checking for existing purchases...', 'info');
          const purchases = await getAvailablePurchases();
          if (purchases && purchases.length > 0) {
            addDebugLog(`📦 Found ${purchases.length} existing purchase(s)`, 'warning', purchases);
          } else {
            addDebugLog('✅ No existing purchases found', 'info');
          }
        } catch (error) {
          addDebugLog('❌ Error checking existing purchases', 'error', error.message);
        }
      }
    };
    
    checkExistingPurchases();
  }, [connected, getAvailablePurchases]);

  const parseFeatures = (description) => {
    if (!description) return ['Premium access', 'No ads', 'Unlimited swipes'];
    let features = description.split(/\n|•|-/);
    features = features.filter(f => f.trim().length > 0);
    return features.slice(0, 4);
  };

  // Warna unik untuk setiap card
  const getCardStyle = (index) => {
    const styles = {
      0: { accent: '#000', badge: 'BASIC' },
      1: { accent: '#000', badge: 'POPULAR' },
      2: { accent: '#000', badge: 'PRO' },
    };
    return styles[index] || styles[1];
  };

  const renderProductCard = ({ item, index }) => {
    const cardStyle = getCardStyle(index);
    const features = parseFeatures(item.description);
    const planName = item.title?.split(' ')[0] || 'Premium';
    const isPopular = index === 1;
    
    return (
      <Animated.View style={styles.cardContainer}>
        <View style={[styles.card, { height: CARD_HEIGHT, borderTopColor: cardStyle.accent, borderTopWidth: 3 }]}>
          
          <View style={[styles.cardHeader, { backgroundColor: cardStyle.accent + '08' }]}>
            <View style={[styles.badge, { backgroundColor: cardStyle.accent }]}>
              <Text style={styles.badgeText}>{cardStyle.badge}</Text>
            </View>
            <Text style={[styles.planName, { color: cardStyle.accent }]}>{planName}</Text>
          </View>
          
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>STARTING FROM</Text>
            <Text style={[styles.price, { color: cardStyle.accent }]}>{item.displayPrice}</Text>
          </View>
          
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>What you'll get:</Text>
            {features.map((feature, idx) => (
              <View key={idx} style={styles.featureItem}>
                <View style={[styles.checkCircle, { backgroundColor: cardStyle.accent + '15' }]}>
                  <Text style={[styles.checkmark, { color: cardStyle.accent }]}>✓</Text>
                </View>
                <Text style={styles.featureText}>{feature.trim()}</Text>
              </View>
            ))}
          </View>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: cardStyle.accent, opacity: isProcessing ? 0.6 : 1 }]}
            onPress={() => {
              addDebugLog(`🎯 Button clicked for ${item.productId || item.id}`, 'info');
              handleBuy(item.productId || item.id);
            }}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {isProcessing ? 'PROCESSING...' : (isPopular ? '🔥 GET STARTED' : 'SUBSCRIBE NOW')}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.cardFooter}>No commitment • Cancel anytime</Text>
        </View>
      </Animated.View>
    );
  };

  const renderDotIndicators = () => {
    if (products.length === 0) return null;
    
    return (
      <View style={styles.dotContainer}>
        {products.map((_, idx) => {
          const inputRange = [
            (idx - 1) * (CARD_WIDTH + 16),
            idx * (CARD_WIDTH + 16),
            (idx + 1) * (CARD_WIDTH + 16),
          ];
          
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [6, 24, 6],
            extrapolate: 'clamp',
          });
          
          const dotColor = scrollX.interpolate({
            inputRange,
            outputRange: ['#c6c6c8', '#000', '#c6c6c8'],
            extrapolate: 'clamp',
          });
          
          return (
            <Animated.View
              key={idx}
              style={[
                styles.dot,
                { width: dotWidth, backgroundColor: dotColor },
                idx === currentIndex && styles.dotActive
              ]}
            />
          );
        })}
      </View>
    );
  };

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#000" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        {/* Debug Button */}
        <TouchableOpacity 
          style={styles.debugButton}
          onPress={() => setDebugVisible(true)}
        >
          <Text style={styles.debugButtonText}>🐛 DEBUG</Text>
        </TouchableOpacity>
        
        <View style={styles.header}>
          <Text style={styles.subtitle}>Debug console available</Text>
        </View>

        {products.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No products available</Text>
            <TouchableOpacity onPress={() => {
              addDebugLog('🔄 Manual retry fetch products', 'info');
              fetchProducts({ skus: PRODUCT_IDS, type: 'in-app' });
            }}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={products}
              renderItem={renderProductCard}
              keyExtractor={(item) => item.productId || item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_WIDTH + 16}
              snapToAlignment="center"
              decelerationRate="fast"
              contentContainerStyle={styles.listContent}
              onScroll={onScroll}
              onViewableItemsChanged={onViewableItemsChanged}
            />
            
            {renderDotIndicators()}
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                🔒 Secure payment • 💳 No hidden fees • ✅ 7-day trial
              </Text>
            </View>
          </>
        )}
      </View>
      
      <DebugPanel 
        logs={debugLogs} 
        visible={debugVisible} 
        onClose={() => setDebugVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: (screenWidth - CARD_WIDTH) / 2,
    paddingVertical: 15,
  },
  cardContainer: {
    width: CARD_WIDTH,
    marginHorizontal: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 20,
    paddingBottom: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  priceSection: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8e8e93',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  price: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
  },
  featuresSection: {
    padding: 20,
    flex: 1,
  },
  featuresTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkmark: {
    fontSize: 12,
    fontWeight: '700',
  },
  featureText: {
    fontSize: 14,
    color: '#3a3a3c',
    flex: 1,
    lineHeight: 16,
  },
  button: {
    margin: 20,
    marginTop: 0,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  cardFooter: {
    textAlign: 'center',
    fontSize: 10,
    color: '#8e8e93',
    marginBottom: 16,
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#000',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#8e8e93',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8e8e93',
  },
  retryText: {
    fontSize: 14,
    color: '#000',
    marginTop: 12,
    fontWeight: '500',
  },
  debugButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 999,
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    opacity: 0.8,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  debugOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
    zIndex: 9999,
  },
  debugContainer: {
    flex: 1,
    marginTop: 40,
    marginBottom: 20,
    marginHorizontal: 10,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    overflow: 'hidden',
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2d2d2d',
    borderBottomWidth: 1,
    borderBottomColor: '#3d3d3d',
  },
  debugTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#3d3d3d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  debugCloseText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  debugLogs: {
    flex: 1,
    padding: 12,
  },
  logItem: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  loginfo: {
    backgroundColor: '#2d2d2d',
    borderLeftColor: '#4a9eff',
  },
  logsuccess: {
    backgroundColor: '#1e3a2e',
    borderLeftColor: '#4caf50',
  },
  logerror: {
    backgroundColor: '#3d1e1e',
    borderLeftColor: '#f44336',
  },
  logwarning: {
    backgroundColor: '#3d3a1e',
    borderLeftColor: '#ff9800',
  },
  logdebug: {
    backgroundColor: '#2d2d3d',
    borderLeftColor: '#9c27b0',
  },
  logTime: {
    color: '#888',
    fontSize: 10,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  logMessage: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  logData: {
    color: '#aaa',
    fontSize: 10,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  noLogs: {
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
  },
});