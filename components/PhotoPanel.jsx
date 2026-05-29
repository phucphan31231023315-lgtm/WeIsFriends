'use client';

import { useRef, useState, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, useCursor } from '@react-three/drei';
import * as THREE from 'three';

export default function PhotoPanel({ memory, onClick }) {
  const meshRef = useRef();
  const lightRef = useRef();
  
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  // Load the memory image texture
  const texture = useTexture(memory.image);
  
  // Improve texture sharpness
  useLayoutEffect(() => {
    texture.anisotropy = 16;
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
  }, [texture]);

  // Calculate dynamic dimensions based on image aspect ratio
  const aspect = texture.image.width / texture.image.height;
  
  let width = 2.4 * aspect;
  let height = 2.4;
  
  // Constrain max width so ultra-wide images don't break the layout
  if (width > 3.0) {
    width = 3.0;
    height = 3.0 / aspect;
  }

  const depth = 0.08;

  useFrame((state) => {
    if (!meshRef.current) return;

    // Calculate distance between camera and this panel on Z axis
    const cameraZ = state.camera.position.z;
    const panelZ = memory.position[2];
    const distance = Math.abs(cameraZ - panelZ);

    // Dynamic scaling: scale up slightly when camera is close
    let targetScale = 1.0;

    if (distance < 15) {
      const factor = THREE.MathUtils.clamp((15 - distance) / 12, 0, 1);
      targetScale = 1.0 + factor * 0.12;
    }

    // Apply hovered scale boost (only scale, no brightness change)
    if (hovered) {
      targetScale += 0.06;
    }

    // Smoothly lerp scale
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

    // Smoothly lerp point light intensity
    if (lightRef.current) {
      const targetLightIntensity = hovered ? 2.0 : (distance < 15 ? 1.2 : 0.2);
      lightRef.current.intensity = THREE.MathUtils.lerp(
        lightRef.current.intensity,
        targetLightIntensity,
        0.1
      );
    }
    
    // Subtle look-at camera sway adjustment (locked to Y axis to face camera)
    const cameraX = state.camera.position.x;
    const targetRotationY = (cameraX - memory.position[0]) * 0.05;
    meshRef.current.rotation.y = THREE.MathUtils.lerp(
      meshRef.current.rotation.y,
      targetRotationY,
      0.05
    );
  });

  return (
    <group position={memory.position}>
      {/* Dynamic light casting soft glow behind/around the panel */}
      <pointLight
        ref={lightRef}
        color={memory.glowColor}
        intensity={0.2}
        distance={7}
        decay={2.0}
        position={[0, 0, 0.1]}
      />

      <group ref={meshRef} onClick={onClick}>
        {/* Dark thick rounded frame */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[width + 0.15, height + 0.15, depth]} />
          <meshStandardMaterial
            color="#121010"
            roughness={0.7}
            metalness={0.4}
          />
        </mesh>

        {/* Emissive glow border */}
        <mesh position={[0, 0, -0.01]}>
          <boxGeometry args={[width + 0.18, height + 0.18, depth - 0.02]} />
          <meshBasicMaterial
            color={memory.glowColor}
            toneMapped={false}
          />
        </mesh>

        {/* Glowing image screen */}
        <mesh
          position={[0, 0, 0.041]}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <planeGeometry args={[width, height]} />
          {/* Use MeshBasicMaterial for 100% sharpness and unlit natural colors */}
          <meshBasicMaterial
            map={texture}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}
