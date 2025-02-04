// src/components/VideoRecorder.js
import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Camera } from 'expo-camera';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import WireframeOverlay from './WireframeOverlay';

export default function VideoRecorder({ onVideoUploaded }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  const handleRecord = async () => {
    if (!recording) {
      // Start recording
      setRecording(true);
      try {
        const videoRecordPromise = cameraRef.current.recordAsync({
          maxDuration: 30,
          quality: Camera.Constants.VideoQuality['480p'],
        });
        if (videoRecordPromise) {
          const data = await videoRecordPromise;
          setRecording(false);
          // Upload video
          await uploadVideo(data.uri);
        }
      } catch (error) {
        console.error(error);
        setRecording(false);
      }
    } else {
      // Stop recording
      cameraRef.current.stopRecording();
    }
  };

  const uploadVideo = async (uri) => {
    setUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = uri.split('/').pop();
      const storageRef = ref(storage, `videos/${filename}`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      setUploading(false);
      if (onVideoUploaded) {
        onVideoUploaded(downloadURL);
      }
    } catch (error) {
      console.error("Upload failed: ", error);
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} ref={cameraRef}>
        <WireframeOverlay />
      </Camera>
      <View style={styles.controls}>
        <TouchableOpacity onPress={handleRecord} style={styles.button}>
          {recording ? <Text style={styles.buttonText}>Stop</Text> : <Text style={styles.buttonText}>Record</Text>}
        </TouchableOpacity>
        {uploading && <ActivityIndicator size="small" color="#fff" />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    backgroundColor: 'red',
    padding: 20,
    borderRadius: 50,
    marginHorizontal: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

