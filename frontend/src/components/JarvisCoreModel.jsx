import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Icosahedron, Torus } from '@react-three/drei';
import * as THREE from 'three';
import { GestureMath } from '../utils/GestureMath';

export default function JarvisCoreModel({ hudStatus, leftHand, rightHand }) {
  const groupRef = useRef();
  const coreRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const ring3Ref = useRef();
  const materialRef = useRef();

  const [scale, setScale] = useState(1.5);
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const pinchStartRef = useRef(null);

  // State configurations
  const config = {
    idle: {
      color: new THREE.Color('#0088ff'),
      emissiveIntensity: 0.5,
      rotationSpeed: 0.5,
      pulseSpeed: 1,
      pulseAmplitude: 0.05
    },
    listening: {
      color: new THREE.Color('#00f3ff'),
      emissiveIntensity: 1.0,
      rotationSpeed: 1.5,
      pulseSpeed: 2,
      pulseAmplitude: 0.1
    },
    thinking: {
      color: new THREE.Color('#ff00ff'),
      emissiveIntensity: 1.5,
      rotationSpeed: 3.0,
      pulseSpeed: 8,
      pulseAmplitude: 0.15
    },
    speaking: {
      color: new THREE.Color('#00f3ff'),
      emissiveIntensity: 2.0,
      rotationSpeed: 2.0,
      pulseSpeed: 12,
      pulseAmplitude: 0.25
    }
  };

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const currentConfig = config[hudStatus] || config.idle;

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
    }

    // Calculate Two-Hand Zoom (Requires Pinching both hands!)
    if (leftHand && rightHand) {
      const isLeftPinching = GestureMath.distance(leftHand[4], leftHand[8]) < 0.06;
      const isRightPinching = GestureMath.distance(rightHand[4], rightHand[8]) < 0.06;
      
      if (isLeftPinching && isRightPinching) {
        const dist = GestureMath.calculateTwoHandDistance(leftHand, rightHand);
        if (dist) {
          if (!pinchStartRef.current) {
            pinchStartRef.current = { dist, scale };
          } else {
            const scaleFactor = dist / pinchStartRef.current.dist;
            const targetScale = Math.max(0.5, Math.min(10.0, pinchStartRef.current.scale * scaleFactor));
            setScale(prev => prev + (targetScale - prev) * 0.2);
          }
        }
      } else {
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

    // Smoothly interpolate color and intensity
    if (materialRef.current) {
      materialRef.current.color.lerp(currentConfig.color, 0.05);
      materialRef.current.emissive.lerp(currentConfig.color, 0.05);
      materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        materialRef.current.emissiveIntensity,
        currentConfig.emissiveIntensity,
        0.1
      );
    }

    const pulse = 1 + Math.sin(time * currentConfig.pulseSpeed) * currentConfig.pulseAmplitude;

    // Apply internal animations (relative to group)
    if (coreRef.current) {
      coreRef.current.rotation.y += 0.01 * currentConfig.rotationSpeed;
      coreRef.current.rotation.x += 0.005 * currentConfig.rotationSpeed;
      coreRef.current.scale.set(pulse, pulse, pulse);
    }

    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += 0.015 * currentConfig.rotationSpeed;
      ring1Ref.current.rotation.y += 0.01 * currentConfig.rotationSpeed;
      ring1Ref.current.scale.set(pulse, pulse, pulse);
    }

    if (ring2Ref.current) {
      ring2Ref.current.rotation.y += 0.02 * currentConfig.rotationSpeed;
      ring2Ref.current.rotation.z += 0.015 * currentConfig.rotationSpeed;
      ring2Ref.current.scale.set(pulse, pulse, pulse);
    }

    if (ring3Ref.current) {
      ring3Ref.current.rotation.x -= 0.01 * currentConfig.rotationSpeed;
      ring3Ref.current.rotation.z -= 0.02 * currentConfig.rotationSpeed;
      ring3Ref.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central Core */}
      <Icosahedron ref={coreRef} args={[1, 1]}>
        <meshStandardMaterial
          ref={materialRef}
          color="#0088ff"
          emissive="#0088ff"
          emissiveIntensity={0.5}
          wireframe={true}
          transparent={true}
          opacity={0.8}
        />
      </Icosahedron>

      {/* Orbiting Rings */}
      <Torus ref={ring1Ref} args={[1.5, 0.02, 16, 100]} rotation={[Math.PI / 4, 0, 0]}>
        <meshStandardMaterial color="#ffffff" transparent opacity={0.3} />
      </Torus>
      
      <Torus ref={ring2Ref} args={[1.8, 0.01, 16, 100]} rotation={[0, Math.PI / 3, 0]}>
        <meshStandardMaterial color="#ffffff" transparent opacity={0.2} />
      </Torus>
      
      <Torus ref={ring3Ref} args={[2.1, 0.03, 16, 100]} rotation={[0, 0, Math.PI / 6]}>
        <meshStandardMaterial color="#00f3ff" transparent opacity={0.15} wireframe={true} />
      </Torus>
    </group>
  );
}
