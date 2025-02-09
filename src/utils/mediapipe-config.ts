import { Pose } from '@mediapipe/pose';
import type { Frame } from 'react-native-vision-camera';

// Types for pose detection results
export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseDetectionResult {
  landmarks: PoseLandmark[];
  worldLandmarks: PoseLandmark[];
  poseScore: number;
}

// MediaPipe configuration
const POSE_CONFIG = {
  modelComplexity: 1 as 0 | 1 | 2,
  smoothLandmarks: true,
  enableSegmentation: false,
  smoothSegmentation: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
};

// Initialize MediaPipe Pose
export const initializePoseDetection = async (): Promise<{ 
  success: boolean; 
  pose?: Pose; 
  error?: Error; 
}> => {
  try {
    const pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });

    await pose.initialize();
    await pose.setOptions(POSE_CONFIG);

    return { success: true, pose };
  } catch (error) {
    console.error('MediaPipe initialization failed:', error);
    return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
  }
};

// Utility function to transform pose data to match existing interface
export const transformPoseResults = (results: PoseDetectionResult) => {
  if (!results.landmarks?.length) return null;

  return {
    pose: results.landmarks.map((landmark) => ({
      x: landmark.x,
      y: landmark.y,
      z: landmark.z,
      visibility: landmark.visibility ?? 0,
    })),
    score: results.poseScore,
  };
};

// Memory management utility
export const cleanupPoseDetection = (pose: Pose | undefined) => {
  try {
    pose?.close();
  } catch (error) {
    console.error('Error cleaning up pose detection:', error);
  }
}; 