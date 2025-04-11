import { Detection } from '@mediapipe/tasks-vision';

export interface ObjectDetectionStats {
  objectsDetected: number;
  detections: {
    category: string;
    score: number;
    boundingBox: {
      originX: number;
      originY: number;
      width: number;
      height: number;
    };
  }[];
}

export interface ObjectDetectionResult {
  detections: Detection[];
}
