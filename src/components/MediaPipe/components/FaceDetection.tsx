import { FACE_DETECTION_DEFAULT_CONFIG } from '../constants/FaceDetection';
import { useMediaPipeFaceDetection } from '../hooks/useMediaPipeFaceDetection';
import { Loader } from 'lucide-react';

export interface FaceDetectionProps {
  width?: number;
  height?: number;
  maxFaces?: number;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
}

const FaceDetection: React.FC<FaceDetectionProps> = ({
  width = FACE_DETECTION_DEFAULT_CONFIG.width,
  height = FACE_DETECTION_DEFAULT_CONFIG.height,
  maxFaces = FACE_DETECTION_DEFAULT_CONFIG.maxFaces,
  minDetectionConfidence = FACE_DETECTION_DEFAULT_CONFIG.minDetectionConfidence,
  minTrackingConfidence = FACE_DETECTION_DEFAULT_CONFIG.minTrackingConfidence,
}) => {
  const { loading, stats, videoRef, canvasRef } = useMediaPipeFaceDetection({
    maxFaces,
    minDetectionConfidence,
    minTrackingConfidence,
    width,
    height,
  });

  return (
    <div
      className="relative m-auto max-h-screen mt-20"
      style={{ width, height }}
    >
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 rounded-md text-white backdrop-blur-md">
          <Loader className="animate-spin w-12 h-12 text-white mb-3" />
          <span className="text-lg font-semibold">
            Loading Face Detection Model...
          </span>
        </div>
      )}
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

      {stats && (
        <div
          className={`${'absolute top-2 left-2 bg-black/70 text-white p-2 font-sans'}`}
        >
          <span>People detected: {stats.facesDetected}</span>
          <br />
          <span>Head angle: {stats.headAngle.toFixed(1)}°</span>
        </div>
      )}
    </div>
  );
};

export default FaceDetection;
