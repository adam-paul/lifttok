// src/components/VideoPlayer.js
import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

export default function VideoPlayer({ uri }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    // Reset state when URI changes
    setStatus({});
    setError(null);

    // Load the video when the component mounts or URI changes
    loadVideo();

    // Cleanup function to unload video when component unmounts
    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync();
      }
    };
  }, [uri]);

  const loadVideo = async () => {
    try {
      if (videoRef.current) {
        await videoRef.current.loadAsync(
          { uri },
          { shouldPlay: true, isLooping: true },
          false
        );
      }
    } catch (err) {
      console.error('Error loading video:', err);
      setError(err);
    }
  };

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
    <View style={styles.container}>
      <Video 
        ref={videoRef}
        source={{ uri }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={true}
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
    </View>
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

