import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Modal ,
  Dimensions,
  Image,
  StatusBar,
  PermissionsAndroid,
  Alert,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Geolocation from 'react-native-geolocation-service';
import SayHiModal from './SayHiModal'; // Sesuaikan path
import { API_CONFIG } from '../../service/explore/config.js';
import { fetchExploreData, updateUserLocation,createBoost, getAuthToken, sendLike } from '../../service/explore/api.js';
import { formatUserData } from '../../service/explore/utils.js';
import FooterHome from '../components/FooterHome.js';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [position] = useState(new Animated.ValueXY());
  const [users, setUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoggedInPremium, setIsLoggedInPremium] = useState(false);
  const [userIsBoosted, setUserIsBoosted] = useState(false);
  const [userIsStarLike, setUserIsStarLike] = useState(false);
  const [userIsSee, setUserIsSee] = useState(false);
  const [remainingSwipe, setRemainingSwipe] = useState(0);
  const [showSwipeLimitModal, setShowSwipeLimitModal] = useState(false);
  const [showSayHiModal, setShowSayHiModal] = useState(false);
  const [selectedUserForHi, setSelectedUserForHi] = useState(null);

  const [isTreeMenuVisible, setIsTreeMenuVisible] = useState(false);
  const [showStars, setShowStars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [activeTab, setActiveTab] = useState('for you');

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

  const isPremiumUser = () => {
    return isLoggedInPremium === true;
  };

  const isBoostedUser = () => {
    return userIsBoosted === true;
  };

   const isStarLikeUser = () => {
    return userIsStarLike === true;
  };

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
          message: 'Yuhuu! butuh akses lokasi untuk menemukan orang di sekitar kamu',
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

      setIsLoggedInPremium(usersData.user_is_premium || false);
      setUserIsBoosted(usersData.user_is_boosted || false);
      setUserIsStarLike(usersData.user_is_star_like || false);
      setUserIsSee(usersData.user_is_see || false);
      setRemainingSwipe(usersData.remaining_swipe || 0);

      
      if (usersData.users && usersData.users.length > 0) {
        const formattedUsers = usersData.users.map(user => formatUserData(user, API_CONFIG.PICT_URL));
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

  // ==================== MODAL COMPONENT ====================
const SwipeLimitModal = ({ visible, onClose, onUpgrade }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <Icon name="timer-outline" size={60} color="#FF3B6F" />
        <Text style={styles.modalTitle}>Daily Swipe Limit Reached! 😢</Text>
        <Text style={styles.modalDesc}>
          You've used all your daily swipes! Come back tomorrow.
        </Text>
        
        <View style={styles.features}>
          <Text style={styles.featureText}>✨ Unlimited Swipes</Text>
          <Text style={styles.featureText}>⭐ Super Likes (Star)</Text>
          <Text style={styles.featureText}>⚡ Profile Boost</Text>
          <Text style={styles.featureText}>👁️ See Who Likes You</Text>
        </View>
        
        <TouchableOpacity style={styles.upgradeBtn} onPress={onUpgrade}>
          <LinearGradient
            colors={['#FF3B6F', '#FF6B6B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.upgradeGradient}
          >
            <Text style={styles.upgradeBtnText}>🔥 Upgrade to Premium</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.laterText}>Maybe Later</Text>
        </TouchableOpacity>
        
        <Text style={styles.resetInfo}>Swipes reset at midnight 🕛</Text>
      </View>
    </View>
  </Modal>
);
// ==================== END MODAL ====================

  const handleSwipeComplete = (direction) => {
    if (direction === 'right') {
      handleHeartIconPress();
    }
    setCurrentIndex((prevIndex) => prevIndex + 1);
    position.setValue({ x: 0, y: 0 });
  };


const handleHeartIconPress = async (isSuperLike = false) => {
  // Cek swipe limit
  if (remainingSwipe <= 1 && !isPremiumUser()) {
    setShowSwipeLimitModal(true);
    return;
  }
  
  const likedUser = users[currentIndex];
  if (!likedUser) {
    console.log('❌ No user to like');
    return;
  }
  
  console.log(`❤️ Liking user: ${likedUser?.full_name} (ID: ${likedUser?.id})`);
  
  try {
    const response = await sendLike(likedUser.id, isSuperLike);
    
    // Update remaining swipe
    if (response.data?.remaining_swipe !== undefined) {
      setRemainingSwipe(response.data.remaining_swipe);
    }
    
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
    }
    
    return response;
  } catch (error) {
    console.error('Error sending like:', error);
    
    if (error.response?.data?.message === 'daily swipe limit exceeded') {
      setShowSwipeLimitModal(true);
    } else {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send like.');
    }
    
    throw error;
  }
};

  // Fungsi untuk animasi boost petir dengan efek air mengisi
  // const handleBoostPress = () => {
  //   if (isBoosting) {
  //     cancelBoost();
  //     return;
  //   }
    
  //   startBoost();
  // };

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

  const handleSendHi = async () => {
  if (!selectedUserForHi) return;
  
  // Implementasi send hi ke API
  console.log('Sending hi to:', selectedUserForHi.full_name);
  
  // Tutup modal
  setShowSayHiModal(false);
  setSelectedUserForHi(null);
  
  // Alert sukses
  Alert.alert('Hi Sent!', `You've sent a wave to ${selectedUserForHi.full_name}!`);
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
    if (!isPremiumUser()) {
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

    const goRewind = () => {
    if (!isPremiumUser()) {
      Alert.alert(
        'Premium Feature',
        'Go back to previous profile is only available for Premium users. Upgrade now to unlock this feature!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade Now', onPress: () => navigation.navigate('GetGold') }
        ]
      );
    } else if (currentIndex > 0) {
      setCurrentIndex((prevIndex) => prevIndex - 1);
      resetPosition();
    }
  };


const handleStar = () => {
  if (!isStarLikeUser()) {
    Alert.alert(
      'Premium Feature',
      'Star likes are only available for Premium users. Upgrade now to unlock this feature!',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade Now', onPress: () => navigation.navigate('GetStarLike') }
      ]
    );
    return;
  }
  
  // Jalankan animasi bintang
  animateStarButton();
  
  // Kirim star like (super like)
  const likedUser = users[currentIndex];
  if (likedUser) {
    handleHeartIconPress(true);
  }
};
  
const handleBoost = async () => {
  try {
    if (isBoosting) {
      cancelBoost();
      return;
    }

    startBoost();

    const response = await createBoost();

    console.log('BOOST RESPONSE:', response);

    Alert.alert(
      'Boost Activated ⚡',
      'Your profile is boosted for 30 minutes!'
    );

  } catch (error) {
    cancelBoost();

    Alert.alert(
      'Boost Failed',
      error?.response?.data?.message || 'Failed activate boost'
    );
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
        <StatusBar barStyle="light-content"/>
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <Text style={styles.logoText}>Yuhuu!</Text>
            <TouchableOpacity onPress={toggleTreeMenu}>
              <Icon name="menu-outline" size={28} color="#fff" />
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
            <FooterHome navigation={navigation} closeIconRef={closeIconRef} />
          </View>
        </View>
        {showSwipeLimitModal && (
  <SwipeLimitModal
    visible={showSwipeLimitModal}
    onClose={() => setShowSwipeLimitModal(false)}
    onUpgrade={() => navigation.navigate('PremiumAccess')}
  />
)}
      </SafeAreaView>
    );
  }

  const currentUser = users[currentIndex];

  return (
    <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.logoText}>
          <Animated.View style={{ transform: [{ scale: boostScaleAnim }] }}>
    <TouchableOpacity onPress={handleBoost} activeOpacity={0.8}>
      <Animated.View
        style={[
          styles.headerBoostContainer,
          isBoosting && styles.headerBoostActive,
        ]}
      >
        {/* Water fill effect */}
        <Animated.View
          style={[
            styles.headerWaterFill,
            {
              height: waterFillHeight,
              backgroundColor: progressColor,
            },
          ]}
        />
        
        {/* Icon flash */}
        <Animated.View
          style={{
            transform: [{ rotate: boostRotate }],
            zIndex: 2,
          }}
        >
          <Icon name="flash" size={24} color={isBoosting ? "#d468ff" : "#d468ff"} />
        </Animated.View>
        
        {/* Progress text */}
        {isBoosting && (
          <Animated.Text style={styles.headerBoostProgress}>
            {Math.round(boostProgress * 100)}%
          </Animated.Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  </Animated.View>
          </Text>
           <View style={styles.tabContainer}>
    <TouchableOpacity onPress={() => setActiveTab('for you')} style={styles.tab}>
      <Text style={[styles.tabText, activeTab === 'for you' && styles.activeTabText]}>For You</Text>
      {activeTab === 'for you' && <View style={styles.activeIndicator} />}
    </TouchableOpacity>
    
    <TouchableOpacity onPress={() => setActiveTab('nearby')} style={styles.tab}>
      <Text style={[styles.tabText, activeTab === 'nearby' && styles.activeTabText]}>Nearby</Text>
      {activeTab === 'nearby' && <View style={styles.activeIndicator} />}
    </TouchableOpacity>
    
    <TouchableOpacity onPress={() => setActiveTab('new')} style={styles.tab}>
      <Text style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}>New</Text>
      {activeTab === 'new' && <View style={styles.activeIndicator} />}
    </TouchableOpacity>
    
  </View>
          <TouchableOpacity onPress={toggleTreeMenu}>
            <Icon name="options-outline" size={22} color="#d468ff" />
          </TouchableOpacity>
        </View>

        {isTreeMenuVisible && (
          <View style={styles.treeMenu}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Preferences')}
              style={styles.menuItem}
            >
              <Icon name="settings-outline" size={20} color="#333" />
              <Text style={styles.menuText}>Preferences</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Icon name="help-circle-outline" size={20} color="#333" />
              <Text style={styles.menuText}>Who Viewed Me</Text>
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
          <TouchableOpacity style={styles.actionBtn} onPress={goRewind}>
            <Icon name="arrow-undo-outline" size={32} color="#b899ba" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.nopeBtn]}
            onPress={() => forceSwipe('left')}          >
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
              onPress={handleStar}
              activeOpacity={0.8}
            >
              <Animated.View
                style={{
                  transform: [{ rotate: starRotate }],
                }}
              >
                <Icon name="star" size={24} color="#48cf91" />
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
          
          <TouchableOpacity
            style={[styles.actionBtn, styles.likeBtn]}
            onPress={() => forceSwipe('right')}
          >
            <Icon name="heart" size={40} color="#ff4d6d" />
          </TouchableOpacity>
         <TouchableOpacity
          style={[styles.actionBtn, styles.boostBtn]}
          onPress={() => {
            setSelectedUserForHi(users[currentIndex]);
            setShowSayHiModal(true);
          }}
        >
          <Entypo name="hand" size={28} color="#426ec8" />
        </TouchableOpacity>

          {/* Boost Button with Water Fill Animation */}
          {/* <Animated.View
            style={{
              transform: [{ scale: boostScaleAnim }],
            }}
          >
            <TouchableOpacity
              style={[styles.actionBtn, styles.boostBtn, isBoosting && styles.boostBtnActive]}
              onPress={handleBoost}
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
                <Entypo 
                  name="hand" 
                  size={isBoosting ? 22 : 28} 
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
          </Animated.View> */}
        </View>

        <View style={{ marginBottom: insets.bottom }}>
          <FooterHome navigation={navigation} closeIconRef={closeIconRef} />
        </View>
      </View>
      {showSwipeLimitModal && (
  <SwipeLimitModal
    visible={showSwipeLimitModal}
    onClose={() => setShowSwipeLimitModal(false)}
    onUpgrade={() => navigation.navigate('PremiumAccess')}
  />
)}
{showSayHiModal && (
  <SayHiModal
    visible={showSayHiModal}
    onClose={() => {
      setShowSayHiModal(false);
      setSelectedUserForHi(null);
    }}
    onSend={handleSendHi}
    userName={selectedUserForHi?.full_name}
    userAvatar={selectedUserForHi?.profile_picture?.file_path}
  />
)}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#212121',
  },
  container: {
    flex: 1,
    backgroundColor: '#212121',
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
    backgroundColor: '#212121',
    borderBottomWidth: 1,
    borderBottomColor: '#212121',
    zIndex: 10,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },
  logoCake: {
    color: '#018a8d',
  },
  treeMenu: {
    position: 'absolute',
    top: 70,
    right: 20,
    width: 180,
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
    backgroundColor: '#212121',
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
    backgroundColor: '#363636',
    width: 65,
    height: 65,
    borderRadius: 35,
    borderWidth: 1,
  },
  likeBtn: {
    backgroundColor: '#363636',
    width: 65,
    height: 65,
    borderRadius: 35,
    borderWidth: 1,
  },
  starBtn: {
    backgroundColor: '#363636',
    borderWidth: 1,
  },
  boostBtn: {
    backgroundColor: '#363636',
    borderWidth: 1,
    position: 'relative',
  },
  boostBtnActive: {
    borderWidth: 2,
    borderColor: '#ff6b6b',
  },
  boostIconContainer: {
    zIndex: 2,
  },
  tabContainer: {
  flexDirection: 'row',
  gap: 20,
},
tab: {
  alignItems: 'center',
},
tabText: {
  fontSize: 14,
  fontWeight: '500',
  color: '#888',
},
activeTabText: {
  color: '#d468ff',
},
activeIndicator: {
  width: 20,
  height: 2,
  backgroundColor: '#d468ff',
  borderRadius: 1,
  marginTop: 4,
},
// Tambahkan di styles
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.7)',
  justifyContent: 'center',
  alignItems: 'center',
},
modalContainer: {
  backgroundColor: '#fff',
  borderRadius: 24,
  padding: 24,
  width: screenWidth * 0.85,
  alignItems: 'center',
},
modalTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#333',
  marginTop: 16,
  marginBottom: 8,
  textAlign: 'center',
},
modalDesc: {
  fontSize: 14,
  color: '#666',
  textAlign: 'center',
  marginBottom: 20,
},
features: {
  width: '100%',
  marginBottom: 24,
},
featureText: {
  fontSize: 14,
  color: '#444',
  marginVertical: 4,
  textAlign: 'center',
},
upgradeBtn: {
  width: '100%',
  marginBottom: 12,
  borderRadius: 30,
  overflow: 'hidden',
},
upgradeGradient: {
  paddingVertical: 14,
  alignItems: 'center',
},
upgradeBtnText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 16,
},
laterText: {
  color: '#888',
  fontSize: 14,
  marginTop: 8,
},
resetInfo: {
  color: '#aaa',
  fontSize: 11,
  marginTop: 16,
},
headerBoostContainer: {
  position: 'relative',
  width: 30,
  height: 30,
  borderRadius: 22,
  backgroundColor: '#363636',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
},
headerBoostActive: {
  borderWidth: 2,
  borderColor: '#ff6b6b',
},
headerWaterFill: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  width: '100%',
  zIndex: 1,
},
headerBoostProgress: {
  position: 'absolute',
  zIndex: 3,
  color: '#000',
  fontSize: 10,
  fontWeight: 'bold',
  bottom: 2,
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