import type { Frame } from 'react-native-vision-camera';

declare global {
  // Declare the native C++/Objective-C frame processor function
  const __poseDetection: (frame: Frame) => {
    landmarks: Array<{
      x: number;
      y: number;
      z: number;
      visibility?: number;
    }>;
    worldLandmarks: Array<{
      x: number;
      y: number;
      z: number;
    }>;
    poseScore: number;
  } | null;
}

// Export the frame processor function for use in worklets
export const poseDetection = __poseDetection; 