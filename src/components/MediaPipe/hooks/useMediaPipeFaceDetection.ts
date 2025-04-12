// hooks/useMediaPipeFaceDetection.ts
import { useEffect, useState, RefObject } from 'react';
import { FaceDetectionStats } from '../types/FaceDetection.types';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { onResults } from '../utils/FaceDetectionHelpers';

export function useMediaPipeFaceDetection({
  maxFaces,
  minDetectionConfidence,
  minTrackingConfidence,
  width,
  height,
  videoRef,
  canvasRef,
  enabled = true,
  isSharedCanvas = false,
}: {
  maxFaces: number;
  minDetectionConfidence: number;
  minTrackingConfidence: number;
  width: number;
  height: number;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  enabled?: boolean;
  isSharedCanvas?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<FaceDetectionStats | null>(null);
  const [camera, setCamera] = useState<Camera | null>(null);
  const [faceMesh, setFaceMesh] = useState<FaceMesh | null>(null);

  useEffect(() => {
    if (!videoRef.current || !enabled) return;

    setLoading(true);

    // Initialize FaceMesh
    const faceMeshInstance = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    faceMeshInstance.setOptions({
      maxNumFaces: maxFaces,
      minDetectionConfidence,
      minTrackingConfidence,
      refineLandmarks: false,
    });

    faceMeshInstance.onResults((results) => {
      // Pass the shared canvas flag to onResults
      onResults(results, canvasRef, setStats, isSharedCanvas);
      setLoading(false);
    });

    setFaceMesh(faceMeshInstance);

    // Initialize Camera
    const cameraInstance = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current && faceMeshInstance) {
          await faceMeshInstance.send({ image: videoRef.current });
        }
      },
      width,
      height,
    });

    cameraInstance.start();
    setCamera(cameraInstance);

    return () => {
      cameraInstance?.stop();
      faceMeshInstance?.close();
    };
  }, [
    videoRef,
    canvasRef,
    width,
    height,
    maxFaces,
    minDetectionConfidence,
    minTrackingConfidence,
    enabled,
    isSharedCanvas,
  ]);

  return {
    loading,
    stats,
    camera,
    faceMesh,
  };
}
