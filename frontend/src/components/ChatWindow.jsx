import React, { useState } from 'react';
import GestureTracker from './GestureTracker';
import HoloViewer from './HoloViewer';
import SystemStatsHUD from './SystemStatsHUD';
import './ChatWindow.css';

const CUSTOM_MODELS = [
  { id: 'chibi', name: 'CHIBI GEAR SOLID', path: '/Sample 3D/chibi_gear_solid/scene.gltf' },
  { id: 'eye1', name: 'EYE 1', path: '/Sample 3D/eye1/scene.gltf' },
  { id: 'eye2', name: 'EYE 2', path: '/Sample 3D/eye2/scene.gltf' },
  { id: 'f14_tomcat', name: 'F-14 TOMCAT', path: '/Sample 3D/f-14_tomcat_top_gun_gear_up_downloadable/scene.gltf' },
  { id: 'f1_tomcat', name: 'F1 TOMCAT', path: '/Sample 3D/f1 tomcat/scene.gltf' },
  { id: 'f15', name: 'F-15 C', path: '/Sample 3D/f15 C/scene.gltf' },
  { id: 'fornite', name: 'FORTNITE PEN', path: '/Sample 3D/fornit_emote_pen/scene.gltf' },
  { id: 'fujin', name: 'FUJIN', path: '/Sample 3D/fujin/scene.gltf' },
  { id: 'india', name: 'INDIA', path: '/Sample 3D/india/scene.gltf' },
  { id: 'mule', name: 'MULE ROBOT', path: '/Sample 3D/mule_robot/scene.gltf' },
  { id: 'b2_spirit', name: 'B-2 SPIRIT', path: '/Sample 3D/northrop_grumman_b-2_spirit_-_free/scene.gltf' },
  { id: 'robot2', name: 'ROBOT 2', path: '/Sample 3D/robot2/scene.gltf' },
  { id: 'cargo_ship', name: 'CARGO SHIP', path: '/Sample 3D/stranded_cargo_ship_giant_vessel_rusty_ship/scene.gltf' },
  { id: 'type_74', name: 'TYPE 74 TANK', path: '/Sample 3D/type_74/scene.gltf' }
];

export default function ChatWindow() {
  const [showHolo, setShowHolo] = useState(true);
  const [showWebcam, setShowWebcam] = useState(true);
  const [activeModel, setActiveModel] = useState('jarvis');
  
  const [gestureFeedback, setGestureFeedback] = useState('');
  
  // Landmark states for the 3D viewer
  const [leftHand, setLeftHand] = useState(null);
  const [rightHand, setRightHand] = useState(null);

  // Clear feedback after 2 seconds
  React.useEffect(() => {
    if (gestureFeedback) {
      const timer = setTimeout(() => setGestureFeedback(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [gestureFeedback]);

  return (
    <div className="chat-window">
      
      {/* TOP BAR */}
      <div className="top-bar">
        <div>JARVIS AI COPILOT</div>
        <div>STATUS: {showHolo ? 'HOLOGRAM ACTIVE' : 'STANDBY'}</div>
        <div>SYSTEM ONLINE</div>
      </div>

      {/* LEFT PANEL */}
      <div className="left-panel">
        <SystemStatsHUD />
        
        <div className="hud-card">
          <h3>Tracking</h3>
          <div style={{ marginBottom: '5px' }}>Left Hand: <span style={{ color: leftHand ? 'var(--color-success)' : 'var(--color-primary)' }}>{leftHand ? 'DETECTED' : 'SEARCHING'}</span></div>
          <div>Right Hand: <span style={{ color: rightHand ? 'var(--color-success)' : 'var(--color-primary)' }}>{rightHand ? 'DETECTED' : 'SEARCHING'}</span></div>
        </div>

        <div className="hud-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3>Settings</h3>
          <button onClick={() => setShowHolo(!showHolo)} className="holo-toggle" style={{ marginBottom: '10px' }}>
            {showHolo ? 'DISABLE HOLOGRAM' : 'ENABLE HOLOGRAM'}
          </button>
          {showHolo && (
            <button onClick={() => setShowWebcam(!showWebcam)} className="holo-toggle">
              {showWebcam ? 'HIDE CAMERA' : 'SHOW CAMERA'}
            </button>
          )}
        </div>
      </div>

      {/* CENTER PANEL */}
      <div className="center-panel">
        {showHolo ? (
          <div className="holo-viewport-wrapper">
            <HoloViewer 
              leftHand={leftHand} 
              rightHand={rightHand} 
              activeModel={activeModel}
              hudStatus={'idle'}
              onGestureFeedback={(fb) => {
                if (fb !== gestureFeedback) setGestureFeedback(fb);
              }} 
            />
            {gestureFeedback && <div className="gesture-feedback">{gestureFeedback}</div>}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
            HOLOGRAM OFFLINE
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="right-panel">
        <div className="hud-card">
          <h3>Context</h3>
          <div style={{ marginBottom: '10px', fontSize: '12px' }}>
            <strong>MODEL:</strong> {activeModel === 'jarvis' ? 'JARVIS CORE' : activeModel.name}
          </div>
          <div style={{ fontSize: '11px', opacity: 0.8, lineHeight: '1.6' }}>
            {activeModel === 'jarvis' && (
              <>
                <div>CORE: Neural Processing Unit</div>
                <div>LLM: Hologram Display</div>
                <div>MEMORY: Gesture Tracking</div>
                <div>STATUS: Active</div>
              </>
            )}
            {activeModel !== 'jarvis' && (
              <>
                <div>TYPE: High-Fidelity 3D Asset</div>
                <div>FORMAT: GLTF / GLB</div>
                <div>RENDER: PBR with HDRI</div>
                <div>STATUS: Loaded {activeModel.name}</div>
              </>
            )}
          </div>
        </div>

        <div className="hud-card" style={{ marginTop: '10px' }}>
          <h3>Model Library</h3>
          <button 
            className="holo-toggle" 
            style={{ display: 'block', width: '100%', marginBottom: '10px', borderColor: activeModel === 'jarvis' ? 'var(--color-primary)' : 'rgba(64, 196, 255, 0.3)' }} 
            onClick={() => { setActiveModel('jarvis'); setShowHolo(true); }}
          >
            JARVIS CORE
          </button>
          
          <div style={{ borderTop: '1px solid rgba(64, 196, 255, 0.2)', paddingTop: '10px' }}>
            {CUSTOM_MODELS.map((model) => (
              <button 
                key={model.id}
                className="holo-toggle" 
                style={{ 
                  display: 'block', 
                  width: '100%', 
                  marginBottom: '5px', 
                  borderColor: activeModel?.id === model.id ? 'var(--color-success)' : 'rgba(0, 230, 118, 0.3)', 
                  color: activeModel?.id === model.id ? 'var(--color-success)' : 'rgba(0, 230, 118, 0.7)' 
                }} 
                onClick={() => { setActiveModel(model); setShowHolo(true); }}
              >
                {model.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* HIDDEN TRACKER (Visibility managed internally via opacity) */}
      <GestureTracker 
        showWebcam={showWebcam} 
        onLandmarksUpdate={(left, right) => {
          setLeftHand(left);
          setRightHand(right);
        }} 
      />

    </div>
  );
}
