import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { GestureMath } from '../utils/GestureMath';

export default function RealisticModel({ leftHand, rightHand, onGestureFeedback, modelPath }) {
  const groupRef = useRef();
  
  // Load the downloaded GLTF model dynamically
  const { scene } = useGLTF(modelPath || '/Sample 3D/eye1/scene.gltf');
  
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  
  // Ref to hold the initial pinch distance and scale when the gesture starts
  const pinchStartRef = useRef(null);

  useFrame(() => {
    let newFeedback = "";

    // Absolute tracking logic
    const activeHand = rightHand || leftHand;
    if (activeHand) {
      const palm = activeHand[0]; 
      const targetRotY = (palm.x - 0.5) * Math.PI * 4;
      const targetRotX = (palm.y - 0.5) * Math.PI;

      setRotation(prev => ({
        x: prev.x + (targetRotX - prev.x) * 0.1,
        y: prev.y + (targetRotY - prev.y) * 0.1,
        z: 0
      }));
      newFeedback = "[ TRACKING ]";
    }

    // Calculate Two-Hand Zoom (Requires Pinching both hands!)
    if (leftHand && rightHand) {
      const isLeftPinching = GestureMath.distance(leftHand[4], leftHand[8]) < 0.06;
      const isRightPinching = GestureMath.distance(rightHand[4], rightHand[8]) < 0.06;
      
      if (isLeftPinching && isRightPinching) {
        const dist = GestureMath.calculateTwoHandDistance(leftHand, rightHand);
        if (dist) {
          if (!pinchStartRef.current) {
            // First frame of the pinch: record base distance and current scale
            pinchStartRef.current = { dist, scale };
          } else {
            // Calculate how much the hands moved relative to where they started pinching
            const scaleFactor = dist / pinchStartRef.current.dist;
            const targetScale = Math.max(0.01, Math.min(500.0, pinchStartRef.current.scale * scaleFactor));
            setScale(prev => prev + (targetScale - prev) * 0.2); // Faster lerp for zooming
            newFeedback = "[ ZOOMING ]";
          }
        }
      } else {
        // Clear the pinch start state when they stop pinching
        pinchStartRef.current = null;
      }
    } else {
      pinchStartRef.current = null;
    }

    if (groupRef.current) {
      groupRef.current.rotation.x = rotation.x;
      groupRef.current.rotation.y = rotation.y;
      groupRef.current.scale.set(scale, scale, scale);
    }

    if (newFeedback && onGestureFeedback) {
      onGestureFeedback(newFeedback);
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}
