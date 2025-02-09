import React, { memo } from 'react';
import { Canvas, Group, Path, Circle, Skia } from '@shopify/react-native-skia';
import { useWindowDimensions } from 'react-native';
import { usePoseContext } from '../contexts/PoseContext';
import { POSE_CONNECTIONS } from '../utils/pose-data';
import { useSharedValue, useDerivedValue } from 'react-native-reanimated';

// Constants for visualization
const POINT_RADIUS = 4;
const LINE_WIDTH = 2;
const POINT_COLOR = Skia.Color('#FF0000');
const LINE_COLOR = Skia.Color('#00FF00');
const MIN_VISIBILITY = 0.5;

export const PoseWireframe = memo(() => {
  const { width, height } = useWindowDimensions();
  const { poseState } = usePoseContext();

  // Create shared paint objects for better performance
  const pointPaint = useDerivedValue(() => {
    'worklet';
    return {
      color: POINT_COLOR,
      style: 'fill',
    };
  }, []);

  const linePaint = useDerivedValue(() => {
    'worklet';
    return {
      color: LINE_COLOR,
      strokeWidth: LINE_WIDTH,
      style: 'stroke',
    };
  }, []);

  // Memoize paths for connections
  const connectionPaths = useDerivedValue(() => {
    'worklet';
    if (!poseState.value.isValid) return [];

    return POSE_CONNECTIONS.map(([startIdx, endIdx]) => {
      const startPoint = poseState.value.landmarks[startIdx];
      const endPoint = poseState.value.landmarks[endIdx];

      if ((startPoint.visibility ?? 0) < MIN_VISIBILITY || (endPoint.visibility ?? 0) < MIN_VISIBILITY) {
        return null;
      }

      const path = Skia.Path.Make();
      path.moveTo(startPoint.x * width, startPoint.y * height);
      path.lineTo(endPoint.x * width, endPoint.y * height);
      return path;
    }).filter(Boolean);
  }, [poseState, width, height]);

  // Memoize landmark points
  const visibleLandmarks = useDerivedValue(() => {
    'worklet';
    if (!poseState.value.isValid) return [];

    return poseState.value.landmarks
      .map((landmark, index) => ({
        ...landmark,
        index,
      }))
      .filter(landmark => (landmark.visibility ?? 0) >= MIN_VISIBILITY);
  }, [poseState]);

  return (
    <Canvas style={{ position: 'absolute', width, height }}>
      <Group>
        {/* Draw connections */}
        {connectionPaths.value?.map((path, index) => (
          path && (
            <Path
              key={`connection-${index}`}
              path={path}
              color={LINE_COLOR}
              strokeWidth={LINE_WIDTH}
              style="stroke"
            />
          )
        ))}

        {/* Draw landmarks */}
        {visibleLandmarks.value.map((landmark) => (
          <Circle
            key={`landmark-${landmark.index}`}
            cx={landmark.x * width}
            cy={landmark.y * height}
            r={POINT_RADIUS}
            color={POINT_COLOR}
          />
        ))}
      </Group>
    </Canvas>
  );
});

PoseWireframe.displayName = 'PoseWireframe'; 