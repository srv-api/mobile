import React from 'react';
import { Animated } from 'react-native';
import { styles } from '../../../styles/signupStyles';

const FloatingDecorations = ({ floatY }) => {
  return (
    <>
      <Animated.View style={[styles.floatingCircle1, { transform: [{ translateY: floatY }] }]} />
      <Animated.View style={[styles.floatingCircle2, { transform: [{ translateY: floatY }] }]} />
      <Animated.View style={[styles.floatingCircle3, { transform: [{ translateY: floatY }] }]} />
    </>
  );
};

export default FloatingDecorations;