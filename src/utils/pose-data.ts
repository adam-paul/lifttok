import { useSharedValue, SharedValue } from 'react-native-reanimated';
import type { PoseDetectionResult, PoseLandmark } from './mediapipe-config';

// MediaPipe BlazePose 33 points mapping
export enum PoseLandmarkIndex {
  NOSE = 0,
  LEFT_EYE_INNER = 1,
  LEFT_EYE = 2,
  LEFT_EYE_OUTER = 3,
  RIGHT_EYE_INNER = 4,
  RIGHT_EYE = 5,
  RIGHT_EYE_OUTER = 6,
  LEFT_EAR = 7,
  RIGHT_EAR = 8,
  MOUTH_LEFT = 9,
  MOUTH_RIGHT = 10,
  LEFT_SHOULDER = 11,
  RIGHT_SHOULDER = 12,
  LEFT_ELBOW = 13,
  RIGHT_ELBOW = 14,
  LEFT_WRIST = 15,
  RIGHT_WRIST = 16,
  LEFT_PINKY = 17,
  RIGHT_PINKY = 18,
  LEFT_INDEX = 19,
  RIGHT_INDEX = 20,
  LEFT_THUMB = 21,
  RIGHT_THUMB = 22,
  LEFT_HIP = 23,
  RIGHT_HIP = 24,
  LEFT_KNEE = 25,
  RIGHT_KNEE = 26,
  LEFT_ANKLE = 27,
  RIGHT_ANKLE = 28,
  LEFT_HEEL = 29,
  RIGHT_HEEL = 30,
  LEFT_FOOT_INDEX = 31,
  RIGHT_FOOT_INDEX = 32,
}

// Pose connections for visualization
export const POSE_CONNECTIONS = [
  // Face
  [PoseLandmarkIndex.LEFT_EYE_INNER, PoseLandmarkIndex.LEFT_EYE],
  [PoseLandmarkIndex.LEFT_EYE, PoseLandmarkIndex.LEFT_EYE_OUTER],
  [PoseLandmarkIndex.RIGHT_EYE_INNER, PoseLandmarkIndex.RIGHT_EYE],
  [PoseLandmarkIndex.RIGHT_EYE, PoseLandmarkIndex.RIGHT_EYE_OUTER],
  // Upper body
  [PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.RIGHT_SHOULDER],
  [PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.LEFT_ELBOW],
  [PoseLandmarkIndex.RIGHT_SHOULDER, PoseLandmarkIndex.RIGHT_ELBOW],
  [PoseLandmarkIndex.LEFT_ELBOW, PoseLandmarkIndex.LEFT_WRIST],
  [PoseLandmarkIndex.RIGHT_ELBOW, PoseLandmarkIndex.RIGHT_WRIST],
  // Lower body
  [PoseLandmarkIndex.LEFT_HIP, PoseLandmarkIndex.RIGHT_HIP],
  [PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.LEFT_HIP],
  [PoseLandmarkIndex.RIGHT_SHOULDER, PoseLandmarkIndex.RIGHT_HIP],
  [PoseLandmarkIndex.LEFT_HIP, PoseLandmarkIndex.LEFT_KNEE],
  [PoseLandmarkIndex.RIGHT_HIP, PoseLandmarkIndex.RIGHT_KNEE],
  [PoseLandmarkIndex.LEFT_KNEE, PoseLandmarkIndex.LEFT_ANKLE],
  [PoseLandmarkIndex.RIGHT_KNEE, PoseLandmarkIndex.RIGHT_ANKLE],
  // Feet
  [PoseLandmarkIndex.LEFT_ANKLE, PoseLandmarkIndex.LEFT_HEEL],
  [PoseLandmarkIndex.RIGHT_ANKLE, PoseLandmarkIndex.RIGHT_HEEL],
  [PoseLandmarkIndex.LEFT_HEEL, PoseLandmarkIndex.LEFT_FOOT_INDEX],
  [PoseLandmarkIndex.RIGHT_HEEL, PoseLandmarkIndex.RIGHT_FOOT_INDEX],
];

// Types for pose data management
export interface PoseState {
  landmarks: PoseLandmark[];
  score: number;
  isValid: boolean;
}

export interface UsePoseDataResult {
  poseState: SharedValue<PoseState>;
  updatePose: (results: PoseDetectionResult | null) => void;
  resetPose: () => void;
}

// Default pose state
const DEFAULT_POSE_STATE: PoseState = {
  landmarks: Array(33).fill({ x: 0, y: 0, z: 0, visibility: 0 }),
  score: 0,
  isValid: false,
};

// Minimum confidence threshold for valid pose
const POSE_CONFIDENCE_THRESHOLD = 0.5;

// Hook for managing pose data with shared values
export function usePoseData(): UsePoseDataResult {
  const poseState = useSharedValue<PoseState>(DEFAULT_POSE_STATE);

  const updatePose = (results: PoseDetectionResult | null) => {
    'worklet';
    if (!results?.landmarks || !results.poseScore) {
      poseState.value = { ...DEFAULT_POSE_STATE };
      return;
    }

    poseState.value = {
      landmarks: results.landmarks,
      score: results.poseScore,
      isValid: results.poseScore >= POSE_CONFIDENCE_THRESHOLD,
    };
  };

  const resetPose = () => {
    'worklet';
    poseState.value = { ...DEFAULT_POSE_STATE };
  };

  return {
    poseState,
    updatePose,
    resetPose,
  };
} 