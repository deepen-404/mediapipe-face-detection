import { Loader } from 'lucide-react';
import { OBJECT_DETECTION_DEFAULT_CONFIG } from '../constants/ObjectDetection';
import { useMediaPipeObjectDetection } from '../hooks/useMediaPipeObjectDetection';

export interface ObjectDetectionProps {
  width?: number;
  height?: number;
  scoreThreshold?: number;
  maxResults?: number;
  delegate?: 'CPU' | 'GPU';
  modelAssetPath?: string;
}

const ObjectDetection: React.FC<ObjectDetectionProps> = ({
  width = OBJECT_DETECTION_DEFAULT_CONFIG.width,
  height = OBJECT_DETECTION_DEFAULT_CONFIG.height,
  scoreThreshold = OBJECT_DETECTION_DEFAULT_CONFIG.scoreThreshold,
  maxResults = OBJECT_DETECTION_DEFAULT_CONFIG.maxResults,
  delegate = OBJECT_DETECTION_DEFAULT_CONFIG.delegate,
  modelAssetPath = OBJECT_DETECTION_DEFAULT_CONFIG.modelAssetPath,
}) => {
  const { loading, stats, webcamEnabled, videoRef, canvasRef, enableWebcam } =
    useMediaPipeObjectDetection({
      width,
      height,
      scoreThreshold,
      maxResults,
      delegate,
      modelAssetPath,
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
            Loading Object Detection Model...
          </span>
        </div>
      )}

      {!webcamEnabled && !loading && (
        <button
          onClick={enableWebcam}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded z-10"
        >
          ENABLE WEBCAM
        </button>
      )}

      <video
        ref={videoRef}
        className="absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] w-full h-full"
        playsInline
        style={{ display: webcamEnabled ? 'block' : 'none' }}
      />

      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        width={width}
        height={height}
      />

      {stats && (
        <div className="absolute top-2 left-2 bg-black/70 text-white p-2 font-sans">
          <span>Objects detected: {stats.objectsDetected}</span>
          <div className="mt-1">
            {stats.detections.map((detection, index) => (
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

export default ObjectDetection;
