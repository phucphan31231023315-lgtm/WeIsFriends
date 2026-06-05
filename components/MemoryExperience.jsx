'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import MemoryModal from './MemoryModal';
import SidebarMenu from './SidebarMenu';

// Dynamically import the Canvas container with SSR disabled to prevent Node.js build errors
const MemoryCanvas = dynamic(() => import('./MemoryCanvas'), { ssr: false });

export default function MemoryExperience() {
  const [places, setPlaces] = useState(null);
  const [activePlaceId, setActivePlaceId] = useState(null);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [synthNodes, setSynthNodes] = useState(null);
  const [introOpacity, setIntroOpacity] = useState(1);
  const [introY, setIntroY] = useState(0);

  // Fetch places data from the new API
  useEffect(() => {
    fetch('/api/memories')
      .then(res => res.json())
      .then(data => {
        setPlaces(data);
        setActivePlaceId(data[0].id);
      })
      .catch(err => console.error('Failed to load memories:', err));
  }, []);

  const activePlace = places?.find(p => p.id === activePlaceId) || places?.[0];
  const activeMemories = activePlace?.memories || [];

  // Dynamically compute scroll depth based on the deepest memory position
  const maxMemoryDepth = activeMemories.length > 0
    ? Math.max(...activeMemories.map(m => Math.abs(m.position[2])))
    : 40;
  // Camera needs to travel past the last image + 15 units buffer
  const scrollDepth = Math.max(55.5, maxMemoryDepth + 15);
  // Scale page height proportionally so scroll range matches camera travel
  const pageHeightVh = Math.max(500, Math.round((scrollDepth / 55.5) * 500 / 50) * 50);

  // Monitor scroll for fading UI elements (like scroll indicator)
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset tagline/description overlay transition values on place change
  useEffect(() => {
    if (!activePlaceId) return;
    setIntroOpacity(0);
    setIntroY(20);
    const fadeInTimer = setTimeout(() => {
      setIntroOpacity(1);
      setIntroY(0);
    }, 50);
    return () => clearTimeout(fadeInTimer);
  }, [activePlaceId]);

  const htmlAudioRef = useRef(null);

  // Stop procedural synthesizer drone
  const stopSynth = (nodes) => {
    const targetNodes = nodes || synthNodes;
    if (!targetNodes) return;
    const { ctx, oscs, gainNode } = targetNodes;
    try {
      gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.0);
      setTimeout(() => {
        oscs.forEach(osc => {
          try { osc.stop(); } catch(e){}
        });
        try { ctx.close(); } catch(e){}
      }, 1100);
    } catch(e) {
      console.error('Error stopping synth:', e);
    }
  };

  // Start procedural synthesizer drone
  const startSynth = async (placeId) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 2.0);
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, ctx.currentTime);

      gainNode.connect(filter);
      filter.connect(ctx.destination);

      const chords = {
        dalat: [32.7, 49.0, 65.4, 82.41],
        vungtau: [34.6, 51.9, 69.3, 82.41],
        hatien: [39.2, 58.7, 78.4, 98.0],
        caolanh: [41.2, 61.7, 82.4, 103.82],
        thapcam: [36.7, 55.0, 73.4, 87.31]
      };
      
      const currentPlaceId = placeId || activePlaceId;
      const frequencies = chords[currentPlaceId] || chords.dalat;
      
      const oscs = frequencies.map((freq, index) => {
        const osc = ctx.createOscillator();
        osc.type = index % 2 === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.detune.setValueAtTime((Math.random() - 0.5) * 12, ctx.currentTime);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.25, ctx.currentTime);

        osc.connect(oscGain);
        oscGain.connect(gainNode);
        osc.start();
        
        const modTime = 6 + index * 2;
        const modulateVolume = () => {
          if (ctx.state === 'closed') return;
          try {
            oscGain.gain.setValueAtTime(oscGain.gain.value, ctx.currentTime);
            oscGain.gain.linearRampToValueAtTime(0.15 + Math.random() * 0.25, ctx.currentTime + modTime);
            setTimeout(modulateVolume, modTime * 1000);
          } catch(e) {}
        };
        setTimeout(modulateVolume, 100);

        return osc;
      });

      setSynthNodes({ ctx, oscs, gainNode });
    } catch (err) {
      console.error('Failed to initialize AudioContext synth:', err);
    }
  };

  // Play custom HTML5 Audio with smooth volume fade-in
  const playHtmlAudio = (src) => {
    // Fade out previous audio if exists
    if (htmlAudioRef.current) {
      const prevAudio = htmlAudioRef.current;
      let vol = prevAudio.volume;
      const fadeOut = setInterval(() => {
        if (vol > 0.05) {
          vol -= 0.05;
          prevAudio.volume = vol;
        } else {
          clearInterval(fadeOut);
          prevAudio.pause();
        }
      }, 50);
    }

    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0;
    htmlAudioRef.current = audio;

    audio.play().then(() => {
      // Fade in new audio
      let vol = 0;
      const fadeIn = setInterval(() => {
        if (vol < 0.35) {
          vol += 0.02;
          audio.volume = vol;
        } else {
          clearInterval(fadeIn);
        }
      }, 50);
    }).catch(err => {
      console.warn('MP3 Audio track not found or blocked, falling back to Web Audio Synth drone:', err);
      // Fallback to real-time procedural synthesizer drone
      startSynth(activePlaceId);
    });
  };

  // Stop custom HTML5 Audio with smooth fade-out
  const stopHtmlAudio = () => {
    if (htmlAudioRef.current) {
      const audio = htmlAudioRef.current;
      let vol = audio.volume;
      const fadeOut = setInterval(() => {
        if (vol > 0.03) {
          vol -= 0.03;
          audio.volume = vol;
        } else {
          clearInterval(fadeOut);
          audio.pause();
          htmlAudioRef.current = null;
        }
      }, 50);
    }
  };

  // Toggle dynamic sound engine (ON/OFF)
  const toggleAudio = async () => {
    if (audioEnabled) {
      // Turn sound OFF
      stopSynth();
      stopHtmlAudio();
      setSynthNodes(null);
      setAudioEnabled(false);
    } else {
      // Turn sound ON
      setAudioEnabled(true);
      if (activePlace && activePlace.bgMusic) {
        playHtmlAudio(activePlace.bgMusic);
      } else {
        startSynth(activePlaceId);
      }
    }
  };

  // Smooth audio crossfades / glissandos when destination changes
  useEffect(() => {
    if (!audioEnabled) return;

    if (activePlace && activePlace.bgMusic) {
      // Switch to HTML5 MP3 Audio Track
      stopSynth();
      setSynthNodes(null);
      playHtmlAudio(activePlace.bgMusic);
    } else {
      // Switch to Synthesized Chord
      stopHtmlAudio();
      
      if (synthNodes) {
        // Glide frequencies smoothly to the new chord (Synthesizer Glissando)
        const { ctx, oscs } = synthNodes;
        if (ctx && ctx.state === 'running') {
          const chords = {
            dalat: [32.7, 49.0, 65.4, 82.41],
            vungtau: [34.6, 51.9, 69.3, 82.41],
            hatien: [39.2, 58.7, 78.4, 98.0],
            caolanh: [41.2, 61.7, 82.4, 103.82],
            thapcam: [36.7, 55.0, 73.4, 87.31]
          };
          const newFreqs = chords[activePlaceId] || chords.dalat;
          oscs.forEach((osc, index) => {
            try {
              osc.frequency.setValueAtTime(osc.frequency.value, ctx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(newFreqs[index], ctx.currentTime + 1.5);
            } catch(e) {}
          });
        }
      } else {
        // Start synth if not running
        startSynth(activePlaceId);
      }
    }
  }, [activePlaceId]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (synthNodes) stopSynth(synthNodes);
      if (htmlAudioRef.current) htmlAudioRef.current.pause();
    };
  }, []);

  const handlePanelClick = (memory) => {
    setSelectedMemory(memory);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handlePlaceChange = (placeId) => {
    if (placeId === activePlaceId) return;
    setActivePlaceId(placeId);
    
    // Smooth scroll back to top using Lenis if available, otherwise native
    if (window.lenis) {
      window.lenis.scrollTo(0, { duration: 1.5, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!places || !activePlaceId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050404] text-neutral-500 font-mono text-xs tracking-widest">
        LOADING ARCHIVE...
      </div>
    );
  }

  return (
    <div className="relative w-full text-white" style={{ minHeight: `${pageHeightVh}vh` }}>
      {/* 3D Canvas Scene Background */}
      <MemoryCanvas 
        activePlaceId={activePlaceId}
        memories={activeMemories} 
        onPanelClick={handlePanelClick}
        scrollDepth={scrollDepth}
        colors={activePlace?.colors}
      />

      {/* Screen Grid overlay effect (subtle scanline premium design) */}
      <div className="fixed inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_97%,rgba(0,0,0,0.15)_97%)] bg-[size:100%_4px] opacity-10" />

      {/* HUD OVERLAY - Fixed Interactive UI */}
      <header className="fixed top-0 left-0 w-full z-20 p-6 md:p-8 flex items-start justify-between pointer-events-none">
        {/* Logo / Brand (Left) */}
        <div className="flex flex-col gap-3 pointer-events-auto select-none">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl md:text-3xl font-black tracking-[0.35em] bg-gradient-to-b from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent uppercase font-sans drop-shadow-[0_4px_12px_rgba(255,255,255,0.1)] leading-none py-1">
              TIỆM KÝ ỨC
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm font-bold tracking-[0.25em] text-amber-500">
                // {activePlace.name.toUpperCase()}
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500/80 animate-pulse shadow-[0_0_8px_#f59e0b]" />
            </div>
          </div>

          {/* Left side minimal luxury dropdown menu stacked in-flow! */}
          <div className="my-1">
            <SidebarMenu 
              places={places} 
              activePlaceId={activePlaceId} 
              onPlaceSelect={handlePlaceChange} 
            />
          </div>

          {/* Place Description Panel Overlay */}
          {activePlace.description && (() => {
            const scrollProgress = Math.min(1, scrollY / 300);
            const finalOpacity = Math.max(0, introOpacity * (1 - scrollProgress));
            const finalY = introY + (scrollProgress * -20);
            
            return (
              <div
                style={{
                  opacity: finalOpacity,
                  transform: `translateY(${finalY}px)`,
                  // Bypass transitions while scrolling to ensure instant touch responsiveness, use cubic-bezier for static mount
                  transition: scrollY === 0 ? 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                  pointerEvents: finalOpacity < 0.1 ? 'none' : 'auto'
                }}
                className="flex flex-col gap-1.5 max-w-[360px] select-none mt-2 transition-all duration-300 ease-out"
              >
                {activePlace.tagline && (
                  <span className="text-[10px] md:text-xs font-mono tracking-[0.2em] text-amber-500/90 font-semibold uppercase">
                    {activePlace.tagline}
                  </span>
                )}
                <p className="text-xs md:text-sm tracking-[0.12em] leading-relaxed text-neutral-300 font-sans font-light drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                  {activePlace.description}
                </p>
              </div>
            );
          })()}
        </div>

        {/* Ambience sound controller (Right) */}
        <button
          onClick={toggleAudio}
          className="pointer-events-auto flex items-center gap-3 px-4 py-2 border border-neutral-800/80 hover:border-amber-500/60 bg-black/40 hover:bg-neutral-900/60 rounded-full text-[9px] tracking-[0.2em] font-mono text-neutral-300 transition-all hover:scale-105 active:scale-95 duration-300 backdrop-blur-md shadow-md mt-1 md:mt-2"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              audioEnabled ? 'bg-amber-500 animate-pulse' : 'bg-neutral-600'
            }`}
          />
          SOUND: {audioEnabled ? 'ON' : 'OFF'}
        </button>
      </header>

      {/* Sidebar Menu rendering is now cleanly stacked in-flow inside the Left Brand block */}

      {/* Scroll indicator (Bottom Center) - Fades out on scroll */}
      <div
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center gap-2 transition-all duration-700 select-none"
        style={{
          opacity: scrollY > 80 ? 0 : 0.75,
          transform: `translate(-50%, ${scrollY > 80 ? '20px' : '0px'})`,
        }}
      >
        <span className="text-[8px] font-mono tracking-[0.3em] text-neutral-400 uppercase">
          Scroll to explore
        </span>
        <div className="w-[1px] h-8 bg-gradient-to-b from-neutral-400 to-transparent relative overflow-hidden rounded-full">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-amber-500/80 animate-[scrollLine_2s_infinite]" />
        </div>
      </div>

      {/* Fullscreen Cinematic Story Modal */}
      <MemoryModal
        memory={selectedMemory}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
