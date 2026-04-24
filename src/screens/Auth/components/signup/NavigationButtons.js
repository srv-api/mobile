import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { styles } from '../../../styles/signupStyles';

const NavigationButtons = ({ 
  step, 
  onBack, 
  onNext, 
  isLoading, 
  buttonScale,
  isLastStep 
}) => {
  return (
    <View style={styles.buttonContainer}>
      {step > 1 && (
        <TouchableOpacity
          style={styles.backButtonForm}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonFormText}>Back</Text>
        </TouchableOpacity>
      )}
      
      <Animated.View style={{ flex: 1, transform: [{ scale: buttonScale }] }}>
        <TouchableOpacity
          style={[styles.nextButton, step === 1 && styles.fullWidthButton]}
          onPress={onNext}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FF6B6B', '#FF8E53']}
            style={styles.nextGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.nextButtonText}>
                {isLastStep ? 'Create Account' : 'Next'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default NavigationButtons;