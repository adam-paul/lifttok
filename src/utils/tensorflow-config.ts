import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as poseDetection from '@tensorflow-models/pose-detection';

// Configure memory management settings
tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
tf.env().set('WEBGL_FLUSH_THRESHOLD', 0);

export const initTensorFlow = async () => {
  try {
    // Initialize TensorFlow backend
    await tf.ready();
    await tf.setBackend('rn-webgl');
    
    // Initialize pose detection model (MoveNet Lightning)
    const model = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
        trackerType: poseDetection.TrackerType.BoundingBox,
      }
    );

    return { success: true, model };
  } catch (error) {
    console.error('TensorFlow initialization failed:', error);
    return { success: false, error };
  }
};

// Utility function to cleanup tensors
export const cleanupTensors = () => {
  try {
    tf.disposeVariables();
    tf.engine().endScope();
    tf.engine().startScope();
  } catch (error) {
    console.error('Tensor cleanup failed:', error);
  }
};

// Memory management monitoring (development only)
if (__DEV__) {
  tf.engine().registerBackend('rn-webgl', () => {
    return tf.backend();
  }, 3 /* priority */);
  
  setInterval(() => {
    console.log('Memory state:', tf.memory());
  }, 10000);
} 