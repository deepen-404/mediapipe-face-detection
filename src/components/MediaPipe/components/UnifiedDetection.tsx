// components/UnifiedDetection.tsx
import { useRef, useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import { useMediaPipeFaceDetection } from '../hooks/useMediaPipeFaceDetection';
import { useMediaPipeObjectDetection } from '../hooks/useMediaPipeObjectDetection';
import { FACE_DETECTION_DEFAULT_CONFIG } from '../constants/FaceDetection';
import { OBJECT_DETECTION_DEFAULT_CONFIG } from '../constants/ObjectDetection';

export interface UnifiedDetectionProps {
  width?: number;
  height?: number;
  // Face detection props
  maxFaces?: number;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
  // Object detection props
  scoreThreshold?: number;
  maxResults?: number;
  delegate?: 'CPU' | 'GPU';
  modelAssetPath?: string;
  // Mode selection
  detectionMode?: 'face' | 'object' | 'both';
}

const UnifiedDetection: React.FC<UnifiedDetectionProps> = ({
  width = FACE_DETECTION_DEFAULT_CONFIG.width,
  height = FACE_DETECTION_DEFAULT_CONFIG.height,
  // Face detection props
  maxFaces = FACE_DETECTION_DEFAULT_CONFIG.maxFaces,
  minDetectionConfidence = FACE_DETECTION_DEFAULT_CONFIG.minDetectionConfidence,
  minTrackingConfidence = FACE_DETECTION_DEFAULT_CONFIG.minTrackingConfidence,
  // Object detection props
  scoreThreshold = OBJECT_DETECTION_DEFAULT_CONFIG.scoreThreshold,
  maxResults = OBJECT_DETECTION_DEFAULT_CONFIG.maxResults,
  delegate = OBJECT_DETECTION_DEFAULT_CONFIG.delegate,
  modelAssetPath = OBJECT_DETECTION_DEFAULT_CONFIG.modelAssetPath,
  // Mode selection
  detectionMode = 'both',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webcamActive, setWebcamActive] = useState(false);

  // Use both hooks but conditionally based on the mode
  const showFaceDetection =
    detectionMode === 'face' || detectionMode === 'both';
  const showObjectDetection =
    detectionMode === 'object' || detectionMode === 'both';
  const isSharedCanvas = detectionMode === 'both';

  // Initialize webcam
  useEffect(() => {
    const initializeWebcam = async () => {
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
          videoRef.current.onloadedmetadata = () => {
            setWebcamActive(true);
          };
          await videoRef.current.play();
        }
      } catch (error) {
        console.error('Error initializing webcam:', error);
      }
    };

    initializeWebcam();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
      setWebcamActive(false);
    };
  }, [width, height]);

  const faceDetection = useMediaPipeFaceDetection({
    maxFaces,
    minDetectionConfidence,
    minTrackingConfidence,
    width,
    height,
    videoRef,
    canvasRef,
    enabled: showFaceDetection && webcamActive,
    isSharedCanvas,
  });

  const objectDetection = useMediaPipeObjectDetection({
    width,
    height,
    scoreThreshold,
    maxResults,
    delegate,
    modelAssetPath,
    videoRef,
    canvasRef,
    enabled: showObjectDetection && webcamActive,
    isSharedCanvas,
  });

  // Determine overall loading state
  const isLoading =
    !webcamActive ||
    (showFaceDetection && faceDetection.loading) ||
    (showObjectDetection && objectDetection.loading);

  return (
    <div
      className="relative m-auto max-h-screen mt-20"
      style={{ width, height }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 rounded-md text-white backdrop-blur-md">
          <Loader className="animate-spin w-12 h-12 text-white mb-3" />
          <span className="text-lg font-semibold">
            {!webcamActive
              ? 'Initializing Webcam...'
              : 'Loading Detection Models...'}
          </span>
        </div>
      )}

      <video
        ref={videoRef}
        className="absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] w-full h-full"
        playsInline
        style={{
          display: detectionMode === 'object' && !isLoading ? 'block' : 'none',
        }}
      />

      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        width={width}
        height={height}
      />

      {/* Face Detection Stats */}
      {showFaceDetection && faceDetection.stats && (
        <div className="absolute top-2 left-2 bg-black/70 text-white p-2 font-sans">
          <span>People detected: {faceDetection.stats.facesDetected}</span>
          <br />
          <span>Head angle: {faceDetection.stats.headAngle.toFixed(1)}°</span>
        </div>
      )}

      {/* Object Detection Stats */}
      {showObjectDetection && objectDetection.stats && (
        <div
          className={`absolute ${
            showFaceDetection ? 'top-20' : 'top-2'
          } left-2 bg-black/70 text-white p-2 font-sans`}
        >
          <span>Objects detected: {objectDetection.stats.objectsDetected}</span>
          <div className="mt-1">
            {objectDetection.stats.detections.map((detection, index) => (
              <div key={index}>
                {detection.category} ({Math.round(detection.score * 100)}%)
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedDetection;
