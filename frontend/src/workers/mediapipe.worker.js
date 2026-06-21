import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { OneEuroFilterLandmarks } from "../utils/OneEuroFilter";

let handLandmarker;
let isReady = false;
let lastTimestamp = 0;

// We use two filters, one for each potential hand
const leftHandFilter = new OneEuroFilterLandmarks();
const rightHandFilter = new OneEuroFilterLandmarks();

async function initializeModel() {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/wasm"
    );
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU"
      },
      runningMode: "VIDEO", // Use video mode for temporal coherence
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    isReady = true;
    self.postMessage({ type: 'READY' });
  } catch (error) {
    self.postMessage({ type: 'ERROR', error: error.message });
  }
}

initializeModel();

self.onmessage = async (e) => {
  if (e.data.type === 'PROCESS_FRAME') {
    if (!isReady) {
      if (e.data.bitmap) e.data.bitmap.close();
      return;
    }

    let { bitmap, timestamp } = e.data;
    
    // detectForVideo requires strictly increasing timestamps
    if (timestamp <= lastTimestamp) {
      timestamp = lastTimestamp + 1;
    }
    lastTimestamp = timestamp;

    try {
      const results = handLandmarker.detectForVideo(bitmap, timestamp);
      
      let leftLandmarks = null;
      let rightLandmarks = null;

      if (results.handednesses && results.landmarks) {
        results.handednesses.forEach((hand, index) => {
          const isLeft = hand[0].categoryName === "Left";
          if (isLeft) {
            leftLandmarks = results.landmarks[index]; // bypassed filter
          } else {
            rightLandmarks = results.landmarks[index]; // bypassed filter
          }
        });
      }

      self.postMessage({
        type: 'RESULTS',
        leftHand: leftLandmarks,
        rightHand: rightLandmarks,
        timestamp,
        debug: `Hands: ${results.handednesses ? results.handednesses.length : 0}`
      });
    } catch (err) {
      self.postMessage({ type: 'ERROR', error: "Detect Error: " + err.message });
      console.error(err);
    } finally {
      bitmap.close(); // Prevent memory leaks
    }
  }
};
