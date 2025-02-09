import { useEffect, useRef, useState } from 'react';
import { FaceDetectionStats } from '../types/MediaPipe.types';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { onResults } from '../utils/MediaPipeHelpers';

export function useMediaPipeFaceDetection({
  maxFaces,
  minDetectionConfidence,
  minTrackingConfidence,
  width,
  height,
}: {
  maxFaces: number;
  minDetectionConfidence: number;
  minTrackingConfidence: number;
  width: number;
  height: number;
}) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<FaceDetectionStats | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    setLoading(true);

    faceMeshRef.current = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    const faceMesh = faceMeshRef.current;
    faceMesh.setOptions({
      maxNumFaces: maxFaces,
      minDetectionConfidence,
      minTrackingConfidence,
      refineLandmarks: false,
    });

    faceMesh.onResults((results) => {
      onResults(results, canvasRef, setStats);
      setLoading(false);
    });

    cameraRef.current = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current && faceMesh) {
          await faceMesh.send({ image: videoRef.current });
        }
      },
      width,
      height,
    });

    cameraRef.current.start();

    return () => {
      cameraRef.current?.stop();
      faceMeshRef.current?.close();
    };
  }, [width, height, maxFaces, minDetectionConfidence, minTrackingConfidence]);

  return {
    loading,
    stats,
    videoRef,
    canvasRef,
    cameraRef,
    faceMeshRef,
  };
}
