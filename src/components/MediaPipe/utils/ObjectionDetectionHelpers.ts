// utils/ObjectDetectionHelpers.ts
import { RefObject } from 'react';
import {
  ObjectDetectionResult,
  ObjectDetectionStats,
} from '../types/ObjectDetection.types';
import { CanvasManager } from './CanvasManager';

export function drawDetections(
  result: ObjectDetectionResult,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  videoRef: RefObject<HTMLVideoElement | null>,
  setStats: React.Dispatch<React.SetStateAction<ObjectDetectionStats | null>>,
  isSharedCanvas: boolean = false
): void {
  if (!result.detections) return;

  const canvas = canvasRef.current;
  const video = videoRef.current;
  if (!canvas || !video) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Create canvas manager to handle shared canvas operations
  try {
    const canvasManager = new CanvasManager(canvasRef, videoRef);

    // Only clear and draw video if not in shared canvas mode
    if (!isSharedCanvas) {
      canvasManager.prepare({ clearCanvas: true, drawVideo: true });
    }

    // Prepare stats object
    const stats: ObjectDetectionStats = {
      objectsDetected: result.detections.length,
      detections: result.detections.map((detection) => ({
        category: detection.categories[0]?.categoryName || 'unknown',
        score: detection.categories[0]?.score || 0,
        boundingBox: {
          originX: detection.boundingBox?.originX || 0,
          originY: detection.boundingBox?.originY || 0,
          width: detection.boundingBox?.width || 0,
          height: detection.boundingBox?.height || 0,
        },
      })),
    };

    // Update stats
    setStats(stats);

    // Draw the detections
    for (const detection of result.detections) {
      if (!detection.boundingBox) continue;

      const { originX, originY, width, height } = detection.boundingBox;
      const category = detection.categories[0]?.categoryName || 'unknown';
      const score = detection.categories[0]?.score || 0;

      // Draw bounding box
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 2;
      ctx.strokeRect(originX, originY, width, height);

      // Draw label background
      ctx.fillStyle = '#00FF00';
      const text = `${category} (${Math.round(score * 100)}%)`;
      const textWidth = ctx.measureText(text).width;
      ctx.fillRect(originX, originY - 20, textWidth + 10, 20);

      // Draw label text
      ctx.fillStyle = '#000000';
      ctx.font = '14px Arial';
      ctx.fillText(text, originX + 5, originY - 5);
    }
  } catch (error) {
    console.error('Error drawing detections:', error);
  }
}
