// src/components/VideoPlayer.js
import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function VideoPlayer({ uri, isActive, onPress }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    // Control playback based on isActive prop
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.playAsync();
      } else {
        videoRef.current.pauseAsync();
      }
    }
  }, [isActive]);

  const loadVideo = async () => {
    try {
      if (videoRef.current) {
        await videoRef.current.loadAsync(
          { uri },
          { shouldPlay: false, isLooping: true },
          false
        );
      }
    } catch (err) {
      console.error('Error loading video:', err);
      setError(err);
    }
  };

  useEffect(() => {
    loadVideo();
    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync();
      }
    };
  }, [uri]);

  const handlePlaybackStatusUpdate = (status) => {
    setStatus(status);
    if (status.error) {
      console.error('Playback error:', status.error);
      setError(status.error);
    }
  };

  const retryLoading = () => {
    setError(null);
    loadVideo();
  };

  if (!uri) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>No video URL provided</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Video 
        ref={videoRef}
        source={{ uri }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={false}
        isLooping={true}
        useNativeControls={false}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onError={(error) => {
          console.error('Video error:', error);
          setError(error);
        }}
        isMuted={false}
        volume={1.0}
      />
      
      {/* Show loading indicator only while video is loading initially */}
      {(!status.isLoaded && !error) && (
        <View style={[styles.overlay, styles.centered]}>
          <ActivityIndicator color="#fff" size="large" />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      )}

      {/* Show play icon overlay when paused */}
      {status.isLoaded && !isActive && (
        <View style={[styles.overlay, styles.centered, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]}>
          <MaterialCommunityIcons name="play-circle-outline" size={60} color="#fff" />
        </View>
      )}

      {/* Show error message with retry button if video fails to load */}
      {error && (
        <View style={[styles.overlay, styles.centered]}>
          <Text style={styles.errorText}>Failed to load video</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={retryLoading}
          >
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 400,
    backgroundColor: 'black',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 10,
  },
  retryButton: {
    backgroundColor: '#4a9eff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
  },
});

