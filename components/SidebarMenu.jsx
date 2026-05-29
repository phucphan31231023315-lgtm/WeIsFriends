'use client';

import { useState, useEffect, useRef } from 'react';

export default function SidebarMenu({ places, activePlaceId, onPlaceSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div 
      ref={menuRef} 
      className="relative z-30 select-none w-fit"
    >
      {/* Floating Trạm Dừng trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-5 py-3 border border-neutral-800/80 hover:border-amber-500/50 bg-black/60 hover:bg-neutral-900/60 rounded-full text-[10px] tracking-[0.25em] font-sans font-bold uppercase transition-all duration-300 backdrop-blur-md shadow-lg group"
        style={{
          boxShadow: isOpen ? '0 0 20px rgba(245, 158, 11, 0.15)' : 'none',
          borderColor: isOpen ? 'rgba(245, 158, 11, 0.5)' : 'rgba(38, 38, 38, 0.8)'
        }}
      >
        {/* Animated Location Pin Icon */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          className={`w-3.5 h-3.5 text-amber-500 transition-transform duration-300 ${isOpen ? 'scale-110' : 'group-hover:translate-y-[-1px]'}`}
        >
          <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
          <circle cx="12" cy="10" r="3" />
        </svg>

        <span className="text-neutral-200 group-hover:text-white transition-colors duration-300">
          TRẠM DỪNG
        </span>

        {/* Dropdown indicator (rotating arrow) */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          className={`w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-200 transition-transform duration-300 ${isOpen ? 'rotate-180 text-amber-500' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Styled Dropdown List */}
      <div
        className={`absolute left-0 mt-3 w-64 bg-black/85 backdrop-blur-xl border border-neutral-800/80 rounded-2xl p-3 shadow-2xl transition-all duration-300 origin-top-left ${
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="text-[8px] font-mono tracking-[0.2em] text-neutral-500 uppercase px-3 py-1 border-b border-neutral-900/50 mb-2">
          Chọn điểm đến
        </div>

        <div className="flex flex-col gap-1">
          {places.map((place) => {
            const isActive = place.id === activePlaceId;
            
            return (
              <button
                key={place.id}
                onClick={() => {
                  onPlaceSelect(place.id);
                  setIsOpen(false);
                }}
                className="group flex items-center justify-between w-full text-left px-3 py-2.5 rounded-xl transition-all duration-300"
                style={{
                  background: isActive ? 'rgba(245, 158, 11, 0.08)' : 'transparent'
                }}
              >
                <div className="flex items-center gap-3.5">
                  <span 
                    className={`text-[9px] font-mono tracking-[0.1em] w-5 text-center ${
                      isActive ? 'text-amber-500 font-bold' : 'text-neutral-500 group-hover:text-amber-500/80 transition-colors'
                    }`}
                  >
                    {place.prefix}
                  </span>
                  <span 
                    className={`text-xs uppercase tracking-[0.15em] transition-all duration-300 ${
                      isActive 
                        ? 'text-white font-medium translate-x-1' 
                        : 'text-neutral-400 group-hover:text-neutral-200'
                    }`}
                  >
                    {place.name}
                  </span>
                </div>

                {/* Small indicator when active */}
                {isActive ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b]" />
                ) : (
                  <div className="w-1 h-1 rounded-full bg-transparent group-hover:bg-neutral-700 transition-colors" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
