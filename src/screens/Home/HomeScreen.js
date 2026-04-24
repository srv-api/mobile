import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Image,
  StatusBar,
  PermissionsAndroid,
  Alert,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Footer from '../components/Footer.js';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { API_CONFIG } from '../../service/explore/config.js';
import { fetchExploreData, updateUserLocation, getAuthToken, sendLike } from '../../service/explore/api.js';
import { formatUserData } from '../../service/explore/utils.js';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [position] = useState(new Animated.ValueXY());
  const [users, setUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTreeMenuVisible, setIsTreeMenuVisible] = useState(false);
  const [showStars, setShowStars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  
  // State untuk animasi boost petir
  const [isBoosting, setIsBoosting] = useState(false);
  const [boostProgress, setBoostProgress] = useState(0);
  const boostAnim = useRef(new Animated.Value(0)).current;
  const boostScaleAnim = useRef(new Animated.Value(1)).current;
  const boostRotateAnim = useRef(new Animated.Value(0)).current;
  const boostTimerRef = useRef(null);
  
  // Animations for star button
  const starScaleAnim = useRef(new Animated.Value(1)).current;
  const starRotateAnim = useRef(new Animated.Value(0)).current;
  const starPulseAnim = useRef(new Animated.Value(1)).current;
  
  // Animations for 3 stars
  const starLeftAnim = useRef(new Animated.Value(0)).current;
  const starCenterAnim = useRef(new Animated.Value(0)).current;
  const starRightAnim = useRef(new Animated.Value(0)).current;
  const starLeftScale = useRef(new Animated.Value(0)).current;
  const starCenterScale = useRef(new Animated.Value(0)).current;
  const starRightScale = useRef(new Animated.Value(0)).current;
  const starLeftRotate = useRef(new Animated.Value(0)).current;
  const starCenterRotate = useRef(new Animated.Value(0)).current;
  const starRightRotate = useRef(new Animated.Value(0)).current;

  const SWIPE_THRESHOLD = 50;
  const heartIconRef = useRef(null);
  const closeIconRef = useRef(null);
  const [hasSwipedRight, setHasSwipedRight] = useState(false);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD && !hasSwipedRight) {
        position.setValue({ x: gestureState.dx, y: 0 });
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD) {
        forceSwipe(gestureState.dx > 0 ? 'right' : 'left');
      } else {
        resetPosition();
      }
    },
  });

  useEffect(() => {
    initHomeScreen();
  }, []);

  useEffect(() => {
    resetPosition();
  }, [currentIndex]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (boostTimerRef.current) {
        clearInterval(boostTimerRef.current);
      }
    };
  }, []);

  const initHomeScreen = async () => {
    setLoading(true);
    const location = await getLocation();
    
    if (location) {
      await updateUserLocation(location.latitude, location.longitude);
    }
    
    await loadExploreData();
    setLoading(false);
  };

  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Izin Lokasi',
          message: 'MiSee butuh akses lokasi untuk menemukan orang di sekitar kamu',
          buttonNeutral: 'Nanti',
          buttonNegative: 'Tolak',
          buttonPositive: 'Izinkan',
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const getLocation = () => {
    return new Promise(async (resolve) => {
      const hasPermission = await requestLocationPermission();

      if (!hasPermission) {
        console.log('❌ Izin lokasi ditolak');
        Alert.alert(
          'Izin Lokasi Diperlukan',
          'Mohon izinkan akses lokasi untuk menemukan orang di sekitar Anda',
          [{ text: 'OK', onPress: () => console.log('OK Pressed') }]
        );
        resolve(null);
        return;
      }

      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          console.log('📍 Location obtained:', { latitude, longitude });
          resolve({ latitude, longitude });
        },
        (error) => {
          console.log('❌ Error getting location:', error);
          Alert.alert('Error', 'Gagal mendapatkan lokasi. Pastikan GPS aktif.');
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  };

  const loadExploreData = async () => {
    try {
      const usersData = await fetchExploreData();
      
      if (usersData && usersData.length > 0) {
        const formattedUsers = usersData.map(user => formatUserData(user, API_CONFIG.PICT_URL));
        setUsers(formattedUsers);
      } else {
        setUsers([]);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'Gagal memuat data. Periksa koneksi internet Anda.',
        [{ text: 'OK', onPress: () => console.log('OK Pressed') }]
      );
      setUsers([]);
    }
  };

  const forceSwipe = (direction) => {
    if (direction === 'right') {
      setHasSwipedRight(true);
    }
    Animated.timing(position, {
      toValue: { x: direction === 'right' ? screenWidth : -screenWidth, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => handleSwipeComplete(direction));
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start(() => setHasSwipedRight(false));
  };

  const handleSwipeComplete = (direction) => {
    if (direction === 'right') {
      handleHeartIconPress();
    }
    setCurrentIndex((prevIndex) => prevIndex + 1);
    position.setValue({ x: 0, y: 0 });
  };

  const handleHeartIconPress = async (isSuperLike = false) => {
  const likedUser = users[currentIndex];
  if (!likedUser) {
    console.log('❌ No user to like');
    return;
  }
  
  console.log(`❤️ Liking user: ${likedUser?.full_name} (ID: ${likedUser?.id})`);
  
  try {
    const response = await sendLike(likedUser.id, isSuperLike);
    
    if (response.data?.isMatch) {
      Alert.alert(
        'It\'s a Match! 🎉',
        `You and ${likedUser.full_name} liked each other!`,
        [
          { 
            text: 'Send Message', 
            onPress: () => navigation.navigate('Chat', { userId: likedUser.id })
          },
          { text: 'Keep Swiping', style: 'cancel' }
        ]
      );
    } else {
      console.log('✅ Like sent successfully');
    }
    
    return response;
  } catch (error) {
    console.error('Error sending like:', error);
    
    if (error.response?.data?.message === 'daily swipe limit exceeded') {
      Alert.alert(
        'Swipe Limit Exceeded',
        'You have used all your daily swipes. Come back tomorrow!',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to send like. Please try again.',
        [{ text: 'OK' }]
      );
    }
    
    throw error;
  }
};

  // Fungsi untuk animasi boost petir dengan efek air mengisi
  const handleBoostPress = () => {
    if (isBoosting) {
      cancelBoost();
      return;
    }
    
    startBoost();
  };

  const startBoost = () => {
    setIsBoosting(true);
    setBoostProgress(0);
    
    boostAnim.setValue(0);
    boostScaleAnim.setValue(1);
    boostRotateAnim.setValue(0);
    
    Animated.parallel([
      Animated.spring(boostScaleAnim, {
        toValue: 1.1,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(boostRotateAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    const duration = 60000;
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;
    
    boostTimerRef.current = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      setBoostProgress(progress);
      boostAnim.setValue(progress);
      
      if (progress >= 1) {
        completeBoost();
      }
    }, interval);
  };
  
  const cancelBoost = () => {
    if (boostTimerRef.current) {
      clearInterval(boostTimerRef.current);
      boostTimerRef.current = null;
    }
    
    Animated.spring(boostScaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
    
    setIsBoosting(false);
    setBoostProgress(0);
    boostAnim.setValue(0);
    
    Alert.alert('Boost Dibatalkan', 'Proses boost telah dibatalkan.');
  };
  
  const completeBoost = () => {
    if (boostTimerRef.current) {
      clearInterval(boostTimerRef.current);
      boostTimerRef.current = null;
    }
    
    Animated.sequence([
      Animated.timing(boostScaleAnim, {
        toValue: 1.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(boostScaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    setIsBoosting(false);
    
    Alert.alert(
      'Boost Aktif!',
      'Profil Anda telah ditingkatkan! Anda akan terlihat oleh lebih banyak orang selama 30 menit ke depan.',
      [{ text: 'OK', onPress: () => console.log('Boost activated') }]
    );
    
    setBoostProgress(0);
    boostAnim.setValue(0);
  };

  // Animasi untuk 3 bintang (kiri, tengah besar, kanan)
  const animateStarButton = () => {
    // Reset animations
    starScaleAnim.setValue(1);
    starRotateAnim.setValue(0);
    starPulseAnim.setValue(1);
    
    // Reset 3 stars animations
    starLeftAnim.setValue(0);
    starCenterAnim.setValue(0);
    starRightAnim.setValue(0);
    starLeftScale.setValue(0);
    starCenterScale.setValue(0);
    starRightScale.setValue(0);
    starLeftRotate.setValue(0);
    starCenterRotate.setValue(0);
    starRightRotate.setValue(0);
    
    // Animasi tombol bintang
    Animated.parallel([
      Animated.sequence([
        Animated.timing(starScaleAnim, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
          easing: Easing.elastic(1),
        }),
        Animated.timing(starScaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
          easing: Easing.elastic(1),
        }),
      ]),
      Animated.timing(starRotateAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(starPulseAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(starPulseAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    
    // Animasi 3 bintang berurutan
    // Bintang kiri muncul pertama
    Animated.parallel([
      Animated.timing(starLeftAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(starLeftScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(starLeftRotate, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Bintang tengah (BESAR) muncul kedua dengan delay
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(starCenterAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(starCenterScale, {
          toValue: 1.5,
          friction: 2,
          useNativeDriver: true,
        }),
        Animated.timing(starCenterRotate, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, 100);
    
    // Bintang kanan muncul ketiga dengan delay
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(starRightAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(starRightScale, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(starRightRotate, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);
    
    // Tampilkan bintang di card
    const newShowStars = [...showStars];
    newShowStars[currentIndex] = true;
    setShowStars(newShowStars);
    
    // Sembunyikan setelah 2.5 detik
    setTimeout(() => {
      // Animasi menghilang
      Animated.parallel([
        Animated.timing(starLeftAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(starCenterAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(starRightAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      setTimeout(() => {
        newShowStars[currentIndex] = false;
        setShowStars(newShowStars);
      }, 300);
    }, 2200);
  };

  // Rotate interpolation untuk ikon bintang
  const starRotate = starRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  // Interpolasi untuk 3 bintang
  const starLeftOpacity = starLeftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const starCenterOpacity = starCenterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const starRightOpacity = starRightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  
  const starLeftRotateInterpolate = starLeftRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const starCenterRotateInterpolate = starCenterRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const starRightRotateInterpolate = starRightRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  // Interpolasi untuk efek air mengisi
  const waterFillHeight = boostAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  
  const boostRotate = boostRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  
  const progressColor = boostAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#4ecdc4', '#ffe66d', '#ff6b6b'],
  });

  const handleProfileClick = (id) => {
    navigation.navigate('VisitProfile', { userId: id });
  };

  const toggleTreeMenu = () => {
    setIsTreeMenuVisible(!isTreeMenuVisible);
  };

  const goToPreviousUser = () => {
    if (currentUser && currentUser.is_premium === false) {
      Alert.alert(
        'Premium Feature',
        'Go back to previous profile is only available for Premium users. Upgrade now to unlock this feature!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade Now', onPress: () => navigation.navigate('PremiumAccess') }
        ]
      );
    } else if (currentIndex > 0) {
      setCurrentIndex((prevIndex) => prevIndex - 1);
      resetPosition();
    }
  };

  const refreshData = async () => {
    setLoading(true);
    const location = await getLocation();
    if (location) {
      await updateUserLocation(location.latitude, location.longitude);
    }
    await loadExploreData();
    setCurrentIndex(0);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          {isUpdatingLocation ? 'Updating location...' : 'Loading amazing people...'}
        </Text>
      </View>
    );
  }

  if (currentIndex >= users.length) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <Text style={styles.logoText}>MiSee</Text>
            <TouchableOpacity onPress={toggleTreeMenu}>
              <Icon name="menu-outline" size={28} color="#333" />
            </TouchableOpacity>
          </View>
          <View style={styles.noMoreContainer}>
            <Icon name="heart-dislike-circle-outline" size={80} color="#ccc" />
            <Text style={styles.noMoreText}>No more profiles</Text>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={refreshData}
            >
              <Text style={styles.resetButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
          <View style={{ marginBottom: insets.bottom }}>
            <Footer navigation={navigation} closeIconRef={closeIconRef} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const currentUser = users[currentIndex];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.logoText}>
            Mi<Text style={styles.logoCake}>See</Text>
          </Text>
          <TouchableOpacity onPress={toggleTreeMenu}>
            <Icon name="menu-outline" size={28} color="#333" />
          </TouchableOpacity>
        </View>

        {isTreeMenuVisible && (
          <View style={styles.treeMenu}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Setting')}
              style={styles.menuItem}
            >
              <Icon name="settings-outline" size={20} color="#333" />
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Friends')}
              style={styles.menuItem}
            >
              <Icon name="people-outline" size={20} color="#333" />
              <Text style={styles.menuText}>Matches</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Icon name="help-circle-outline" size={20} color="#333" />
              <Text style={styles.menuText}>Help</Text>
            </TouchableOpacity>
          </View>
        )}

        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.card,
            position.getLayout(),
            {
              transform: [
                {
                  rotate: position.x.interpolate({
                    inputRange: [-screenWidth, 0, screenWidth],
                    outputRange: ['-30deg', '0deg', '30deg'],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        >
          <Image
            source={{ uri: currentUser?.profile_picture?.file_path }}
            style={styles.cardImage}
            onError={(e) => {
              console.log('Image load error:', e.nativeEvent.error);
            }}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.cardGradient}
          >
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {currentUser?.full_name}, {currentUser?.age}
              </Text>
              <View style={styles.distanceBadge}>
                <Icon name="location-outline" size={14} color="#fff" />
                <Text style={styles.distanceText}>{currentUser?.distance}</Text>
              </View>
              {currentUser?.bio && currentUser.bio !== '' && (
                <Text style={styles.userBio} numberOfLines={2}>
                  {currentUser?.bio}
                </Text>
              )}
              <TouchableOpacity
                onPress={() => handleProfileClick(currentUser?.profile_id)}
                style={styles.profileButton}
              >
                <Text style={styles.profileButtonText}>View Profile</Text>
                <Icon name="arrow-forward-outline" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
          
          {/* 3 Stars Animation */}
          {showStars[currentIndex] && (
            <View style={styles.starsContainer}>
              {/* Bintang Kiri */}
              <Animated.View
                style={[
                  styles.starIcon,
                  styles.starLeft,
                  {
                    opacity: starLeftOpacity,
                    transform: [
                      { scale: starLeftScale },
                      { rotate: starLeftRotateInterpolate },
                    ],
                  },
                ]}
              >
                <Icon name="star" size={45} color="#FFD700" />
                <View style={styles.starSmallGlow} />
              </Animated.View>
              
              {/* Bintang Tengah (BESAR) */}
              <Animated.View
                style={[
                  styles.starIcon,
                  styles.starCenter,
                  {
                    opacity: starCenterOpacity,
                    transform: [
                      { scale: starCenterScale },
                      { rotate: starCenterRotateInterpolate },
                    ],
                  },
                ]}
              >
                <Icon name="star" size={90} color="#FFD700" />
                <View style={styles.starCenterGlow} />
              </Animated.View>
              
              {/* Bintang Kanan */}
              <Animated.View
                style={[
                  styles.starIcon,
                  styles.starRight,
                  {
                    opacity: starRightOpacity,
                    transform: [
                      { scale: starRightScale },
                      { rotate: starRightRotateInterpolate },
                    ],
                  },
                ]}
              >
                <Icon name="star" size={45} color="#FFD700" />
                <View style={styles.starSmallGlow} />
              </Animated.View>
            </View>
          )}
        </Animated.View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionBtn} onPress={goToPreviousUser}>
            <Icon name="arrow-undo-outline" size={32} color="#b899ba" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.nopeBtn]}
            onPress={() => forceSwipe('left')}
          >
            <Icon name="close" size={40} color="#ff6b6b" />
          </TouchableOpacity>
          
          {/* Star Button with Animation */}
          <Animated.View
            style={{
              transform: [{ scale: starScaleAnim }],
            }}
          >
            <TouchableOpacity
              style={[styles.actionBtn, styles.starBtn]}
              onPress={animateStarButton}
              activeOpacity={0.8}
            >
              <Animated.View
                style={{
                  transform: [{ rotate: starRotate }],
                }}
              >
                <Icon name="star" size={32} color="#48cf91" />
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
          
          <TouchableOpacity
            style={[styles.actionBtn, styles.likeBtn]}
            onPress={() => forceSwipe('right')}
          >
            <Icon name="heart" size={40} color="#ff4d6d" />
          </TouchableOpacity>
          
          {/* Boost Button with Water Fill Animation */}
          <Animated.View
            style={{
              transform: [{ scale: boostScaleAnim }],
            }}
          >
            <TouchableOpacity
              style={[styles.actionBtn, styles.boostBtn, isBoosting && styles.boostBtnActive]}
              onPress={handleBoostPress}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.waterFill,
                  {
                    height: waterFillHeight,
                    backgroundColor: progressColor,
                  },
                ]}
              />
              
              <Animated.View
                style={[
                  styles.boostIconContainer,
                  {
                    transform: [{ rotate: boostRotate }],
                  },
                ]}
              >
                <Icon 
                  name="flash" 
                  size={isBoosting ? 28 : 32} 
                  color={isBoosting ? "#ffffff" : "#426ec8"} 
                />
              </Animated.View>
              
              {isBoosting && (
                <Animated.Text style={styles.boostProgressText}>
                  {Math.round(boostProgress * 100)}%
                </Animated.Text>
              )}
              
              {isBoosting && (
                <Animated.View
                  style={[
                    styles.waterRipple,
                    {
                      opacity: boostAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.3, 0.6, 0],
                      }),
                    },
                  ]}
                />
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={{ marginBottom: insets.bottom }}>
          <Footer navigation={navigation} closeIconRef={closeIconRef} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 10,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },
  logoCake: {
    color: '#FF6B6B',
  },
  treeMenu: {
    position: 'absolute',
    top: 70,
    right: 20,
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  card: {
    width: screenWidth * 0.85,
    height: screenHeight * 0.6,
    alignSelf: 'center',
    marginTop: 10,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userInfo: {
    width: '100%',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  userBio: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  distanceText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 4,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  profileButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginRight: 6,
  },
  starsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    pointerEvents: 'none',
  },
  starIcon: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starLeft: {
    left: '10%',
    top: '35%',
  },
  starCenter: {
    left: '50%',
    top: '40%',
    marginLeft: -45,
    marginTop: -45,
  },
  starRight: {
    right: '10%',
    top: '35%',
  },
  starSmallGlow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    zIndex: -1,
  },
  starCenterGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    zIndex: -1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  actionBtn: {
    backgroundColor: '#fff',
    width: 55,
    height: 55,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  nopeBtn: {
    backgroundColor: '#fff',
    width: 65,
    height: 65,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  likeBtn: {
    backgroundColor: '#fff',
    width: 65,
    height: 65,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: '#ff4d6d',
  },
  starBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#48cf91',
  },
  boostBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#426ec8',
    position: 'relative',
  },
  boostBtnActive: {
    borderWidth: 2,
    borderColor: '#ff6b6b',
  },
  boostIconContainer: {
    zIndex: 2,
  },
  waterFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 1,
  },
  waterRipple: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 80,
    height: 80,
    marginLeft: -40,
    marginTop: -40,
    borderRadius: 40,
    backgroundColor: 'rgba(66, 110, 200, 0.3)',
    zIndex: 0,
  },
  boostProgressText: {
    position: 'absolute',
    zIndex: 3,
    color: '#000000',
    fontSize: 10,
    fontWeight: 'bold',
    bottom: 5,
  },
  noMoreContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMoreText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#aaa',
    marginTop: 16,
    marginBottom: 24,
  },
  resetButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 30,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default HomeScreen;