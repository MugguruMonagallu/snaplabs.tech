import React, { useEffect, useRef, useState } from 'react';

interface TaglineRevealProps {
  className?: string;
}

export default function TaglineReveal({ className = '' }: TaglineRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeWordIndex, setActiveWordIndex] = useState<number>(-1);

  // The authentic SnapLabs philosophy statement (2 lines, outcome driven, no hyphens)
  const lineOne = "We are three developers who turn real problems";
  const lineTwo = "into purpose built software.";
  const words = [...lineOne.split(' '), ...lineTwo.split(' ')];
  const splitIndex = lineOne.split(' ').length;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const rect = container.getBoundingClientRect();
          const windowHeight = window.innerHeight;

          // Trigger progression as section moves from bottom third to middle of viewport
          const startTrigger = windowHeight * 0.85;
          const endTrigger = windowHeight * 0.35;

          const progress = Math.min(
            1,
            Math.max(0, (startTrigger - rect.top) / (startTrigger - endTrigger))
          );

          const targetIndex = Math.floor(progress * words.length);
          setActiveWordIndex(targetIndex);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [words.length]);

  return (
    <section
      ref={containerRef}
      className={`max-w-5xl mx-auto px-6 py-24 sm:py-32 text-center ${className}`}
    >
      <div className="text-xs font-mono text-[#e11d48] uppercase tracking-widest mb-6">
        The Founding Mission
      </div>

      <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.25] sm:leading-[1.2] max-w-4xl mx-auto text-balance">
        <div>
          {words.slice(0, splitIndex).map((word, i) => (
            <span
              key={i}
              className="inline-block mx-1 sm:mx-1.5 transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                color: i <= activeWordIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.28)',
              }}
            >
              {word}
            </span>
          ))}
        </div>
        <div className="mt-2">
          {words.slice(splitIndex).map((word, i) => {
            const actualIndex = splitIndex + i;
            return (
              <span
                key={actualIndex}
                className="inline-block mx-1 sm:mx-1.5 transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  color: actualIndex <= activeWordIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.28)',
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </h2>

      <p className="mt-8 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto font-normal leading-relaxed text-pretty">
        No venture capital fluff, no bloated corporate roadmaps. We build the exact tools we need in daily life and open source them for fellow enthusiasts.
      </p>
    </section>
  );
}
