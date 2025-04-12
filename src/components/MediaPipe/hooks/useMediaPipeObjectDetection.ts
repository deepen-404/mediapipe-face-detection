// hooks/useMediaPipeObjectDetection.ts
import { useEffect, useRef, useState, RefObject } from 'react';
import { ObjectDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import { ObjectDetectionStats } from '../types/ObjectDetection.types';
import { drawDetections } from '../utils/ObjectionDetectionHelpers';

export function useMediaPipeObjectDetection({
  width,
  height,
  scoreThreshold,
  maxResults,
  delegate,
  modelAssetPath,
  videoRef,
  canvasRef,
  enabled = true,
  isSharedCanvas = false,
}: {
  width: number;
  height: number;
  scoreThreshold: number;
  maxResults: number;
  delegate: 'CPU' | 'GPU';
  modelAssetPath: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  enabled?: boolean;
  isSharedCanvas?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ObjectDetectionStats | null>(null);
  const objectDetectorRef = useRef<ObjectDetector | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const animationFrameRef = useRef<number>(0);
  const predictionActiveRef = useRef<boolean>(false);

  // Initialize the object detector and webcam
  useEffect(() => {
    if (!enabled) return;

    const startPrediction = () => {
      if (!predictionActiveRef.current) {
        predictionActiveRef.current = true;
        predictWebcam();
      }
    };

    const predictWebcam = () => {
      if (!predictionActiveRef.current) return;

      const video = videoRef.current;
      const detector = objectDetectorRef.current;

      if (
        !video ||
        !detector ||
        video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA
      ) {
        animationFrameRef.current = requestAnimationFrame(predictWebcam);
        return;
      }

      const startTimeMs = performance.now();

      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;

        try {
          const detections = detector.detectForVideo(video, startTimeMs);
          drawDetections(
            detections,
            canvasRef,
            videoRef,
            setStats,
            isSharedCanvas
          );
        } catch (error) {
          console.error('Detection error:', error);
        }
      }

      animationFrameRef.current = requestAnimationFrame(predictWebcam);
    };

    const initialize = async () => {
      try {
        // Initialize detector
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

        // Since we're using the video from parent, just start prediction
        // when video is playing and has data
        if (videoRef.current) {
          if (videoRef.current.readyState >= HTMLMediaElement.HAVE_METADATA) {
            startPrediction();
          } else {
            videoRef.current.addEventListener('loadeddata', startPrediction);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error initializing object detector:', error);
        setLoading(false);
      }
    };

    initialize();

    return () => {
      stopPrediction();
      if (objectDetectorRef.current) {
        objectDetectorRef.current.close();
      }
      if (videoRef.current) {
        videoRef.current.removeEventListener('loadeddata', startPrediction);
      }
    };
  }, [
    modelAssetPath,
    delegate,
    scoreThreshold,
    maxResults,
    width,
    height,
    enabled,
    isSharedCanvas,
  ]);

  const stopPrediction = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
    predictionActiveRef.current = false;
  };

  return {
    loading,
    stats,
  };
}
