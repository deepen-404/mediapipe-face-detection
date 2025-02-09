import { useEffect, useRef } from 'react';
import { Camera } from '@mediapipe/camera_utils';
import { FaceMesh } from '@mediapipe/face_mesh';

const FaceDetection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statsRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    faceMesh.setOptions({
      maxNumFaces: 10,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
      refineLandmarks: false,
    });

    faceMesh.onResults(onResults);

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await faceMesh.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480,
    });

    camera.start();

    return () => {
      camera.stop();
      faceMesh.close();
    };
  }, []);

  const onResults = (results) => {
    const canvas = canvasRef.current;
    const stats = statsRef.current;
    if (!canvas || !stats) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw camera feed
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks) {
      const activeFaces = results.multiFaceLandmarks.length;

      for (const landmarks of results.multiFaceLandmarks) {
        // Draw only essential landmarks
        const keyPoints = [33, 133, 362, 263, 61, 291, 199];

        ctx.fillStyle = '#00FF00';
        keyPoints.forEach((point) => {
          const landmark = landmarks[point];
          ctx.beginPath();
          ctx.arc(
            landmark.x * canvas.width,
            landmark.y * canvas.height,
            2,
            0,
            2 * Math.PI
          );
          ctx.fill();
        });

        // Calculate head angle
        const nose = landmarks[1];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];

        const angle =
          Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) *
          (180 / Math.PI);

        // Update stats
        stats.innerHTML = `
          People detected: ${activeFaces}<br>
          Head angle: ${angle.toFixed(1)}°
        `;
      }
    }

    ctx.restore();
  };

  return (
    <div className="relative w-[640px] h-[480px]">
      <video
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full"
        playsInline
        style={{ display: 'none' }}
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        width={640}
        height={480}
      />
      <div
        ref={statsRef}
        className="absolute top-2 left-2 bg-black/70 text-white p-2 font-sans"
      />
    </div>
  );
};

export default FaceDetection;
