export const OBJECT_DETECTION_DEFAULT_CONFIG = {
  width: 640,
  height: 480,
  scoreThreshold: 0.5,
  maxResults: 5,
  delegate: 'GPU',
  modelAssetPath:
    'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite',
} as const;

export const COCO_CLASSES = ['cell phone', 'laptop', 'book'] as const;
