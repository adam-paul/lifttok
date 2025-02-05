import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as poseDetection from '@tensorflow-models/pose-detection';

// Initialize TensorFlow.js
export const initTensorFlow = async () => {
  try {
    await tf.ready();
    // Use WebGL backend for better performance
    await tf.setBackend('webgl');
    console.log('TensorFlow.js initialized with backend:', tf.getBackend());
    return true;
  } catch (error) {
    console.error('Failed to initialize TensorFlow.js:', error);
    return false;
  }
};

// Initialize pose detector with MoveNet
export const initPoseDetector = async () => {
  try {
    const model = poseDetection.SupportedModels.MoveNet;
    const detectorConfig = {
      modelType: poseDetection.movenet.modelType.THUNDER,
      enableSmoothing: true,
      trackerType: poseDetection.TrackerType.Keypoint,
      multiPoseMaxDimension: 256,
      enableTracking: true,
      scoreThreshold: 0.3
    };
    
    const detector = await poseDetection.createDetector(model, detectorConfig);
    console.log('Pose detector initialized with MoveNet Thunder');
    return detector;
  } catch (error) {
    console.error('Failed to initialize pose detector:', error);
    return null;
  }
};

// Configuration for pose detection
export const POSE_CONFIG = {
  scoreThreshold: 0.3,
  maxPoses: 1,
  flipHorizontal: false
}; 