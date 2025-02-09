import React, { useEffect, useRef } from 'react';
import { Camera } from '@mediapipe/camera_utils';
import { FaceMesh, Results, NormalizedLandmark } from '@mediapipe/face_mesh';

interface FaceDetectionProps {
  width?: number;
  height?: number;
  maxFaces?: number;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
}

interface Stats {
  facesDetected: number;
  headAngle: number;
}

const DEFAULT_CONFIG = {
  width: 640,
  height: 480,
  maxFaces: 10,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
} as const;

const KEY_POINTS = [33, 133, 362, 263, 61, 291, 199] as const;

const FaceDetection: React.FC<FaceDetectionProps> = ({
  width = DEFAULT_CONFIG.width,
  height = DEFAULT_CONFIG.height,
  maxFaces = DEFAULT_CONFIG.maxFaces,
  minDetectionConfidence = DEFAULT_CONFIG.minDetectionConfidence,
  minTrackingConfidence = DEFAULT_CONFIG.minTrackingConfidence,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const statsRef = useRef<HTMLDivElement | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);

  const calculateHeadAngle = (landmarks: NormalizedLandmark[]): number => {
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];

    return (
      Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) *
      (180 / Math.PI)
    );
  };

  const drawLandmarks = (
    ctx: CanvasRenderingContext2D,
    landmarks: NormalizedLandmark[],
    canvasWidth: number,
    canvasHeight: number
  ): void => {
    ctx.fillStyle = '#00FF00';
    KEY_POINTS.forEach((point) => {
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
  };

  const updateStats = (stats: Stats): void => {
    if (!statsRef.current) return;
    statsRef.current.innerHTML = `
      People detected: ${stats.facesDetected}<br>
      Head angle: ${stats.headAngle.toFixed(1)}°
    `;
  };

  useEffect(() => {
    if (!videoRef.current) return;

    const onResults = (results: Results): void => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      if (results.multiFaceLandmarks) {
        const activeFaces = results.multiFaceLandmarks.length;

        results.multiFaceLandmarks.forEach((landmarks) => {
          drawLandmarks(ctx, landmarks, canvas.width, canvas.height);
          const headAngle = calculateHeadAngle(landmarks);
          updateStats({ facesDetected: activeFaces, headAngle });
        });
      }

      ctx.restore();
    };

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

    faceMesh.onResults(onResults);

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

  return (
    <div
      className="relative m-auto max-h-screen mt-20"
      style={{ width, height }}
    >
      <video
        ref={videoRef}
        className="absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] w-full h-full"
        playsInline
        style={{ display: 'none' }}
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        width={width}
        height={height}
      />
      <div
        ref={statsRef}
        className="absolute top-2 left-2 bg-black/70 text-white p-2 font-sans"
      />
    </div>
  );
};

export default FaceDetection;
