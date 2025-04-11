// hooks/useMediaPipeObjectDetection.ts
import { useEffect, useRef, useState } from 'react';
import { ObjectDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import {
  ObjectDetectionResult,
  ObjectDetectionStats,
} from '../types/ObjectDetection.types';

export function useMediaPipeObjectDetection({
  width,
  height,
  scoreThreshold,
  maxResults,
  delegate,
  modelAssetPath,
}: {
  width: number;
  height: number;
  scoreThreshold: number;
  maxResults: number;
  delegate: 'CPU' | 'GPU';
  modelAssetPath: string;
}) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ObjectDetectionStats | null>(null);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const objectDetectorRef = useRef<ObjectDetector | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const animationFrameRef = useRef<number>(0);

  // console.log('value of stats: ', stats);
  // console.log('value of webcamEnabled: ', webcamEnabled);
  // console.log('value of videoRef: ', videoRef);
  // console.log('value of canvasRef: ', canvasRef);
  // console.log('value of objectDetectorRef: ', objectDetectorRef);
  // console.log('value of lastVideoTimeRef: ', lastVideoTimeRef);
  // console.log('value of animationFrameRef: ', animationFrameRef);

  useEffect(() => {
    const initializeDetector = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        objectDetectorRef.current = await ObjectDetector.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath,
              delegate,
            },
            scoreThreshold,
            maxResults,
            runningMode: 'VIDEO',
          }
        );

        setLoading(false);
      } catch (error) {
        console.error('Error initializing object detector:', error);
        setLoading(false);
      }
    };

    initializeDetector();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (objectDetectorRef.current) {
        objectDetectorRef.current.close();
      }
    };
  }, [modelAssetPath, delegate, scoreThreshold, maxResults]);

  // Handle webcam enabling
  const enableWebcam = async () => {
    if (!objectDetectorRef.current) return;

    console.log('enable web cam running');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width, height },
      });

      console.log('value of video ref: ', videoRef?.current);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', predictWebcam);
        setWebcamEnabled(true);
      }
    } catch (error) {
      console.error('Error enabling webcam:', error);
    }
  };

  const predictWebcam = () => {
    if (!videoRef.current || !objectDetectorRef.current || !webcamEnabled)
      return;

    const startTimeMs = performance.now();

    if (videoRef.current.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = videoRef.current.currentTime;
      const detections = objectDetectorRef.current.detectForVideo(
        videoRef.current,
        startTimeMs
      );

      console.log('predict running');
      console.log('value of detections: ', detections);

      updateDetections(detections);
    }

    animationFrameRef.current = requestAnimationFrame(predictWebcam);
  };

  // Update detections and stats
  const updateDetections = (result: ObjectDetectionResult) => {
    if (!result.detections) return;

    const stats: ObjectDetectionStats = {
      objectsDetected: result.detections.length,
      detections: result.detections.map((detection) => ({
        category: detection.categories[0].categoryName,
        score: detection.categories[0].score,
        boundingBox: {
          originX: detection.boundingBox?.originX || 0,
          originY: detection.boundingBox?.originY || 0,
          width: detection.boundingBox?.width || 0,
          height: detection.boundingBox?.height || 0,
        },
      })),
    };

    setStats(stats);
    drawDetections(result);
  };

  // Draw detections on canvas
  const drawDetections = (result: ObjectDetectionResult) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

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

        // Draw label background
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

        // Draw label text
        ctx.fillStyle = '#000000';
        ctx.font = '14px Arial';
        ctx.fillText(
          text,
          detection.boundingBox?.originX || 0 + 5,
          detection.boundingBox?.originY || 0 - 5
        );
      }
    }
  };

  return {
    loading,
    stats,
    webcamEnabled,
    videoRef,
    canvasRef,
    enableWebcam,
  };
}
