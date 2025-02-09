export const FACE_DETECTION_DEFAULT_CONFIG = {
  width: 640,
  height: 480,
  maxFaces: 10,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
} as const;

export const FACE_DETECTION_KEY_POINTS = [
  33, 133, 362, 263, 61, 291, 199,
] as const;
