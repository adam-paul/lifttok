// src/components/VideoRecorder.js
import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert, Linking } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';
import * as FileSystem from 'expo-file-system';
import { storage, db } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import WireframeOverlay from './WireframeOverlay';

export default function VideoRecorder({ onVideoUploaded }) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const {hasPermission: hasCameraPermission, requestPermission: requestCameraPermission} = useCameraPermission();
  const {hasPermission: hasMicPermission, requestPermission: requestMicPermission} = useMicrophonePermission();
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const device = useCameraDevice(isFrontCamera ? 'front' : 'back');
  const camera = useRef(null);
  const [isRecordingReady, setIsRecordingReady] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('initializing');

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    console.log('Requesting permissions...');
    const cameraResult = await requestCameraPermission();
    const micResult = await requestMicPermission();
    console.log('Permission results:', {
      camera: cameraResult,
      microphone: micResult
    });
  };

  const openSettings = () => {
    Linking.openSettings();
  };

  const onCameraReady = () => {
    console.log('Camera ready event fired');
    setCameraStatus('ready');
    setIsRecordingReady(true);
  };

  if (!hasCameraPermission || !hasMicPermission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.permissionText}>Requesting camera and microphone permissions...</Text>
      </View>
    );
  }

  if (!hasCameraPermission || !hasMicPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Camera and microphone access is required to record videos
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
          <Text style={styles.permissionButtonText}>Request Permissions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.permissionButton, { marginTop: 10 }]} onPress={openSettings}>
          <Text style={styles.permissionButtonText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const startRecording = async () => {
    try {
      console.log('Starting recording...', {
        hasCamera: !!camera.current,
        isRecording: recording,
        isReady: isRecordingReady,
        cameraStatus,
      });

      if (!camera.current || recording || !isRecordingReady) {
        console.warn('Cannot start recording:', { 
          hasCamera: !!camera.current, 
          isRecording: recording, 
          isReady: isRecordingReady,
          cameraStatus
        });
        return;
      }

      await camera.current.startRecording({
        flash: 'off',
        fileType: 'mp4',
        onRecordingFinished: (video) => {
          console.log('Recording finished:', video);
          uploadVideo(video.path);
        },
        onRecordingError: (error) => {
          console.error('Recording failed:', error);
          Alert.alert(
            'Recording Error',
            'Failed to record video. Please try again.',
            [{ text: 'OK' }]
          );
          setRecording(false);
        },
      });

      setRecording(true);

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert(
        'Recording Error',
        'Failed to start recording. Please try again.',
        [{ text: 'OK' }]
      );
      setRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!camera.current || !recording) {
      console.warn('Stop recording preconditions not met:', {
        hasCamera: !!camera.current,
        isRecording: recording
      });
      return;
    }

    try {
      console.log('Stopping recording...');
      await camera.current.stopRecording();
      setRecording(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert(
        'Error',
        'Failed to stop recording. Please try again.',
        [{ text: 'OK' }]
      );
      setRecording(false);
    }
  };

  const uploadVideo = async (uri) => {
    setUploading(true);
    try {
      console.log('Starting video upload process with uri:', uri);
      
      // For react-native-vision-camera, we need to prefix the path with file://
      const fileUri = uri.startsWith('file://') ? uri : `file://${uri}`;
      console.log('Formatted file URI:', fileUri);
      
      const response = await fetch(fileUri);
      const blob = await response.blob();
      const filename = `video_${Date.now()}.mp4`;
      const storageRef = ref(storage, `videos/${filename}`);
      
      // Upload to Storage
      console.log('Uploading to Firebase Storage...');
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Create Firestore document
      console.log('Creating Firestore document...');
      const videoDoc = await addDoc(collection(db, 'videos'), {
        videoUrl: downloadURL,
        filename: filename,
        timestamp: serverTimestamp(),
        userId: 'anonymous', // Replace with actual user ID when auth is implemented
        description: 'Workout video', // Add proper description input later
      });
      
      console.log('Video document created with ID:', videoDoc.id);
      
      if (onVideoUploaded) {
        onVideoUploaded(downloadURL);
      }

      // Clean up the temporary file
      try {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } catch (cleanupError) {
        console.error('Error cleaning up temporary file:', cleanupError);
      }

      Alert.alert(
        'Success',
        'Video uploaded successfully!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error uploading video:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      Alert.alert(
        'Upload Error',
        'Failed to upload video. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setUploading(false);
    }
  };

  const toggleCameraType = () => {
    setIsFrontCamera(prev => !prev);
  };

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={styles.camera}
        device={device}
        isActive={true}
        video={true}
        audio={true}
        onError={(error) => {
          console.error('Camera error:', error.code, error.message);
          setCameraStatus('error');
        }}
        onInitialized={onCameraReady}
        videoStabilizationMode="standard"
      />
      <View style={styles.controlsContainer}>
        {!recording && (
          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraType}
          >
            <MaterialCommunityIcons name="camera-flip-outline" size={30} color="#fff" />
          </TouchableOpacity>
        )}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.recordButton, recording && styles.recordingButton]}
            onPress={recording ? stopRecording : startRecording}
          >
            <View style={[styles.recordButtonInner, recording && styles.recordingButtonInner]} />
          </TouchableOpacity>
        </View>
      </View>
      <WireframeOverlay />
      {uploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.uploadingText}>Uploading video...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  controlsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ff4040',
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff4040',
  },
  recordingButton: {
    borderColor: '#ff4040',
  },
  recordingButtonInner: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#ff4040',
  },
  flipButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#4444ff',
    padding: 15,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  }
});