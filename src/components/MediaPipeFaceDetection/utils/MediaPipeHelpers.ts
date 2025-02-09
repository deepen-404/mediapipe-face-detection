import { Results, NormalizedLandmark } from '@mediapipe/face_mesh';
import { FACE_DETECTION_KEY_POINTS } from '../constants/FaceDetection';
import { FaceDetectionStats } from '../types/MediaPipe.types';

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
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  setStats: React.Dispatch<React.SetStateAction<FaceDetectionStats | null>>
): void {
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
      updateStats({ facesDetected: activeFaces, headAngle }, setStats);
    });
  }

  ctx.restore();
}

export async function locateFile(file: string): Promise<string> {
  if ('showDirectoryPicker' in window) {
    try {
      const opfsRoot = await navigator.storage.getDirectory();
      const faceMeshDir = await opfsRoot.getDirectoryHandle('face_mesh', {
        create: true,
      });

      try {
        // Check if file exists in OPFS
        const fileHandle = await faceMeshDir.getFileHandle(file);
        const fileObject = await fileHandle.getFile();
        return URL.createObjectURL(fileObject);
      } catch (error) {
        console.error('File not found in OPFS:', error);

        // If file does not exist, download and store it
        const response = await fetch(
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        );
        if (!response.ok) throw new Error(`Failed to download ${file}`);

        const writableFile = await faceMeshDir.getFileHandle(file, {
          create: true,
        });
        const writableStream = await writableFile.createWritable();
        await response.body?.pipeTo(writableStream);

        console.log(`Saved ${file} to OPFS`);
        return URL.createObjectURL(await writableFile.getFile());
      }
    } catch (error) {
      console.error('Error accessing OPFS:', error);
    }
  }
  // Fallback to CDN if OPFS is not available
  return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
}
