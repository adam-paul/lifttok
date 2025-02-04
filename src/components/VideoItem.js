// src/components/VideoItem.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import VideoPlayer from './VideoPlayer';

export default function VideoItem({ videoUri }) {
  return (
    <View style={styles.container}>
      <VideoPlayer uri={videoUri} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
});

