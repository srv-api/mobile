import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../../../styles/signupStyles';

const StepIndicator = ({ step }) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.stepIndicator}>
        <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
        <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
        <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
        <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
        <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]} />
        <View style={[styles.stepLine, step >= 4 && styles.stepLineActive]} />
        <View style={[styles.stepDot, step >= 4 && styles.stepDotActive]} />
        <View style={[styles.stepLine, step >= 5 && styles.stepLineActive]} />
        <View style={[styles.stepDot, step >= 5 && styles.stepDotActive]} />
      </View>
      <Text style={styles.stepText}>Step {step} of 5</Text>
    </View>
  );
};

export default StepIndicator;