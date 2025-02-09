Example of MediaPipe Pose real-world 3D coordinates (source: https://google.github.io/mediapipe/solutions/pose)

Topology

Unlike the current standard in human gun pose processing, the COCO topology, which consists of 17 landmarks, BlazePose has the ability to place as many as 33 points, both on a person’s limbs (using a hand model) and the face itself. We can see the detailed set of points below:


Topology of observation points (source: https://ai.googleblog.com/2020/08/on-device-real-time-body-pose-tracking.html)
Method of operation
The pose detection is two-component: first the detector locates the so-called region of interest (ROI), in this case it will be a human located in the photo. Next, the landmarks are predicted. To speed up calculations, the first part is performed only on the first frame — for subsequent calculations, points from the previous one are used.


Pose detector (source: https://ai.googleblog.com/2020/08/on-device-real-time-body-pose-tracking.html)
Example of use
In this article, I would like to present an example of using MLKit for real-time pose detection in a React Native app using the Vision Camera library with the native frame processor for iOS.

Project configuration
The first step will be to create a new React Native application project. The version I am using is React Native 0.68.2. To create a new project we run the command:

npx react-native init posedetection

We also need to install the necessary libraries for the camera and animation:

yarn add react-native-vision-camera react-native-reanimated react-native-svg
npx pod-install

A necessary step for iOS is to add an entry in the Info.plist file:

<key>NSCameraUsageDescription</key>
<string>$(PRODUCT_NAME) needs access to your Camera.</string>

To install a library that enables pose detection, using CocoaPods packages, we add the following entry in the Podfile:


pod 'GoogleMLKit/PoseDetection', '3.1.0'

And then we execute the command:


npx pod-install

Creating a frame processor
In order to enable real-time use of the MLKit library in the Vision Camera library, it is necessary to create a native frame processor. To do this, let’s create a new PoseDetection.h file in the main project directory in Xcode with the header of our class that returns the recognized object.

#ifndef PoseDetection_h
#define PoseDetection_h

#include <Foundation/Foundation.h>
#import <UIKit/UIImage.h>
#import <CoreMedia/CMSampleBuffer.h>
#import <VisionCamera/Frame.h>

@interface PoseDetection: NSObject
+ (NSDictionary *)findPose:(Frame *)frame;
@end

#endif /* PoseDetection_h */

Next, we need to create a PoseDetection.m file, where our findPose function will be located.

#import <Foundation/Foundation.h>
#import "PoseDetection.h"

@implementation PoseDetection : NSObject

+ (NSDictionary *)findPose:(Frame *)frame {
  
}
@end

Let’s also create a helper function that returns the coordinates of the selected point (one of the previously described 33 landmarks):

+ (NSDictionary *)getLandmarkPosition:(MLKPoseLandmark *)landmark {
  MLKVision3DPoint *position = landmark.position;
  return @{
    @"x": [NSNumber numberWithDouble:position.x],
    @"y": [NSNumber numberWithDouble:position.y]
  };
}

Next, in the findPose function, let’s prepare a frame image and calculate the position of our object:


CMSampleBufferRef buffer = frame.buffer;
UIImageOrientation orientation = frame.orientation;

MLKPoseDetectorOptions *options = [[MLKPoseDetectorOptions alloc] init];
  options.detectorMode = MLKPoseDetectorModeStream;
  
MLKPoseDetector *poseDetector =
      [MLKPoseDetector poseDetectorWithOptions:options];

MLKVisionImage *image = [[MLKVisionImage alloc] initWithBuffer:buffer];
image.orientation = orientation;

NSError *error;
NSArray *poses = [poseDetector resultsInImage:image error:&error];

In case the detection function returns an error and in case no pose is detected, let’s return an empty object of type NSDictionary. If a pose is detected, return the selected coordinates:

if (error != nil) {
    // Error.
    return @{};
}
  
if (poses.count == 0) {
    // No pose detected.
    return @{};
}
  
for (MLKPose *pose in poses) {
    return @{
      @"leftShoulder": [self getLandmarkPosition:[pose landmarkOfType:MLKPoseLandmarkTypeLeftShoulder]],
      @"rightShoulder": [self getLandmarkPosition:[pose landmarkOfType:MLKPoseLandmarkTypeRightShoulder]],
      @"leftElbow": [self getLandmarkPosition:[pose landmarkOfType:MLKPoseLandmarkTypeLeftElbow]],
      @"rightElbow": [self getLandmarkPosition:[pose landmarkOfType:MLKPoseLandmarkTypeRightElbow]],
      @"leftWrist": [self getLandmarkPosition:[pose landmarkOfType:MLKPoseLandmarkTypeLeftWrist]],
      @"rightWrist": [self getLandmarkPosition:[pose landmarkOfType:MLKPoseLandmarkTypeRightWrist]],
      @"leftHip": [self getLandmarkPosition:[pose landmarkOfType:MLKPoseLandmarkTypeLeftHip]],
      @"rightHip": [self getLandmarkPosition:[pose landmarkOfType:MLKPoseLandmarkTypeRightHip]],
      @"leftKnee": [self getLandmarkPosition:[pose landmarkOfType:MLKPoseLandmarkTypeLeftKnee]],
      @"rightKnee": [self getLandmarkPosition:[pose landmarkOfType:MLKPoseLandmarkTypeRightKnee]],
      @"leftAnkle": [self getLandmarkPosition:[pose landmarkOfType:MLKPoseLandmarkTypeLeftAnkle]],
      @"rightAnkle": [self getLandmarkPosition:[pose landmarkOfType:MLKPoseLandmarkTypeRightAnkle]],
    };
}

The next step will be to create the PoseDetectionFrameProcessor.m file, which will be directly used by the Vision Camera library:


#import <Foundation/Foundation.h>
#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/Frame.h>
#import "PoseDetection.h"

@interface PoseDetectionFrameProcessor : NSObject
@end

@implementation PoseDetectionFrameProcessor

static inline id poseDetection(Frame* frame, NSArray* args) {
  CMSampleBufferRef buffer = frame.buffer;
  UIImageOrientation orientation = frame.orientation;
  
  return [PoseDetection findPose:frame];
}

VISION_EXPORT_FRAME_PROCESSOR(poseDetection)

@end

Our frame processor will be named poseDetection and will return an object of type NSDictionary (which will be converted to a regular object on the JavaScript side).

JavaScript-side support
To enable the use of the frame processor, we need to add the following element in the babel.config.js file:

plugins: [
    [
      'react-native-reanimated/plugin',
      {
        globals: ['__poseDetection'],
      },
    ],
],

Where __poseDetection is the name of the frame processor, preceded by two “_” characters.

Then, in the App.js file, let’s add a function to enable its use:

export function objectDetect(frame) {
  'worklet';
  return __poseDetection(frame);
}

To hold the calculated landmark positions, let’s use the useSharedValue hook from the react-native-reanimated library:

const defaultPose = {
  leftShoulder: {x: 0, y: 0},
  rightShoulder: {x: 0, y: 0},
  leftElbow: {x: 0, y: 0},
  rightElbow: {x: 0, y: 0},
  leftWrist: {x: 0, y: 0},
  rightWrist: {x: 0, y: 0},
  leftHip: {x: 0, y: 0},
  rightHip: {x: 0, y: 0},
  leftKnee: {x: 0, y: 0},
  rightKnee: {x: 0, y: 0},
  leftAnkle: {x: 0, y: 0},
  rightAnkle: {x: 0, y: 0},
};

const pose = useSharedValue(defaultPose);

Next, we need to calculate the coordinates of the lines between the landmarks:

const leftWristToElbowPosition = usePosition(pose, 'leftWrist', 'leftElbow');
const leftElbowToShoulderPosition = usePosition(pose, 'leftElbow', 'leftShoulder');
const leftShoulderToHipPosition = usePosition(pose, 'leftShoulder', 'leftHip');
const leftHipToKneePosition = usePosition(pose, 'leftHip', 'leftKnee');
const leftKneeToAnklePosition = usePosition(pose, 'leftKnee', 'leftAnkle');

const rightWristToElbowPosition = usePosition(pose, 'rightWrist', 'rightElbow');
const rightElbowToShoulderPosition = usePosition(pose, 'rightElbow', 'rightShoulder');
const rightShoulderToHipPosition = usePosition(pose, 'rightShoulder', 'rightHip');
const rightHipToKneePosition = usePosition(pose, 'rightHip', 'rightKnee');
const rightKneeToAnklePosition = usePosition(pose, 'rightKnee', 'rightAnkle');

const shoulderToShoulderPosition = usePosition(pose, 'leftShoulder', 'rightShoulder');
const hipToHipPosition = usePosition(pose, 'leftHip', 'rightHip');

usePosition is a hook that allows you to create a style used by the reanimated library:

const usePosition = (pose, valueName1, valueName2) => {
  return useAnimatedStyle(
    () => ({
      x1: pose.value[valueName1].x,
      y1: pose.value[valueName1].y,
      x2: pose.value[valueName2].x,
      y2: pose.value[valueName2].y,
    }),
    [pose],
  );
};

This way, we can later use them to display the lines on the screen. But first, let’s move on to the calculation of the needed landmarks. The code below is to use the native processor to calculate the position of the landmarks, and using the proportions from the user’s screen (the so-called xFactor and yFactor) to record the position of the landmarks on the user’s screen.

const dimensions = useWindowDimensions();

const frameProcessor = useFrameProcessor(frame => {
    'worklet';
    const poseObject = objectDetect(frame);
    
    const xFactor = dimensions.width / frame.width;
    const yFactor = dimensions.height / frame.height;
    
    const poseCopy = {
      leftShoulder: {x: 0, y: 0},
      rightShoulder: {x: 0, y: 0},
      leftElbow: {x: 0, y: 0},
      rightElbow: {x: 0, y: 0},
      leftWrist: {x: 0, y: 0},
      rightWrist: {x: 0, y: 0},
      leftHip: {x: 0, y: 0},
      rightHip: {x: 0, y: 0},
      leftKnee: {x: 0, y: 0},
      rightKnee: {x: 0, y: 0},
      leftAnkle: {x: 0, y: 0},
      rightAnkle: {x: 0, y: 0},
    };
    
    Object.keys(poseObject).forEach(v => {
      poseCopy[v] = {
        x: poseObject[v].x * xFactor,
        y: poseObject[v].y * yFactor,
      };
    });

    pose.value = poseCopy;
}, []);

In the return function of our App component, we return a <Camera /> component using our frameProcessor:

<Camera
    frameProcessor={frameProcessor}
    style={StyleSheet.absoluteFill}
    device={device}
    isActive={true}
    orientation="portrait"
    frameProcessorFps={15}
  />

To draw animated lines using the react-native-reanimated library, let’s use components from react-native-svg:

const AnimatedLine = Animated.createAnimatedComponent(Line);

//...

<Svg
    height={Dimensions.get('window').height}
    width={Dimensions.get('window').width}
    style={styles.linesContainer}>
    <AnimatedLine animatedProps={leftWristToElbowPosition} stroke="red" strokeWidth="2" />
    <AnimatedLine animatedProps={leftElbowToShoulderPosition} stroke="red" strokeWidth="2" />
    <AnimatedLine animatedProps={leftShoulderToHipPosition} stroke="red" strokeWidth="2" />
    <AnimatedLine animatedProps={leftHipToKneePosition} stroke="red" strokeWidth="2" />
    <AnimatedLine animatedProps={leftKneeToAnklePosition} stroke="red" strokeWidth="2" />
    <AnimatedLine animatedProps={rightWristToElbowPosition} stroke="red" strokeWidth="2" />
    <AnimatedLine animatedProps={rightElbowToShoulderPosition} stroke="red" strokeWidth="2" />
    <AnimatedLine animatedProps={rightShoulderToHipPosition} stroke="red" strokeWidth="2" />
    <AnimatedLine animatedProps={rightHipToKneePosition} stroke="red" strokeWidth="2" />
    <AnimatedLine animatedProps={rightKneeToAnklePosition} stroke="red" strokeWidth="2" />
    <AnimatedLine animatedProps={shoulderToShoulderPosition} stroke="red" strokeWidth="2" />
    <AnimatedLine animatedProps={hipToHipPosition} stroke="red" strokeWidth="2" />
</Svg>

Results
After all the steps, let’s check how our application works:


The result of the application
Summary
The use of human position detection, opens up extraordinary possibilities in the development of cross-platform mobile applications, and the ability to use off-the-shelf tools like MLKit, is a significant improvement.

The new fabric architecture and libraries like Vision Camera and Reanimated allow the creation of fast communication between native code and JavaScript code, which consequently leads to many new interesting applications and significant optimization of application performance.

Comments 


Inocêncio Cordeiro

Sep 9, 2022

Hi, this code run in android ?


Lukasz Kurant
Author

Sep 10, 2022

Unfortunately, only the part about JS. In the case of Android, it is necessary to prepare a frame processor directly in the native code (Java / Kotlin).