// src/components/VideoPlayer.js
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Video from 'react-native-video';

export default function VideoPlayer({ uri }) {
  return (
    <View style={styles.container}>
      <Video 
        source={{ uri }}
        style={styles.video}
        resizeMode="cover"
        repeat
        paused={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 400,
    backgroundColor: 'black',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});

