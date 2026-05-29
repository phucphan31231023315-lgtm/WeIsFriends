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
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-md transition-opacity duration-500 ease-out ${
        animate ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      {/* Modal Box */}
      <div
        className={`relative max-w-4xl w-full bg-neutral-950/70 border border-neutral-800/80 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col md:flex-row transition-all duration-500 ease-out transform ${
          animate ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()} // stop close on clicking content
      >
        {/* Floating Close Button (Top-Right on Mobile, absolute on box) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-neutral-400 hover:text-white bg-black/40 hover:bg-neutral-900/60 border border-neutral-800/80 rounded-full p-2.5 transition-all hover:scale-110 active:scale-95 duration-300"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Column 1: Cinematic Image Container */}
        <div className="w-full md:w-3/5 relative aspect-[4/5] md:aspect-auto md:h-[65vh] bg-black/60 overflow-hidden">

          <img
            src={memory.image}
            alt={memory.title}
            className="w-full h-full object-contain transition-transform duration-700 ease-out hover:scale-105"
            loading="lazy"
          />
        </div>

        {/* Column 2: Memory Metadata & Story */}
        <div className="w-full md:w-2/5 p-6 md:p-10 flex flex-col justify-between bg-gradient-to-b from-neutral-900/20 via-neutral-950/50 to-neutral-950/80 border-t md:border-t-0 md:border-l border-neutral-900/80">
          
          {/* Top content */}
          <div>

            <h2 className="text-2xl md:text-3xl font-light tracking-wide text-white mb-4">
              {memory.title}
            </h2>

            {/* Glowing Accent divider line */}
            <div
              className="w-12 h-[2px] rounded-full mb-6"
              style={{
                backgroundColor: memory.glowColor,
                boxShadow: `0 0 8px ${memory.glowColor}`,
              }}
            />

            <p className="text-sm md:text-base text-neutral-300 leading-relaxed font-light font-sans mb-8">
              {memory.caption}
            </p>
          </div>


          
        </div>
      </div>
    </div>
  );
}
