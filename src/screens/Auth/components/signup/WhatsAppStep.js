// src/screens/Auth/components/signup/WhatsAppStep.js
import React from 'react';
import { View, Text, TextInput, ActivityIndicator, Animated } from 'react-native';
import { styles } from '../../../styles/signupStyles';

const WhatsAppStep = ({ 
  whatsapp, 
  setWhatsapp, 
  whatsappFocused, 
  setWhatsappFocused,
  whatsappTranslateY,
  validateWhatsapp,
  isFetchingLocation,
  countryCode
}) => {
  // Format nomor telepon (hanya angka)
  const formatPhoneNumber = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length <= 15) {
      setWhatsapp(cleaned);
    }
  };

  return (
    <>
      <Text style={styles.title}>WhatsApp Number</Text>
      <Text style={styles.subtitle}>We'll use this to verify your account</Text>
      
      {/* Loading indicator saat deteksi lokasi */}
      {isFetchingLocation && (
        <View style={styles.detectingContainer}>
          <ActivityIndicator color="#FF8E53" size="small" />
          <Text style={styles.detectingText}>Detecting your country...</Text>
        </View>
      )}

      <View style={styles.inputGroup}>
        <Animated.Text style={[
          styles.label,
          whatsappFocused && styles.labelFocused,
          { transform: [{ translateY: whatsappTranslateY }] }
        ]}>
          WhatsApp Number
        </Animated.Text>
        
        <View style={styles.phoneInputContainer}>
          {/* Menampilkan Kode Negara jika sudah terdeteksi */}
          {countryCode && !isFetchingLocation && (
            <View style={styles.countryCodeContainer}>
              <Text style={styles.countryCodeText}>{countryCode}</Text>
            </View>
          )}
          
          <View style={[
            styles.inputWrapper,
            countryCode && styles.inputWrapperWithCountryCode,
            whatsappFocused && styles.inputWrapperFocused
          ]}>
            <TextInput
              style={styles.input}
              placeholder="812 3456 7890"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={whatsapp}
              onChangeText={formatPhoneNumber}
              onFocus={() => setWhatsappFocused(true)}
              onBlur={() => setWhatsappFocused(false)}
              keyboardType="phone-pad"
              editable={!isFetchingLocation}
            />
            {whatsapp.length > 0 && validateWhatsapp(whatsapp) && (
              <View style={styles.validIcon}>
                <Text style={styles.validIconText}>✓</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Preview nomor lengkap */}
        {countryCode && whatsapp.length > 0 && !isFetchingLocation && (
          <Text style={styles.fullNumberPreview}>
            Full number: {countryCode}{whatsapp.replace(/^0+/, '')}
          </Text>
        )}
      </View>
      
      <Text style={styles.infoText}>
        We'll send a verification code to this WhatsApp number
      </Text>
    </>
  );
};

export default WhatsAppStep;