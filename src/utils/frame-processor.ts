import { VisionCameraProxy, Frame } from 'react-native-vision-camera';
import type { PoseDetectionResult } from './mediapipe-config';
import { runOnJS } from 'react-native-reanimated';
import { useSkiaFrameProcessor } from 'react-native-vision-camera/skia';
import type { SkCanvas, SkPoint } from '@shopify/react-native-skia';

// Register the frame processor plugin
const plugin = VisionCameraProxy.initFrameProcessorPlugin('poseDetection', {
  platforms: ['ios', 'android']
});

// Constants for visualization
const POINT_RADIUS = 4;
const LINE_WIDTH = 2;
const POINT_COLOR = '#FF0000';
const LINE_COLOR = '#00FF00';

// Pose connections for visualization
const POSE_CONNECTIONS = [
  // Torso
  [11, 12], // shoulders
  [11, 23], // left shoulder to left hip
  [12, 24], // right shoulder to right hip
  [23, 24], // hips
  // Left arm
  [11, 13], // shoulder to elbow
  [13, 15], // elbow to wrist
  // Right arm
  [12, 14], // shoulder to elbow
  [14, 16], // elbow to wrist
  // Left leg
  [23, 25], // hip to knee
  [25, 27], // knee to ankle
  // Right leg
  [24, 26], // hip to knee
  [26, 28], // knee to ankle
];

// Frame processor worklet
export function useMediaPipePoseProcessor() {
  return useSkiaFrameProcessor(
    (frame: Frame, canvas: SkCanvas) => {
      'worklet';
      // First render the camera frame
      frame.render();

      if (!plugin?.call) {
        console.error('Failed to load pose detection plugin');
        return;
      }

      try {
        // Process frame using MediaPipe pose detection
        const rawResults = plugin.call(frame);
        const results = rawResults as unknown as PoseDetectionResult;
        
        if (!results?.landmarks) {
          return;
        }

        // Transform coordinates to screen space
        const landmarks = results.landmarks.map(landmark => ({
          x: landmark.x * frame.width,
          y: landmark.y * frame.height,
          z: landmark.z,
          visibility: landmark.visibility ?? 0
        }));

        // Draw pose landmarks and connections
        const paint = canvas.makePaint();

        // Draw connections
        paint.setColor(LINE_COLOR);
        paint.setStrokeWidth(LINE_WIDTH);
        paint.setStyle('stroke');

        POSE_CONNECTIONS.forEach(([start, end]) => {
          const startPoint = landmarks[start];
          const endPoint = landmarks[end];

          if (startPoint.visibility > 0.5 && endPoint.visibility > 0.5) {
            const path = canvas.makePath();
            path.moveTo(startPoint.x, startPoint.y);
            path.lineTo(endPoint.x, endPoint.y);
            canvas.drawPath(path, paint);
          }
        });

        // Draw points
        paint.setColor(POINT_COLOR);
        paint.setStyle('fill');

        landmarks.forEach((landmark) => {
          if (landmark.visibility > 0.5) {
            canvas.drawCircle(landmark.x, landmark.y, POINT_RADIUS, paint);
          }
        });

      } catch (error) {
        runOnJS(console.error)('Pose detection error:', error);
      }
    },
    [/* dependencies */]
  );
}

// Export types for use in components
export type { PoseDetectionResult }; 