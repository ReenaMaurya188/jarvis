import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { OneEuroFilterLandmarks } from "../utils/OneEuroFilter";

// Create singletons for the filters so they persist across frames
const leftHandFilter = new OneEuroFilterLandmarks();
const rightHandFilter = new OneEuroFilterLandmarks();

export default function GestureTracker({ onLandmarksUpdate, showWebcam = true }) {
  const videoRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [debugMsg, setDebugMsg] = useState("");
  const landmarkerRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);

  useEffect(() => {
    let active = true;
    async function initModel() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/wasm"
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        if (active) {
          landmarkerRef.current = landmarker;
          setIsReady(true);
        }
      } catch (err) {
        if (active) setErrorMsg("Model Error: " + err.message);
      }
    }
    initModel();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let animationFrameId;
    let stream;

    async function setupCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMsg("Browser API navigator.mediaDevices not available");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            processVideo();
          };
        }
      } catch (err) {
        setErrorMsg("Camera Error: " + err.message);
      }
    }

    function processVideo() {
      if (videoRef.current && videoRef.current.readyState >= 2 && isReady && landmarkerRef.current) {
        try {
          const video = videoRef.current;
          let startTimeMs = performance.now();
          if (lastVideoTimeRef.current !== video.currentTime) {
            lastVideoTimeRef.current = video.currentTime;
            
            // detectForVideo takes the HTMLVideoElement directly on main thread!
            const results = landmarkerRef.current.detectForVideo(video, startTimeMs);
            
            let leftLandmarks = null;
            let rightLandmarks = null;

            if (results.handednesses && results.landmarks) {
              results.handednesses.forEach((hand, index) => {
                const isLeft = hand[0].categoryName === "Left";
                if (isLeft) {
                  leftLandmarks = leftHandFilter.filter(startTimeMs, results.landmarks[index]);
                } else {
                  rightLandmarks = rightHandFilter.filter(startTimeMs, results.landmarks[index]);
                }
              });
            }
            onLandmarksUpdate(leftLandmarks, rightLandmarks);
            setDebugMsg(`Hands: ${results.handednesses ? results.handednesses.length : 0}`);
          }
        } catch (e) {
          setErrorMsg("Detect Error: " + e.message);
        }
      }
      animationFrameId = requestAnimationFrame(processVideo);
    }

    setupCamera();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isReady]);

  return (
    <div style={{ opacity: showWebcam ? 1 : 0, pointerEvents: showWebcam ? 'auto' : 'none', position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, borderRadius: '12px', overflow: 'hidden', border: '2px solid #333', transition: 'opacity 0.2s' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: '160px', height: '120px', transform: 'scaleX(-1)', objectFit: 'cover' }}
      />
      {!isReady && !errorMsg && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>Loading ML...</div>}
      {errorMsg && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,0,0,0.8)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', padding: '5px', textAlign: 'center' }}>Error:<br/>{errorMsg}</div>}
      {debugMsg && <div style={{ position: 'absolute', top: 0, left: 0, background: 'rgba(0,0,0,0.7)', color: '#00E676', fontSize: '12px', padding: '4px' }}>{debugMsg}</div>}
    </div>
  );
}
