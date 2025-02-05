// src/components/VideoRecorder.js
import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert, Linking } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { storage, db } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import WireframeOverlay from './WireframeOverlay';

export default function VideoRecorder({ onVideoUploaded }) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [facing, setFacing] = useState('back');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const cameraRef = useRef(null);
  const [isRecordingReady, setIsRecordingReady] = useState(false);
  const recordingPromiseRef = useRef(null);
  const recordingStartTimeRef = useRef(null);
  const [cameraStatus, setCameraStatus] = useState('initializing');

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    console.log('Requesting permissions...');
    const cameraResult = await requestCameraPermission();
    const micResult = await requestMicrophonePermission();
    console.log('Permission results:', {
      camera: cameraResult?.granted,
      microphone: micResult?.granted,
      cameraStatus: cameraResult?.status,
      microphoneStatus: micResult?.status
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

  if (!cameraPermission || !microphonePermission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.permissionText}>Requesting camera and microphone permissions...</Text>
      </View>
    );
  }

  if (!cameraPermission?.granted || !microphonePermission?.granted) {
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
        hasCameraRef: !!cameraRef.current,
        isRecording: recording,
        isReady: isRecordingReady,
        cameraStatus,
      });

      if (!cameraRef.current || recording || !isRecordingReady) {
        console.warn('Cannot start recording:', { 
          hasCameraRef: !!cameraRef.current, 
          isRecording: recording, 
          isReady: isRecordingReady,
          cameraStatus
        });
        return;
      }

      // Ensure we're not in a bad state
      if (recordingPromiseRef.current) {
        console.log('Cleaning up previous recording promise');
        recordingPromiseRef.current = null;
      }

      const videoFilePath = `${FileSystem.cacheDirectory}temp_video_${Date.now()}.mp4`;
      console.log('Video will be saved to:', videoFilePath);
      
      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(FileSystem.cacheDirectory);
      console.log('Cache directory status:', dirInfo);
      
      // Reset camera state before starting new recording
      try {
        await cameraRef.current.pausePreview();
        await new Promise(resolve => setTimeout(resolve, 100));
        await cameraRef.current.resumePreview();
        console.log('Camera preview reset completed');
      } catch (error) {
        console.warn('Preview reset error (non-fatal):', error);
      }

      recordingStartTimeRef.current = Date.now();

      // Start recording with simplified options
      console.log('Initiating recordAsync...');
      recordingPromiseRef.current = cameraRef.current.recordAsync({
        quality: '720p',
        maxDuration: 30,
        mute: false,
        // Remove custom Android settings that might be causing issues
        // androidOutputFormat: 'MPEG_4',
        // androidVideoEncoder: 'MPEG_4_SP',
        // androidAudioEncoder: 'AAC',
        // codec: 'mp4',
        // fileFormat: 'mp4'
      });

      console.log('Record async initiated, setting recording state...');
      setRecording(true);
      
      // Add promise state logging
      recordingPromiseRef.current.then(
        result => console.log('Recording promise resolved:', result),
        error => console.error('Recording promise rejected:', error)
      );

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert(
        'Recording Error',
        'Failed to start recording. Please try again.',
        [{ text: 'OK' }]
      );
      setRecording(false);
      recordingPromiseRef.current = null;
    }
  };

  const stopRecording = async () => {
    console.log('Attempting to stop recording...', {
      hasCameraRef: !!cameraRef.current,
      isRecording: recording,
      hasRecordingPromise: !!recordingPromiseRef.current,
      recordingDuration: Date.now() - (recordingStartTimeRef.current || 0),
      cameraStatus
    });

    if (!cameraRef.current || !recording || !recordingPromiseRef.current) {
      console.warn('Stop recording preconditions not met:', {
        hasCameraRef: !!cameraRef.current,
        isRecording: recording,
        hasRecordingPromise: !!recordingPromiseRef.current
      });
      return;
    }

    try {
      // Create a reference to the current recording promise
      const currentRecordingPromise = recordingPromiseRef.current;
      
      // Clear refs before stopping to prevent any race conditions
      recordingPromiseRef.current = null;
      recordingStartTimeRef.current = null;
      
      console.log('Calling stopRecording on camera...');
      await cameraRef.current.stopRecording();
      console.log('stopRecording call completed');
      
      // Small delay to ensure camera has time to finish
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Waiting for recording promise to resolve...');
      const result = await currentRecordingPromise;
      console.log('Recording result:', result);

      // Set recording state to false only after successful stop
      setRecording(false);

      if (result?.uri) {
        // Verify the file exists
        const fileInfo = await FileSystem.getInfoAsync(result.uri);
        console.log('Video file info:', fileInfo);
        
        if (fileInfo.exists && fileInfo.size > 0) {
          console.log('Video recorded successfully:', {
            uri: result.uri,
            size: fileInfo.size,
            modificationTime: fileInfo.modificationTime
          });
          await uploadVideo(result.uri);
        } else {
          throw new Error(`Video file invalid: ${JSON.stringify(fileInfo)}`);
        }
      } else {
        throw new Error('No video URI was produced');
      }
    } catch (error) {
      console.error('Error in stop recording process:', error);
      // Log the full error object
      console.error('Detailed error:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        ...error
      });
      Alert.alert(
        'Error',
        'Failed to stop recording. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setRecording(false);
    }
  };

  const uploadVideo = async (uri) => {
    setUploading(true);
    try {
      console.log('Starting video upload process...');
      const response = await fetch(uri);
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
        await FileSystem.deleteAsync(uri, { idempotent: true });
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
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode="video"
        onCameraReady={onCameraReady}
        onMountError={(error) => {
          console.error('Camera mount error:', error);
          setCameraStatus('mount-error');
        }}
        onError={(error) => {
          console.error('Camera error:', error);
          setCameraStatus('error');
        }}
        videoStabilizationMode="auto"
      >
        <WireframeOverlay />
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={recording ? stopRecording : startRecording}
          >
            <Text style={styles.buttonText}>
              {recording ? 'Stop Recording' : 'Start Recording'}
            </Text>
          </TouchableOpacity>
          {!recording && (
            <TouchableOpacity
              style={styles.button}
              onPress={toggleCameraType}
            >
              <Text style={styles.buttonText}>Flip Camera</Text>
            </TouchableOpacity>
          )}
        </View>
      </CameraView>
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
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    fontSize: 16,
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

