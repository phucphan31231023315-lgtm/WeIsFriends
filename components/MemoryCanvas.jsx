'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import MemoryScene from './MemoryScene';

export default function MemoryCanvas({ activePlaceId, memories, onPanelClick }) {
  return (
    <div className="fixed inset-0 w-full h-full bg-[#0f0b18] z-0">
      <Canvas
        shadows
        gl={{ antialias: true, alpha: false, stencil: false, depth: true }}
        camera={{ position: [0, 1.5, 3.5], fov: 72, near: 0.1, far: 80 }}
      >
        <color attach="background" args={['#0f0b18']} />
        <fogExp2 attach="fog" args={['#0f0b18', 0.024]} />
        <Suspense fallback={null}>
          <MemoryScene 
            activePlaceId={activePlaceId}
            memories={memories} 
            onPanelClick={onPanelClick} 
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
