// utils/ObjectDetectionHelpers.ts
import { ObjectDetector } from '@mediapipe/tasks-vision';
import { ObjectDetectionResult } from '../types/ObjectDetection.types';

export async function detectObjectsInImage(
  detector: ObjectDetector,
  image: HTMLImageElement
): Promise<ObjectDetectionResult> {
  return detector.detect(image);
}

export function drawImageDetections(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  result: ObjectDetectionResult
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set canvas dimensions to match image
  canvas.width = image.width;
  canvas.height = image.height;

  // Draw the image
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  // Draw detections
  if (result.detections) {
    for (const detection of result.detections) {
      // Draw bounding box
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        detection.boundingBox?.originX || 0,
        detection.boundingBox?.originY || 0,
        detection.boundingBox?.width || 0,
        detection.boundingBox?.height || 0
      );

      // Draw label
      ctx.fillStyle = '#00FF00';
      const text = `${detection.categories[0].categoryName} (${Math.round(
        detection.categories[0].score * 100
      )}%)`;
      const textWidth = ctx.measureText(text).width;
      ctx.fillRect(
        detection.boundingBox?.originX || 0,
        detection.boundingBox?.originY || 0 - 20,
        textWidth + 10,
        20
      );

      ctx.fillStyle = '#000000';
      ctx.font = '14px Arial';
      ctx.fillText(
        text,
        detection.boundingBox?.originX || 0 + 5,
        detection.boundingBox?.originY || 0 - 5
      );
    }
  }
}
