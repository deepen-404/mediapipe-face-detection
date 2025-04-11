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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const objectDetectorRef = useRef<ObjectDetector | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const animationFrameRef = useRef<number>(0);
  const predictionActiveRef = useRef<boolean>(false);

  // Initialize the object detector and webcam
  useEffect(() => {
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
          updateDetections(detections);
        } catch (error) {
          console.error('Detection error:', error);
        }
      }

      animationFrameRef.current = requestAnimationFrame(predictWebcam);
    };

    // Update detections and stats
    const updateDetections = (result: ObjectDetectionResult) => {
      if (!result.detections) return;

      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      // Update canvas dimensions to match video
      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

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
      }
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

        // Initialize webcam
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: width },
              height: { ideal: height },
              facingMode: 'user',
            },
          });

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.addEventListener('loadeddata', () => {
              startPrediction();
            });
            await videoRef.current.play();
          }
        } catch (error) {
          console.error('Error enabling webcam:', error);
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
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [modelAssetPath, delegate, scoreThreshold, maxResults, width, height]);

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
    videoRef,
    canvasRef,
  };
}
