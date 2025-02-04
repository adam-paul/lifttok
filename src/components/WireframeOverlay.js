// src/components/WireframeOverlay.js
import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function WireframeOverlay() {
  return (
    <View pointerEvents="none" style={styles.overlay}>
      {/* Simple overlay wireframe for demonstration */}
      <View style={styles.horizontalLine} />
      <View style={styles.verticalLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalLine: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(0, 255, 0, 0.7)',
  },
  verticalLine: {
    position: 'absolute',
    height: '100%',
    width: 2,
    backgroundColor: 'rgba(0, 255, 0, 0.7)',
  },
});

