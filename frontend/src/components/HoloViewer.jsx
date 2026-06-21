import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import JarvisCoreModel from './JarvisCoreModel';
import RealisticModel from './RealisticModel';

export default function HoloViewer({ leftHand, rightHand, onGestureFeedback, activeModel = 'jarvis', hudStatus = 'idle' }) {
  return (
    <div className="holo-viewer-container">
      <Canvas camera={{ position: [0, 0, 8] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#00f3ff" />
        <Environment preset="city" />
        <Grid infiniteGrid fadeDistance={20} sectionColor="#40C4FF" cellColor="#1E88E5" position={[0, -3, 0]} />
        
        {activeModel === 'jarvis' && (
          <JarvisCoreModel leftHand={leftHand} rightHand={rightHand} hudStatus={hudStatus} />
        )}

        {activeModel !== 'jarvis' && typeof activeModel === 'object' && (
          <RealisticModel 
            key={activeModel.id} // Force remount on model change
            leftHand={leftHand} 
            rightHand={rightHand} 
            onGestureFeedback={onGestureFeedback} 
            modelPath={activeModel.path} 
          />
        )}

        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </div>
  );
}
