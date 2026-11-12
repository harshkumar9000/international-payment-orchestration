import React, { useEffect, useState, useCallback } from 'react';

/**
 * InteractiveSquareCursorGrid
 *
 * Implements:
 * 1. Monochromatic square grid background matching the Dribbble/reference image aesthetic (52px x 52px wireframe boxes).
 *    Subtle, low-opacity ambient grid (opacity ~0.05, strokeWidth 0.5, strokeOpacity 0.3).
 * 2. Radial cursor spotlight: Soft square grid boxes illuminate gently under the mouse as it moves across the landing area.
 * 3. Expanded interactive spotlight response when hovering over "Get Started" or CTA buttons.
 * 4. Reference card geometric accents (ray burst `\ | /` and curved arc `)`) with reduced, elegant opacity.
 * 5. NO artificial/physical cursor icon on top of the mouse — normal system cursor is preserved.
 */
export default function InteractiveSquareCursorGrid({ targetContainerRef }) {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [isInside, setIsInside] = useState(false);
  const [isHoveringCTA, setIsHoveringCTA] = useState(false);

  const handleMouseMove = useCallback((e) => {
    const container = targetContainerRef?.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;

    setMousePos({ x: relX, y: relY });
    setIsInside(true);

    const target = e.target;
    const isCTA = target.closest('#hero-get-started-btn') || 
                  target.closest('[data-cursor="get-started"]') ||
                  target.closest('button');
    setIsHoveringCTA(Boolean(isCTA));
  }, [targetContainerRef]);

  const handleMouseEnter = useCallback(() => {
    setIsInside(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsInside(false);
    setIsHoveringCTA(false);
  }, []);

  useEffect(() => {
    const container = targetContainerRef?.current;
    if (!container) return;

    container.addEventListener('mousemove', handleMouseMove, { passive: true });
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [targetContainerRef, handleMouseMove, handleMouseEnter, handleMouseLeave]);

  const cellSize = 52;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
      
      {/* 1. Base Ambient Square Grid Background (Subtle wireframe square boxes with reduced opacity) */}
      <svg
        className="absolute inset-0 w-full h-full text-white pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.05 }}
      >
        <defs>
          <pattern
            id="monochrome-square-grid"
            width={cellSize}
            height={cellSize}
            patternUnits="userSpaceOnUse"
          >
            <rect
              x="0"
              y="0"
              width={cellSize}
              height={cellSize}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeOpacity="0.3"
            />
            <circle cx={cellSize / 2} cy={cellSize / 2} r="0.5" fill="currentColor" fillOpacity="0.15" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#monochrome-square-grid)" />
      </svg>

      {/* 2. Interactive Spotlight Layer: Soft Square Boxes Illuminate under Cursor */}
      {isInside && (
        <div
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
          style={{
            maskImage: `radial-gradient(${isHoveringCTA ? '400px' : '260px'} circle at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
            WebkitMaskImage: `radial-gradient(${isHoveringCTA ? '400px' : '260px'} circle at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`
          }}
        >
          <svg className="w-full h-full text-white" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="spotlight-square-grid"
                width={cellSize}
                height={cellSize}
                patternUnits="userSpaceOnUse"
              >
                {/* Highlighted square box outline */}
                <rect
                  x="0"
                  y="0"
                  width={cellSize}
                  height={cellSize}
                  fill="rgba(255, 255, 255, 0.015)"
                  stroke="currentColor"
                  strokeWidth="0.75"
                  strokeOpacity="0.35"
                />
                {/* Intersection Cross "+" */}
                <path
                  d={`M -2.5 0 L 2.5 0 M 0 -2.5 L 0 2.5`}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeOpacity="0.4"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#spotlight-square-grid)" />
          </svg>
        </div>
      )}

      {/* 3. Reference Geometric Accents (Directly matching reference image with gentle opacity) */}
      {/* 3-Ray Burst `\ | /` above cards at top right */}
      <svg
        className="hero-card-accent absolute top-[16%] right-[12%] w-12 h-12 text-white pointer-events-none hidden lg:block"
        viewBox="0 0 40 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <line x1="12" y1="28" x2="6" y2="12" strokeOpacity="0.25" />
        <line x1="20" y1="28" x2="20" y2="8" strokeOpacity="0.3" />
        <line x1="28" y1="28" x2="34" y2="12" strokeOpacity="0.25" />
      </svg>

      {/* Curved Arc `)` on left */}
      <svg
        className="hero-card-accent absolute bottom-[22%] left-[46%] w-10 h-10 text-white pointer-events-none hidden lg:block"
        viewBox="0 0 30 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path d="M 12 6 C 22 12, 22 18, 12 24" strokeOpacity="0.25" />
      </svg>

    </div>
  );
}
