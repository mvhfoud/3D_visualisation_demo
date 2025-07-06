// React 3D Model Viewer with Separate Control Bar and Light Snapshot Panel

import React, { useRef, useState, Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Box } from '@react-three/drei';
import { Box3, Vector3 } from 'three';

function Model({ url, frozen }) {
  const { scene } = useGLTF(url);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      const box = new Box3().setFromObject(scene);
      const size = box.getSize(new Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim;
      scene.scale.set(scale, scale, scale);
      box.setFromObject(scene);
      const center = box.getCenter(new Vector3());
      scene.position.sub(center);
      setInitialized(true);
    }
  }, [scene, initialized]);

  useFrame((_, delta) => {
    if (!frozen && initialized) scene.rotation.y += delta * 0.5;
  });

  return <primitive object={scene} dispose={null} />;
}

export default function App() {
  const [modelUrl, setModelUrl] = useState(null);
  const [frozen, setFrozen] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const canvasRef = useRef();

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setModelUrl(URL.createObjectURL(file));
    setFrozen(false);
    setSnapshot(null);
  };

  const handleFreeze = () => {
    if (canvasRef.current) {
      setFrozen(true);
      const dataURL = canvasRef.current.gl.domElement.toDataURL('image/png');
      setSnapshot(dataURL);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', padding: 20, gap: 20, boxSizing: 'border-box' }}>

      {/* Left Panel: Viewer + Controls */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>

        {/* Viewer Box */}
        <div
          style={{
            flex: 1,
            width: '100%',
            borderRadius: 16,
            background: '#222',
            overflow: 'hidden',
          }}
        >
          <Canvas
            onCreated={(state) => (canvasRef.current = state)}
            camera={{ position: [0, 0, 5], fov: 50 }}
            gl={{ antialias: true, preserveDrawingBuffer: true }}
          >
            <color attach="background" args={[0xffffff]} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            <directionalLight position={[-5, -5, -5]} intensity={0.4} />
            <Box args={[4, 4, 4]}>
              <meshBasicMaterial attach="material" wireframe />
            </Box>
            <Suspense fallback={null}>
              {modelUrl && <Model url={modelUrl} frozen={frozen} />}
            </Suspense>
            <OrbitControls enablePan enableZoom enableRotate />
          </Canvas>
        </div>

        {/* Control Bar Under Viewer */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <label
            htmlFor="file-input"
            style={{
              background: '#fff',
              color: '#000',
              padding: '8px 16px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Choose File
            <input
              id="file-input"
              type="file"
              accept=".glb,.gltf"
              onChange={handleUpload}
              style={{ display: 'none' }}
            />
          </label>

          <button
            onClick={handleFreeze}
            disabled={!modelUrl}
            style={{
              background: '#fff',
              color: '#000',
              padding: '8px 16px',
              borderRadius: 8,
              fontWeight: 'bold',
              border: 'none',
              cursor: modelUrl ? 'pointer' : 'not-allowed',
            }}
          >
            Freeze & Snapshot
          </button>
        </div>
      </div>

      {/* Right Panel: Snapshot Display */}
      <div
        style={{
          flex: 1,
          borderRadius: 16,
          background: '#f5f5f5',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {snapshot ? (
          <img
            src={snapshot}
            alt="Model Snapshot"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : null}
      </div>
    </div>
  );
}