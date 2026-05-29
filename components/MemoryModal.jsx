'use client';

import { useEffect, useState } from 'react';

export default function MemoryModal({ memory, isOpen, onClose }) {
  const [shouldRender, setShouldRender] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Let standard flow handle the entry animation in next tick
      const timer = setTimeout(() => {
        setAnimate(true);
        // Pause scroll using Lenis
        if (window.lenis) {
          window.lenis.stop();
        }
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setAnimate(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
        // Resume scroll using Lenis
        if (window.lenis) {
          window.lenis.start();
        }
      }, 400); // match transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Prevent scroll when modal is active (fallback standard browser scroll block)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!shouldRender || !memory) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/40 backdrop-blur-[8px] transition-opacity duration-500 ease-out ${
        animate ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      {/* Modal Box */}
      <div
        className={`relative max-w-4xl w-full bg-white/[0.03] border border-white/15 rounded-[28px] overflow-hidden backdrop-blur-[24px] flex flex-col md:flex-row transition-all duration-500 ease-out transform ${
          animate ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-8 opacity-0'
        }`}
        style={{
          boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.08) inset, 0 25px 80px -15px rgba(0, 0, 0, 0.95)',
        }}
        onClick={(e) => e.stopPropagation()} // stop close on clicking content
      >
        {/* Dynamic Blurred Background Image Layer */}
        <div className="absolute inset-0 -z-20 overflow-hidden pointer-events-none select-none">
          <img
            src={memory.image}
            alt=""
            className="w-full h-full object-cover filter blur-[50px] scale-110 opacity-60 saturate-[1.3]"
          />
          {/* Dark overlay to balance the colors and maintain high contrast */}
          <div className="absolute inset-0 bg-neutral-950/45" />
        </div>

        {/* Ambient Glow Gradients (Warm Orange & Green) */}
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden select-none">
          {/* Warm Orange Glow - top left */}
          <div 
            className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] rounded-full blur-[80px] opacity-45"
            style={{
              background: 'radial-gradient(circle, rgba(249,115,22,0.5) 0%, rgba(249,115,22,0.15) 60%, rgba(0,0,0,0) 100%)'
            }}
          />
          {/* Green Glow - bottom right */}
          <div 
            className="absolute -bottom-[20%] -right-[10%] w-[80%] h-[80%] rounded-full blur-[80px] opacity-45"
            style={{
              background: 'radial-gradient(circle, rgba(34,197,94,0.4) 0%, rgba(16,185,129,0.12) 60%, rgba(0,0,0,0) 100%)'
            }}
          />
        </div>

        {/* Fine grain noise layer */}
        <div 
          className="absolute inset-0 -z-10 pointer-events-none opacity-[0.045] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }}
        />

        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-neutral-300 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-full p-2.5 transition-all hover:scale-110 active:scale-95 duration-300 shadow-md backdrop-blur-md"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Column 1: Cinematic Image Container */}
        <div className="w-full md:w-3/5 relative aspect-[4/5] md:aspect-auto md:h-[65vh] bg-black/15 overflow-hidden flex items-center justify-center">
          <img
            src={memory.image}
            alt={memory.title}
            className="w-full h-full object-contain transition-transform duration-700 ease-out hover:scale-[1.02]"
            loading="lazy"
          />
        </div>

        {/* Column 2: Memory Metadata & Story */}
        <div className="w-full md:w-2/5 p-6 md:p-10 flex flex-col justify-center bg-white/[0.01] backdrop-blur-sm border-t md:border-t-0 md:border-l border-white/10 relative z-10">
          
          <h2 className="text-2xl md:text-3xl font-light tracking-wide text-white mb-4">
            {memory.title}
          </h2>

          {/* Glowing Accent divider line */}
          <div
            className="w-12 h-[2px] rounded-full mb-6"
            style={{
              backgroundColor: memory.glowColor,
              boxShadow: `0 0 10px ${memory.glowColor}, 0 0 20px ${memory.glowColor}`,
            }}
          />

          <p className="text-sm md:text-base text-neutral-100 leading-relaxed font-light font-sans">
            {memory.caption}
          </p>
          
        </div>
      </div>
    </div>
  );
}
