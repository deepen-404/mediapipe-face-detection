import './App.css';
import FaceDetection from './components/MediaPipe/components/FaceDetection';
import ObjectDetection from './components/MediaPipe/components/ObjectDetection';

function App() {
  return (
    <div className="tw-overflow-y-auto">
      <ObjectDetection />
      <FaceDetection />
    </div>
  );
}

export default App;
