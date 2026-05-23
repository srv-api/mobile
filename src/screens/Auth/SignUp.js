import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
  StatusBar,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { signUp } from '../../service/auth/signup';
import { styles } from '../../screens/styles/signupStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { webSocketService } from '../../service/WebSocketServices';
import { PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
// Import components
import StepIndicator from '../../screens/Auth/components/signup/StepIndicator';
import NameStep from '../../screens/Auth/components/signup/NameStep';
import BirthdayStep from '../../screens/Auth/components/signup/BirthdayStep';
import GenderStep from '../../screens/Auth/components/signup/GenderStep';
import WhatsAppStep from '../../screens/Auth/components/signup/WhatsAppStep';
import AccountStep from '../../screens/Auth/components/signup/AccountStep';
import CustomDatePicker from '../../screens/Auth/components/signup/CustomDatePicker';
import FloatingDecorations from '../../screens/Auth/components/signup/FloatingDecorations';
import NavigationButtons from '../../screens/Auth/components/signup/NavigationButtons';
import OTPStep from '../../screens/Auth/components/signup/OTPStep';

const API_BASE_URL = 'http://103.150.227.223:2356';
const DETAIL_BASE_URL = 'http://103.150.227.223:2388';

const SignUp = ({ navigation }) => {
  // State Management
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [birthDate, setBirthDate] = useState({ day: '', month: '', year: '' });
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [detailId, setMerchantId] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState({
    day: '1',
    month: '1',
    year: new Date().getFullYear().toString(),
  });
  
  // Location state dari API
  const [countryCode, setCountryCode] = useState('62');
  const [countryName, setCountryName] = useState('Indonesia');
  const [isFetchingLocation, setIsFetchingLocation] = useState(true);
  
  // OTP State
  const [otpCode, setOtpCode] = useState(['', '', '', '']);
  const [otpFocused, setOtpFocused] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [signupToken, setSignupToken] = useState(''); // ✅ Simpan token dari signup
  
  const otpTranslateY = useRef(new Animated.Value(0)).current;

  // Focus states
  const [nameFocused, setNameFocused] = useState(false);
  const [whatsappFocused, setWhatsappFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [genderFocused, setGenderFocused] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const formOpacity = useRef(new Animated.Value(1)).current;
  const formTranslateX = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  
  // Input animations
  const nameTranslateY = useRef(new Animated.Value(0)).current;
  const whatsappTranslateY = useRef(new Animated.Value(0)).current;
  const genderTranslateY = useRef(new Animated.Value(0)).current;
  const emailTranslateY = useRef(new Animated.Value(0)).current;
  const passwordTranslateY = useRef(new Animated.Value(0)).current;

  // Date helpers
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());

  const getDaysInMonth = (month, year) => {
    if (!month || !year) return 31;
    return new Date(parseInt(year), parseInt(month), 0).getDate();
  };

  const getAvailableDays = () => {
    const maxDays = getDaysInMonth(tempDate.month, tempDate.year);
    return Array.from({ length: maxDays }, (_, i) => (i + 1).toString());
  };

  const calculateAge = (day, month, year) => {
    const birthDateObj = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return age;
  };

  const formatBirthDate = () => {
    if (birthDate.day && birthDate.month && birthDate.year) {
      const monthName = months[parseInt(birthDate.month) - 1];
      return `${birthDate.day} ${monthName} ${birthDate.year}`;
    }
    return '';
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateWhatsapp = (number) => {
    const phoneRegex = /^[0-9]{8,15}$/;
    return phoneRegex.test(number.replace(/[^0-9]/g, ''));
  };

  // Fungsi untuk mendapatkan lokasi dari API
  const detectUserCountryFromAPI = async () => {
    try {
      setIsFetchingLocation(true);
      const response = await fetch(`${API_BASE_URL}/auth/get-data-location`);
      const data = await response.json();
      
      console.log('Location from API (SignUp):', data);
      
      if (data && data.status === 'success') {
        if (data.phoneCode) {
          setCountryCode(data.phoneCode);
        }
        if (data.country) {
          setCountryName(data.country);
        }
        console.log(`✅ Detected: ${data.country} with phone code +${data.phoneCode}`);
      } else {
        setCountryCode('62');
        setCountryName('Indonesia');
      }
    } catch (error) {
      console.log('Error detecting country:', error);
      setCountryCode('62');
      setCountryName('Indonesia');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  // Effects
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(0.6)),
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();

    detectUserCountryFromAPI();
  }, []);

  // Focus animation effects
  useEffect(() => {
    Animated.timing(nameTranslateY, {
      toValue: nameFocused ? -8 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [nameFocused]);

  useEffect(() => {
    Animated.timing(whatsappTranslateY, {
      toValue: whatsappFocused ? -8 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [whatsappFocused]);

  useEffect(() => {
    Animated.timing(genderTranslateY, {
      toValue: genderFocused ? -8 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [genderFocused]);

  useEffect(() => {
    Animated.timing(emailTranslateY, {
      toValue: emailFocused ? -8 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [emailFocused]);

  useEffect(() => {
    Animated.timing(passwordTranslateY, {
      toValue: passwordFocused ? -8 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [passwordFocused]);

  // Handlers
  const shakeError = (targetAnim) => {
    Animated.sequence([
      Animated.timing(targetAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
      Animated.timing(targetAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(targetAnim, { toValue: -3, duration: 50, useNativeDriver: true }),
      Animated.timing(targetAnim, { toValue: 3, duration: 50, useNativeDriver: true }),
      Animated.timing(targetAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleNext = () => {
    if (step === 1 && !fullName.trim()) {
      shakeError(nameTranslateY);
      Alert.alert('', 'Please enter your full name');
      return;
    }

    if (step === 2) {
      if (!birthDate.day || !birthDate.month || !birthDate.year) {
        Alert.alert('', 'Please select your birth date');
        return;
      }
      
      const age = calculateAge(
        parseInt(birthDate.day),
        parseInt(birthDate.month),
        parseInt(birthDate.year)
      );
      
      if (age < 18) {
        Alert.alert('', 'You must be at least 18years old to join Yuhuu!');
        return;
      }
      
      if (age > 100) {
        Alert.alert('', 'Please enter a valid birth date');
        return;
      }
    }

    if (step === 3 && !gender) {
      Alert.alert('', 'Please select your gender');
      return;
    }

    if (step === 4) {
      if (!whatsapp.trim()) {
        Alert.alert('', 'Please enter your WhatsApp number');
        return;
      }
      
      const cleanNumber = whatsapp.replace(/[^0-9]/g, '');
      if (cleanNumber.length < 8 || cleanNumber.length > 15) {
        Alert.alert('', 'Please enter a valid WhatsApp number (8-15 digits)');
        return;
      }
    }

    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.92, duration: 100, useNativeDriver: true }),
      Animated.spring(buttonScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start();

    Animated.parallel([
      Animated.timing(formOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(formTranslateX, { toValue: -30, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setStep(step + 1);
      formOpacity.setValue(0);
      formTranslateX.setValue(30);
      Animated.parallel([
        Animated.timing(formOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(formTranslateX, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleBack = () => {
    Animated.parallel([
      Animated.timing(formOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(formTranslateX, { toValue: 30, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setStep(step - 1);
      formOpacity.setValue(0);
      formTranslateX.setValue(-30);
      Animated.parallel([
        Animated.timing(formOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(formTranslateX, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    });
  };

  const formatBirthDateForAPI = () => {
  if (birthDate.day && birthDate.month && birthDate.year) {
    const year = birthDate.year;
    const month = birthDate.month.padStart(2, '0');
    const day = birthDate.day.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return '';
};

  const birthdateForAPI = formatBirthDateForAPI();

  // ✅ SIGNUP HANDLER
  const handleSignUp = async () => {
    if (!email.trim()) {
      shakeError(emailTranslateY);
      Alert.alert('', 'Please enter your email address');
      return;
    }
    
    if (!validateEmail(email)) {
      shakeError(emailTranslateY);
      Alert.alert('', 'Please enter a valid email address');
      return;
    }

    if (!password) {
      shakeError(passwordTranslateY);
      Alert.alert('', 'Please enter a password');
      return;
    }

    if (password.length < 6) {
      shakeError(passwordTranslateY);
      Alert.alert('', 'Password must be at least 6 characters');
      return;
    }

    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.92, duration: 100, useNativeDriver: true }),
      Animated.spring(buttonScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start();

    setIsLoading(true);

    try {
      const cleanNumber = whatsapp.replace(/[^0-9]/g, '').replace(/^0+/, '');
      const fullWhatsappNumber = `+${countryCode}${cleanNumber}`;
      
      const userData = {
        full_name: fullName,
        whatsapp: fullWhatsappNumber,
        gender: gender,
        email: email,
        password: password,
          birthdate: birthdateForAPI,
      };

      console.log('SignUp userData:', userData);

      const response = await signUp(userData);

      // ✅ Response dari API: { status: true, data: { token } }
      if (response.status === true) {
        const token = response.data?.token;
        if (token) {
          setSignupToken(token);
          console.log('✅ Signup token saved:', token);
        }
        
        setShowOtpStep(true);
        setOtpTimer(240);
        setOtpCode(['', '', '', '']);
      } else {
        Alert.alert('Error', response.message || 'Failed to create account');
      }
    } catch (error) {
      console.error('SignUp error:', error);
      Alert.alert('Error', error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const requestLocationAndGet = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Aktifkan Lokasi',
        message: 'Kami butuh lokasi untuk menemukan orang di sekitar kamu',
        buttonPositive: 'Izinkan',
        buttonNegative: 'Tolak',
      }
    );

    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      console.log('❌ Lokasi ditolak');
      return null;
    }

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('📍 GPS:', latitude, longitude);
          resolve({ latitude, longitude });
        },
        (error) => {
          console.log('❌ GPS error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  } catch (err) {
    console.log(err);
    return null;
  }
};

const updateMerchantLocation = async (detailId, latitude, longitude) => {
  try {
    const url = `${DETAIL_BASE_URL}/user/update?id=${detailId}`;
    
    const response = await fetch(url, {
      method: 'PUT', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latitude: latitude,   // jika API menerima string
        longitude: longitude,
      }),
    });
    
    const result = await response.json();
    console.log('Merchant location update response:', result);
    
    if (response.ok) {
      console.log('✅ Lokasi merchant berhasil diperbarui');
    } else {
      console.warn('⚠️ Gagal update lokasi merchant:', result);
    }
  } catch (error) {
    console.error('❌ Error updating merchant location:', error);
  }
};

const handleVerifyOTP = async () => {
  const otpString = otpCode.join('');
  
  if (otpString.length !== 4) {
    Alert.alert('Error', 'Please enter the 4-digit verification code');
    return;
  }
  
  setIsVerifying(true);
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify?token=${signupToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp: otpString }),
    });
    
    const data = await response.json();
    console.log('Verify response:', data);
    
    if (data.status === true && data.data) {
      // ✅ Ambil detail_id dari response
      const detailIdFromResponse = data.data.detail_id;
      if (detailIdFromResponse) {
        setMerchantId(detailIdFromResponse);
      }
      
      // Simpan token dll
      const accessToken = data.data.access_token;
      const refreshToken = data.data.refresh_token;
      const userId = data.data.user_id;
      const fullName = data.data.full_name;
      
      if (accessToken && refreshToken) {
        await AsyncStorage.setItem('access_token', accessToken);
        await AsyncStorage.setItem('refresh_token', refreshToken);
        await AsyncStorage.setItem('user_id', userId);
        await AsyncStorage.setItem('user_name', fullName);
        await AsyncStorage.setItem('user_data', JSON.stringify({
          id: userId,
          full_name: fullName,
          email: email,
        }));
      }
      
      await webSocketService.connect(userId);
      
      // ✅ Minta lokasi setelah OTP sukses
      const location = await requestLocationAndGet();
      
      // ✅ Jika lokasi didapat dan detailId tersedia, update ke endpoint
      if (location && detailIdFromResponse) {
        await updateMerchantLocation(detailIdFromResponse, location.latitude, location.longitude);
      } else if (location && !detailIdFromResponse) {
        console.warn('⚠️ Merchant ID tidak ditemukan, lokasi tidak diupdate');
      }
      
      // ✅ Tampilkan dialog pilihan
      Alert.alert(
        'Aktifkan Lokasi',
        'Untuk menemukan teman di sekitar kamu, aktifkan lokasi ya',
        [
          { text: 'Nanti', onPress: () => navigation.replace('RoomList') },
          {
            text: 'Aktifkan',
            onPress: async () => {
              const newLocation = await requestLocationAndGet();
              if (newLocation && detailIdFromResponse) {
                await updateMerchantLocation(detailIdFromResponse, newLocation.latitude, newLocation.longitude);
              }
              navigation.replace('RoomList');
            }
          }
        ]
      );
    } else {
      Alert.alert('Error', data.message || 'Invalid verification code. Please try again.');
      setOtpCode(['', '', '', '']);
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    Alert.alert('Error', 'Failed to verify code. Please try again.');
  } finally {
    setIsVerifying(false);
  }
};

  // ✅ RESEND OTP HANDLER
  const handleResendOTP = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
        }),
      });
      
      const data = await response.json();
      
      if (data.status === true) {
        setOtpTimer(240);
        Alert.alert('Success', 'A new verification code has been sent to your email');
      } else {
        Alert.alert('Error', data.message || 'Failed to resend code');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', 'Failed to resend verification code');
    }
  };

  const openDatePicker = () => {
    setTempDate({
      day: birthDate.day || '1',
      month: birthDate.month || '1',
      year: birthDate.year || currentYear.toString(),
    });
    setShowDatePicker(true);
  };

  const confirmDate = () => {
    setBirthDate({
      day: tempDate.day,
      month: tempDate.month,
      year: tempDate.year,
    });
    setShowDatePicker(false);
  };

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  // Render step content
  const renderStepContent = () => {
    if (showOtpStep) {
      return (
        <OTPStep
          email={email}
          otpCode={otpCode}
          setOtpCode={setOtpCode}
          onResendOTP={handleResendOTP}
          isLoading={isVerifying}
          otpFocused={otpFocused}
          setOtpFocused={setOtpFocused}
          otpTranslateY={otpTranslateY}
          timer={otpTimer}
          setTimer={setOtpTimer}
        />
      );
    }
    
    switch(step) {
      case 1:
        return (
          <NameStep
            fullName={fullName}
            setFullName={setFullName}
            nameFocused={nameFocused}
            setNameFocused={setNameFocused}
            nameTranslateY={nameTranslateY}
          />
        );
      case 2:
        return (
          <BirthdayStep
            formatBirthDate={formatBirthDate}
            openDatePicker={openDatePicker}
            showDatePicker={showDatePicker}
          />
        );
      case 3:
        return (
          <GenderStep
            gender={gender}
            setGender={setGender}
            genderFocused={genderFocused}
            setGenderFocused={setGenderFocused}
            genderTranslateY={genderTranslateY}
          />
        );
      case 4:
        return (
          <WhatsAppStep
            whatsapp={whatsapp}
            setWhatsapp={setWhatsapp}
            whatsappFocused={whatsappFocused}
            setWhatsappFocused={setWhatsappFocused}
            whatsappTranslateY={whatsappTranslateY}
            validateWhatsapp={validateWhatsapp}
            isFetchingLocation={isFetchingLocation}
            onGetLocation={() => {}}
            countryCode={countryCode ? `+${countryCode}` : null}
          />
        );
      case 5:
        return (
          <AccountStep
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            emailFocused={emailFocused}
            setEmailFocused={setEmailFocused}
            passwordFocused={passwordFocused}
            setPasswordFocused={setPasswordFocused}
            emailTranslateY={emailTranslateY}
            passwordTranslateY={passwordTranslateY}
            validateEmail={validateEmail}
            onSignUpSuccess={() => {}}
          />
        );
      default:
        return null;
    }
  };

  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B', '#0F172A']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.contentContainer,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <FloatingDecorations floatY={floatY} />

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonHeader}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            {!showOtpStep && <StepIndicator step={step} />}

            <View style={styles.formWrapper}>
              <Animated.View 
                style={[
                  styles.formContainer,
                  { opacity: formOpacity, transform: [{ translateX: formTranslateX }] }
                ]}
              >
                {renderStepContent()}
              </Animated.View>

              <NavigationButtons
                step={step}
                showOtpStep={showOtpStep}
                onBack={showOtpStep ? () => setShowOtpStep(false) : handleBack}
                onNext={showOtpStep ? handleVerifyOTP : (step === 5 ? handleSignUp : handleNext)}
                isLoading={showOtpStep ? isVerifying : isLoading}
                buttonScale={buttonScale}
                isLastStep={showOtpStep ? true : step === 5}
              />

              {!showOtpStep && (
                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.6}>
                    <Text style={styles.loginLink}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            <View style={styles.bottomSpacer} />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomDatePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onConfirm={confirmDate}
        tempDate={tempDate}
        setTempDate={setTempDate}
        months={months}
        years={years}
        getAvailableDays={getAvailableDays}
        getDaysInMonth={getDaysInMonth}
      />
    </LinearGradient>
  );
};

export default SignUp;