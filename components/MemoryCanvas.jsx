'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import MemoryScene from './MemoryScene';

export default function MemoryCanvas({ activePlaceId, memories, onPanelClick, scrollDepth = 55.5 }) {
  return (
    <div className="fixed inset-0 w-full h-full bg-[#060404] z-0">
      <Canvas
        shadows
        gl={{ antialias: true, alpha: false, stencil: false, depth: true }}
        camera={{ position: [0, 1.5, 3.5], fov: 72, near: 0.1, far: 240 }}
      >
        <color attach="background" args={['#060404']} />
        <fog attach="fog" args={['#060404', 6, Math.max(75, scrollDepth + 30)]} />
        <Suspense fallback={null}>
          <MemoryScene 
            activePlaceId={activePlaceId}
            memories={memories} 
            onPanelClick={onPanelClick}
            scrollDepth={scrollDepth}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
