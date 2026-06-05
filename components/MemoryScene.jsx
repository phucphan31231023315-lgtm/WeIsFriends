'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import PhotoPanel from './PhotoPanel';

export default function MemoryScene({ activePlaceId, memories, onPanelClick, scrollDepth = 55.5 }) {
  const scrollProxy = useRef({ z: 3.5 });
  const particlesRef = useRef(null);
  
  // 5 Curated, gentle Pastel color palettes for the 5 destinations
  const themeColors = useMemo(() => ({
    dalat: {
      spotlight: '#ffb380',     // Soft Pastel Peach-Apricot
      neon: '#ffd1b3',
      particles: '#ffe6d9',
      ceilingGlow: '#ffccaa'
    },
    vungtau: {
      spotlight: '#80c1ff',     // Dreamy Soft Mint-Aqua Blue
      neon: '#b3d9ff',
      particles: '#e6f2ff',
      ceilingGlow: '#cce6ff'
    },
    hatien: {
      spotlight: '#80e699',     // Calming Pastel Sage Green
      neon: '#b3f0c2',
      particles: '#e6faeb',
      ceilingGlow: '#ccf5d6'
    },
    caolanh: {
      spotlight: '#ff80b3',     // Soft Lotus Rose Pink
      neon: '#ffb3d1',
      particles: '#ffe6f0',
      ceilingGlow: '#ffcce0'
    },
    thapcam: {
      spotlight: '#b380ff',     // Gentle Pastel Lilac-Lavender
      neon: '#d9b3ff',
      particles: '#f2e6ff',
      ceilingGlow: '#e6ccff'
    }
  }), []);

  const activeColors = themeColors[activePlaceId] || themeColors.dalat;
  
  // 1. Generate procedural raw concrete texture bump map dynamically
  const concreteTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Base concrete gray
    ctx.fillStyle = '#3a3838';
    ctx.fillRect(0, 0, 512, 512);
    
    // Add noise grain
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const grain = (Math.random() - 0.5) * 48;
      data[i] = Math.min(255, Math.max(0, data[i] + grain));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));
    }
    ctx.putImageData(imgData, 0, 0);
    
    // Draw rough stone cracks & scratches
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 512, 0);
      ctx.lineTo(Math.random() * 512, 512);
      ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 6);
    return texture;
  }, []);

  // 1.5 Generate highly realistic, cinematic procedural diffuse map for the long concrete walls
  const wallDiffuseTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // 1. Fill base elegant warm concrete brown-gray
    ctx.fillStyle = '#3c3633'; 
    ctx.fillRect(0, 0, 2048, 512);
    
    // 2. Add organic plaster patch variations (trowel marks)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      const rx = Math.random() * 2048;
      const ry = Math.random() * 512;
      const radiusX = 150 + Math.random() * 150;
      const radiusY = 80 + Math.random() * 80;
      ctx.ellipse(rx, ry, radiusX, radiusY, Math.random() * Math.PI, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.035)';
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      const rx = Math.random() * 2048;
      const ry = Math.random() * 512;
      const radiusX = 200 + Math.random() * 200;
      const radiusY = 100 + Math.random() * 100;
      ctx.ellipse(rx, ry, radiusX, radiusY, Math.random() * Math.PI, 0, 2 * Math.PI);
      ctx.fill();
    }

    // 3. Add very light noise / grain for plaster grittiness
    const imgData = ctx.getImageData(0, 0, 2048, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 8;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
      data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // 4. Subtle vertical stains / water drips
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * 2048;
      const length = 50 + Math.random() * 250;
      const opacity = 0.02 + Math.random() * 0.05;
      
      const grad = ctx.createLinearGradient(x, 0, x, length);
      grad.addColorStop(0, `rgba(18, 15, 14, ${opacity})`);
      grad.addColorStop(1, 'rgba(18, 15, 14, 0)');
      
      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, 1 + Math.random() * 3, length);
    }

    // 5. Pre-baked warm spotlight glowing patches
    // Spotlights located at Z = 8, -8, -24, -40, -54 and continuing into the far distance
    const lightZ = [8, -8, -24, -40, -54, -70, -86, -102];
    lightZ.forEach(z => {
      const x = 2048 * (12 - z) / 132;
      const grad = ctx.createRadialGradient(x, 40, 0, x, 40, 300);
      grad.addColorStop(0, 'rgba(245, 158, 11, 0.06)'); // soft gold highlight
      grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.02)');
      grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, 40, 300, 0, 2 * Math.PI);
      ctx.fill();
    });

    // 6. Pre-baked ambient occlusion column shadows
    // Columns placed every 8 units from Z = 12 down to -120
    for (let i = 0; i <= 17; i++) {
      const x = 2048 * (i * 8) / 132;
      // Draw a soft black shadow strip next to the column line
      const shadowGrad = ctx.createLinearGradient(x - 25, 0, x + 25, 0);
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      shadowGrad.addColorStop(0.4, 'rgba(15, 12, 11, 0.16)');
      shadowGrad.addColorStop(0.5, 'rgba(15, 12, 11, 0.22)'); // core contact shadow
      shadowGrad.addColorStop(0.6, 'rgba(15, 12, 11, 0.16)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(x - 25, 0, 50, 512);
    }

    // 7. Darker gradient near the bottom (y = 512)
    const bottomGrad = ctx.createLinearGradient(0, 0, 0, 512);
    bottomGrad.addColorStop(0, 'rgba(15, 12, 11, 0)');
    bottomGrad.addColorStop(0.6, 'rgba(15, 12, 11, 0.4)');
    bottomGrad.addColorStop(0.85, 'rgba(15, 12, 11, 0.85)');
    bottomGrad.addColorStop(1, 'rgba(15, 12, 11, 0.98)');
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(0, 0, 2048, 512);

    // 8. Ceiling shadow gradient
    const topGrad = ctx.createLinearGradient(0, 0, 0, 512);
    topGrad.addColorStop(0, 'rgba(10, 8, 7, 0.55)');
    topGrad.addColorStop(0.2, 'rgba(10, 8, 7, 0.15)');
    topGrad.addColorStop(0.4, 'rgba(10, 8, 7, 0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, 2048, 512);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  // 1.8 Generate highly realistic, cinematic procedural diffuse map for the concrete ceiling
  const ceilingDiffuseTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    
    // 1. Fill base dark concrete gray (not pure black)
    ctx.fillStyle = '#2c2826'; 
    ctx.fillRect(0, 0, 1024, 2048);
    
    // 2. Add organic plaster patch variations
    ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
    for (let i = 0; i < 25; i++) {
      ctx.beginPath();
      const rx = Math.random() * 1024;
      const ry = Math.random() * 2048;
      const radiusX = 120 + Math.random() * 120;
      const radiusY = 250 + Math.random() * 250;
      ctx.ellipse(rx, ry, radiusX, radiusY, Math.random() * Math.PI, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    for (let i = 0; i < 25; i++) {
      ctx.beginPath();
      const rx = Math.random() * 1024;
      const ry = Math.random() * 2048;
      const radiusX = 150 + Math.random() * 150;
      const radiusY = 300 + Math.random() * 300;
      ctx.ellipse(rx, ry, radiusX, radiusY, Math.random() * Math.PI, 0, 2 * Math.PI);
      ctx.fill();
    }

    // 3. Add very light noise / grain for plaster grittiness
    const imgData = ctx.getImageData(0, 0, 1024, 2048);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 8;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
      data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // 4. Pre-baked warm central light gradient running down the center (X = 512)
    const centralGrad = ctx.createLinearGradient(0, 0, 1024, 0);
    centralGrad.addColorStop(0, 'rgba(245, 158, 11, 0)');
    centralGrad.addColorStop(0.25, 'rgba(245, 158, 11, 0.01)');
    centralGrad.addColorStop(0.40, 'rgba(245, 158, 11, 0.03)');
    centralGrad.addColorStop(0.50, 'rgba(245, 158, 11, 0.065)'); // soft glowing core
    centralGrad.addColorStop(0.60, 'rgba(245, 158, 11, 0.03)');
    centralGrad.addColorStop(0.75, 'rgba(245, 158, 11, 0.01)');
    centralGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    
    ctx.fillStyle = centralGrad;
    ctx.fillRect(0, 0, 1024, 2048);

    // 5. Pre-baked reflected glows from the arch lights (spaced every 8 units)
    // Z starts at 12 and goes down to -120
    for (let i = 0; i <= 17; i++) {
      const y = 2048 * (i * 8) / 132;
      // Draw horizontally stretched reflection highlights across the width
      const archGlow = ctx.createRadialGradient(512, y, 0, 512, y, 220);
      archGlow.addColorStop(0, 'rgba(255, 235, 215, 0.055)'); // soft bounce highlight
      archGlow.addColorStop(0.4, 'rgba(255, 235, 215, 0.02)');
      archGlow.addColorStop(1, 'rgba(255, 235, 215, 0)');
      
      ctx.fillStyle = archGlow;
      ctx.beginPath();
      ctx.ellipse(512, y, 400, 70, 0, 0, 2 * Math.PI);
      ctx.fill();
    }

    // 6. Longitudinal recessed panel seams running vertically
    const seams = [512 - 180, 512, 512 + 180];
    seams.forEach(x => {
      // 6a. Dark seam groove
      ctx.strokeStyle = 'rgba(12, 10, 9, 0.65)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 2048);
      ctx.stroke();

      // 6b. Faint highlight lip to simulate 3D recess depth reflection
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 1.5, 0);
      ctx.lineTo(x + 1.5, 2048);
      ctx.stroke();
    });

    // 7. Longitudinal shadows near the side edges (vignette shading)
    const edgeShadow = ctx.createLinearGradient(0, 0, 1024, 0);
    edgeShadow.addColorStop(0, 'rgba(10, 8, 7, 0.65)');
    edgeShadow.addColorStop(0.12, 'rgba(10, 8, 7, 0.2)');
    edgeShadow.addColorStop(0.3, 'rgba(10, 8, 7, 0)');
    edgeShadow.addColorStop(0.7, 'rgba(10, 8, 7, 0)');
    edgeShadow.addColorStop(0.88, 'rgba(10, 8, 7, 0.2)');
    edgeShadow.addColorStop(1, 'rgba(10, 8, 7, 0.65)');
    ctx.fillStyle = edgeShadow;
    ctx.fillRect(0, 0, 1024, 2048);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  // 2. Generate premium high-gloss grid tile layout texture for the floor
  const floorGridTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Base tile dark charcoal (low roughness value)
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 1024, 1024);
    
    // Draw tile mortar seams with a slightly lighter color (representing higher roughness inside the seams)
    ctx.strokeStyle = '#3c3c3c';
    ctx.lineWidth = 6;
    const tileSize = 128; // 1024 / 8 tiles
    for (let x = 0; x <= 1024; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1024);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, x);
      ctx.lineTo(1024, x);
      ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 60);
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    return texture;
  }, []);

  // 3. Generate soft circular glowing light spots (embers) texture procedurally (grayscale for dynamic tinting)
  const glowTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Create radial glow gradient (pure white alpha mask to allow dynamic R3F material color tinting)
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');     // Bright core
    grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.75)');   // Soft glow
    grad.addColorStop(0.55, 'rgba(255, 255, 255, 0.22)');   // Fading edge
    grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');    // Fully transparent
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  // 4. Generate warm amber embers/dust particle positions in a cylindrical volume matching the arched tunnel
  const [particlePositions, particleSpeeds] = useMemo(() => {
    const count = 350;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Cylindrical distribution: top semi-circle centered at [0, -1.0] with radius 4.2
      const angle = Math.random() * Math.PI;
      const r = 0.2 + Math.random() * 4.0;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = Math.max(0.05, -1.0 + Math.sin(angle) * r); // keep above floor level
      // Spanning from z = 12 to z = -120
      positions[i * 3 + 2] = 12 + Math.random() * -132; // Z depth
      speeds[i] = 0.001 + Math.random() * 0.002;     // Drift speed
    }
    return [positions, speeds];
  }, []);

  useEffect(() => {
    // Register GSAP ScrollTrigger on client-side only
    gsap.registerPlugin(ScrollTrigger);

    const trigger = ScrollTrigger.create({
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.6, // buttery smooth scrub with momentum
      onUpdate: (self) => {
        // Map scroll progress (0 to 1) to camera Z position
        // From Z = 3.5 (start) down dynamically based on number of memories
        scrollProxy.current.z = 3.5 + self.progress * -scrollDepth;
      }
    });

    return () => {
      trigger.kill();
    };
  }, [scrollDepth]);

  const getCameraPathX = (z) => {
    // Extended zigzag path to keep organic feel throughout the full tunnel depth
    const path = [
      { z:   3.5, x:  0.0 },
      { z:  -8,   x: -1.2 },
      { z: -16,   x:  1.2 },
      { z: -24,   x: -1.0 },
      { z: -32,   x:  1.0 },
      { z: -40,   x: -1.1 },
      { z: -48,   x:  0.0 },
      { z: -60,   x:  0.0 },
      { z: -68,   x: -1.2 },
      { z: -76,   x:  1.2 },
      { z: -84,   x: -1.0 },
      { z: -92,   x:  1.0 },
      { z: -100,  x: -1.1 },
      { z: -108,  x:  0.0 },
      { z: -120,  x:  0.0 },
      { z: -128,  x: -1.2 },
      { z: -136,  x:  1.2 },
      { z: -144,  x: -1.0 },
      { z: -160,  x:  0.0 },
    ];

    for (let i = 0; i < path.length - 1; i++) {
      const k1 = path[i];
      const k2 = path[i + 1];
      if (z <= k1.z && z >= k2.z) {
        const range = k1.z - k2.z;
        if (range === 0) return k1.x; // prevent division by zero
        const progress = (k1.z - z) / range;
        // Cosine smoothing for rounded, organic bends
        const smoothProgress = Math.sin(progress * Math.PI - Math.PI / 2) * 0.5 + 0.5;
        return k1.x + smoothProgress * (k2.x - k1.x);
      }
    }
    return 0;
  };

  useFrame((state) => {
    // 1. Get base Z position from scroll proxy
    const targetZ = scrollProxy.current.z;
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.08);

    // 2. Compute base X position based on current camera Z along the zigzag path
    const basePathX = getCameraPathX(state.camera.position.z);

    // 3. Cinematic handheld camera sway (subtle breathing effect)
    const time = state.clock.getElapsedTime();
    const swayX = Math.sin(time * 0.5) * 0.04;
    const swayY = Math.cos(time * 0.35) * 0.025;

    // Combine zigzag path X with micro sway
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, basePathX + swayX, 0.08);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 1.5 + swayY, 0.08);

    // Rotate camera slightly in the direction of travel to simulate banking
    const lookOffset = (basePathX - state.camera.position.x) * 0.15;
    state.camera.rotation.y = THREE.MathUtils.lerp(state.camera.rotation.y, (swayX * 0.15) + lookOffset, 0.08);
    state.camera.rotation.x = THREE.MathUtils.lerp(state.camera.rotation.x, -swayY * 0.08, 0.08);

    // 4. Animate floating amber embers drift
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      const count = positions.length / 3;
      for (let i = 0; i < count; i++) {
        // Slow float upwards
        positions[i * 3 + 1] += Math.sin(time * 0.4 + i) * 0.0006 + speeds[i];
        // Slow lateral drift
        positions[i * 3] += Math.cos(time * 0.25 + i) * 0.0004;
        
        // Reset if particles float above the ceiling
        if (positions[i * 3 + 1] > 4.2) {
          positions[i * 3 + 1] = 0.05;
          positions[i * 3] = (Math.random() - 0.5) * 12;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const speeds = Array.from(particleSpeeds);
  const wallWidth = 9.0; // Increased width for a wider, more majestic corridor feeling
  
  // Shift the entire corridor to enclose the camera at its starting position (z = 3.5)
  const startZ = 12;      // Corridor start position (behind the camera's initial position)
  const endZ = -(scrollDepth + 12); // Extend corridor dynamically past camera's final position
  const corridorLength = startZ - endZ;      // dynamic
  const corridorCenterZ = (startZ + endZ) / 2; // dynamic center

  // Update floor texture tiling to match corridor length (keeps grid density consistent)
  if (floorGridTexture) {
    floorGridTexture.repeat.set(4, Math.round(corridorLength * 0.45));
  }
  
  const segmentSpacing = 8;
  const totalSegments = Math.ceil(corridorLength / segmentSpacing) + 1;
  const segments = Array.from({ length: totalSegments });

  // Calculate distance-based opacity decay for neon glow elements — fades toward end of corridor
  const getGlowOpacity = (z) => {
    const startFade = -10;
    const endFade = endZ + 10; // fade to near end of corridor (dynamic)
    if (z > startFade) return 1.0;
    if (z < endFade) return 0.01;
    const factor = (z - startFade) / (endFade - startFade);
    return 1.0 - factor * 0.99;
  };

  return (
    <>
      {/* Raised ambient light to reveal concrete boundaries and columns in shaded parts */}
      <ambientLight intensity={1.1} />

      {/* Dynamic warm cinematic spotlights — auto-generated every 16 units across the full corridor */}
      {Array.from({ length: Math.ceil(corridorLength / 16) + 1 }, (_, i) => {
        const z = startZ - 4 - i * 16; // first light near z=8, then -8, -24, -40...
        if (z < endZ) return null;
        // Lights near camera start are slightly brighter
        const intensity = i < 4 ? 150 : 120;
        const distance = i < 4 ? 30 : 26;
        return (
          <pointLight
            key={`ceiling-light-${i}`}
            color={activeColors.spotlight}
            intensity={intensity}
            distance={distance}
            decay={2.0}
            position={[0, 3.2, z]}
          />
        );
      })}

      {/* 1. Glossy Reflective Floor (Rich Dark Granite Tile Layout) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, corridorCenterZ]} receiveShadow>
        <planeGeometry args={[wallWidth, corridorLength]} />
        <MeshReflectorMaterial
          blur={[10, 10]}
          resolution={1024}
          mixBlur={0.25}
          mixStrength={90}
          roughness={0.03}
          roughnessMap={floorGridTexture} /* procedural dark tiled texture roughness mapping */
          depthScale={1.3}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.5}
          color="#181515" /* brightened base color to reflect light more vibrantly */
          metalness={0.9}
        />
      </mesh>

      {/* 2. Left Concrete Wall (Subtle Concrete Plaster Texture) */}
      <mesh position={[-wallWidth / 2, 1.75, corridorCenterZ]} receiveShadow>
        <boxGeometry args={[0.08, 3.5, corridorLength]} />
        <meshStandardMaterial 
          map={wallDiffuseTexture}
          roughness={0.75} 
          metalness={0.12} 
          bumpMap={concreteTexture} /* procedural stone roughness grain bump mapping */
          bumpScale={0.05}
        />
      </mesh>

      {/* 3. Right Concrete Wall (Subtle Concrete Plaster Texture) */}
      <mesh position={[wallWidth / 2, 1.75, corridorCenterZ]} receiveShadow>
        <boxGeometry args={[0.08, 3.5, corridorLength]} />
        <meshStandardMaterial 
          map={wallDiffuseTexture}
          roughness={0.75} 
          metalness={0.12} 
          bumpMap={concreteTexture}
          bumpScale={0.05}
        />
      </mesh>

      {/* 4. Concrete Ceiling (Procedural Panel Texturing & Ambient Glows) */}
      <mesh position={[0, 3.5, corridorCenterZ]} receiveShadow>
        <boxGeometry args={[wallWidth, 0.08, corridorLength]} />
        <meshStandardMaterial 
          map={ceilingDiffuseTexture}
          roughness={0.72} 
          metalness={0.12} 
          bumpMap={concreteTexture}
          bumpScale={0.045}
        />
      </mesh>

      {/* 5. Repeated structural elements along the corridor */}
      {segments.map((_, i) => {
        const z = startZ - i * segmentSpacing;
        const opacity = getGlowOpacity(z);
        return (
          <group key={i}>
            {/* Left Pillar (Smooth Cylinder Column - Soft specular lighting highlights) */}
            <mesh position={[-wallWidth / 2 + 0.18, 1.75, z]} castShadow receiveShadow>
              <cylinderGeometry args={[0.15, 0.15, 3.5, 24]} />
              <meshStandardMaterial 
                color="#484141" 
                roughness={0.65} 
                metalness={0.25} 
                bumpMap={concreteTexture}
                bumpScale={0.03}
              />
            </mesh>

            {/* Right Round Pillar (Smooth Cylinder Column - Soft specular lighting highlights) */}
            <mesh position={[wallWidth / 2 - 0.18, 1.75, z]} castShadow receiveShadow>
              <cylinderGeometry args={[0.15, 0.15, 3.5, 24]} />
              <meshStandardMaterial 
                color="#484141" 
                roughness={0.65} 
                metalness={0.25} 
                bumpMap={concreteTexture}
                bumpScale={0.03}
              />
            </mesh>

            {/* Glowing Volumetric Semi-Cylindrical Archway (Softens Ceiling Ribs with dynamic circular lines) */}
            <mesh position={[0, -1.0, z]}>
              <torusGeometry args={[4.5, 0.045, 12, 48, Math.PI]} />
              <meshBasicMaterial 
                color={activeColors.neon} 
                toneMapped={false} 
                transparent
                opacity={opacity}
              />
            </mesh>
            
            {/* Ambient Wall Segments (Bolder Glowing Dynamic Perspective Lines) */}
            <mesh position={[-wallWidth / 2 + 0.03, 1.4, z]}>
              <boxGeometry args={[0.04, 0.04, 3.0]} />
              <meshBasicMaterial 
                color={activeColors.neon} 
                toneMapped={false} 
                transparent
                opacity={opacity}
              />
            </mesh>
            <mesh position={[wallWidth / 2 - 0.03, 1.4, z]}>
              <boxGeometry args={[0.04, 0.04, 3.0]} />
              <meshBasicMaterial 
                color={activeColors.neon} 
                toneMapped={false} 
                transparent
                opacity={opacity}
              />
            </mesh>
          </group>
        );
      })}

      {/* Endless Golden Strip Lights running along top ceiling edges (Thicker & Brighter) */}
      <mesh position={[-wallWidth / 2 + 0.04, 3.46, corridorCenterZ]}>
        <boxGeometry args={[0.08, 0.08, corridorLength]} />
        <meshBasicMaterial color={activeColors.neon} toneMapped={false} />
      </mesh>
      <mesh position={[wallWidth / 2 - 0.04, 3.46, corridorCenterZ]}>
        <boxGeometry args={[0.08, 0.08, corridorLength]} />
        <meshBasicMaterial color={activeColors.neon} toneMapped={false} />
      </mesh>

      {/* Endless Dynamic Neon Tracks running along bottom floor edges (Defining spatial boundaries) */}
      <mesh position={[-wallWidth / 2 + 0.04, 0.04, corridorCenterZ]}>
        <boxGeometry args={[0.06, 0.06, corridorLength]} />
        <meshBasicMaterial color={activeColors.neon} toneMapped={false} />
      </mesh>
      <mesh position={[wallWidth / 2 - 0.04, 0.04, corridorCenterZ]}>
        <boxGeometry args={[0.06, 0.06, corridorLength]} />
        <meshBasicMaterial color={activeColors.neon} toneMapped={false} />
      </mesh>

      {/* 6. Floating Dynamic Ember/Dust Particles (Soft Glowing Circular Spots) */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color={activeColors.particles}
          size={0.15} /* Increased size for soft glowing spots */
          map={glowTexture} /* procedurally generated soft glow circular map */
          transparent
          opacity={0.85}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Distant volumetric central glow — positioned just past the last photo (dynamic endZ) */}
      <mesh position={[0, -1.0, endZ + 6]}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial
          map={glowTexture}
          color={activeColors.spotlight}
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Render memories Photo Panels */}
      {memories.map((memory) => (
        <PhotoPanel
          key={memory.id}
          memory={memory}
          onClick={() => onPanelClick(memory)}
        />
      ))}
    </>
  );
}
