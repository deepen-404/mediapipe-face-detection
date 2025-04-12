// utils/FaceDetectionHelpers.ts
import { Results, NormalizedLandmark } from '@mediapipe/face_mesh';
import { RefObject } from 'react';
import { FACE_DETECTION_KEY_POINTS } from '../constants/FaceDetection';
import { FaceDetectionStats } from '../types/FaceDetection.types';

function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  canvasWidth: number,
  canvasHeight: number
): void {
  ctx.fillStyle = '#00FF00';
  FACE_DETECTION_KEY_POINTS.forEach((point) => {
    const landmark = landmarks[point];
    ctx.beginPath();
    ctx.arc(
      landmark.x * canvasWidth,
      landmark.y * canvasHeight,
      2,
      0,
      2 * Math.PI
    );
    ctx.fill();
  });
}

function updateStats(
  stats: FaceDetectionStats,
  setStats: React.Dispatch<React.SetStateAction<FaceDetectionStats | null>>
): void {
  setStats(stats);
}

const calculateHeadAngle = (landmarks: NormalizedLandmark[]): number => {
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];

  return (
    Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI)
  );
};

export function onResults(
  results: Results,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  setStats: React.Dispatch<React.SetStateAction<FaceDetectionStats | null>>,
  isSharedCanvas: boolean = false
): void {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // If we're in shared canvas mode, don't clear or redraw the video
  // Otherwise, perform the standard clearing and video drawing
  if (!isSharedCanvas) {
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
  }

  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    const activeFaces = results.multiFaceLandmarks.length;

    results.multiFaceLandmarks.forEach((landmarks) => {
      drawLandmarks(ctx, landmarks, canvas.width, canvas.height);
      const headAngle = calculateHeadAngle(landmarks);
      updateStats({ facesDetected: activeFaces, headAngle }, setStats);
    });
  } else {
    // Update with zero faces when none are detected
    updateStats({ facesDetected: 0, headAngle: 0 }, setStats);
  }

  if (!isSharedCanvas) {
    ctx.restore();
  }
}
