import React, { useState, useEffect } from 'react';

const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';

const NAV_LINKS = [
  { label: 'Projects', href: '#projects', mono: '01', desc: 'Real-world problem solvers' },
  { label: 'Architecture', href: '#architecture', mono: '02', desc: 'GIS, Encryption & Edge' },
  { label: 'The Trio', href: '#team', mono: '03', desc: 'Engineers & Builders' },
];

export default function HeaderNav() {
  const [isOpen, setIsOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      setIsOpen(false);
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      setIsOpen(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 pt-[env(safe-area-inset-top,0px)]">
        <div className="glass-nav">
          <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
            {/* Brand Logo */}
            <a href="/" className="flex items-center gap-2.5 group py-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48] group-hover:scale-125 transition-transform duration-200" />
              <span className="text-sm font-semibold tracking-wider uppercase text-white group-hover:text-zinc-300 transition-colors">
                SnapLabs
              </span>
            </a>

            {/* Desktop Navigation Links (md and above) */}
            <nav className="hidden md:flex items-center gap-7 text-xs uppercase tracking-wider text-zinc-400">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="hover:text-white transition-colors py-2"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="https://github.com/MugguruMonagallu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3.5 py-1.5 rounded-full border border-white/10 hover:border-white/30 text-zinc-300 hover:text-white transition-all hover:bg-white/5 font-mono lowercase active:scale-95"
                style={{ transitionTimingFunction: EASE }}
              >
                github ↗
              </a>
            </nav>

            {/* Mobile Hamburger Toggle Button (below md) */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isOpen}
                aria-controls="mobile-navigation"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 hover:text-white active:scale-95 transition-all"
                style={{ transitionTimingFunction: EASE }}
              >
                <div className="relative w-5 h-4 flex flex-col justify-between items-center pointer-events-none">
                  <span
                    className={`block h-0.5 w-5 bg-current transform transition-all duration-300 ${
                      isOpen ? 'rotate-45 translate-y-[7px]' : ''
                    }`}
                  />
                  <span
                    className={`block h-0.5 w-5 bg-current transition-all duration-200 ${
                      isOpen ? 'opacity-0 scale-x-0' : 'opacity-100'
                    }`}
                  />
                  <span
                    className={`block h-0.5 w-5 bg-current transform transition-all duration-300 ${
                      isOpen ? '-rotate-45 -translate-y-[7px]' : ''
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay: Full-screen native mobile modal with dark obsidian styling */}
      {isOpen && (
        <div
          id="mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
          className="fixed inset-0 z-50 flex flex-col bg-[#09090b] md:hidden overscroll-contain h-[100dvh] w-full"
          style={{
            paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))',
            paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
            animationTimingFunction: EASE,
          }}
        >
          {/* Mobile Overlay Header */}
          <div className="flex items-center justify-between px-6 pb-5 border-b border-white/[0.08]">
            <a
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 group"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48]" />
              <span className="text-sm font-semibold tracking-wider uppercase text-white">
                SnapLabs
              </span>
            </a>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 hover:text-white active:scale-95 transition-all font-mono text-base"
              style={{ transitionTimingFunction: EASE }}
            >
              ✕
            </button>
          </div>

          {/* Navigation Links with Tactile Touch Targets */}
          <nav className="flex-1 overflow-y-auto px-6 py-6 flex flex-col justify-start gap-3">
            <div className="tag-line mb-3 !text-[10px]">Navigation</div>
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="group flex items-center justify-between p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 active:scale-[0.98] transition-all min-h-[56px]"
                style={{ transitionTimingFunction: EASE }}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-[#e11d48]">
                      {link.mono}
                    </span>
                    <span className="font-serif text-2xl font-normal text-white group-hover:text-zinc-200">
                      {link.label}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500 pl-7">
                    {link.desc}
                  </span>
                </div>
                <span className="font-mono text-sm text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </a>
            ))}

            <a
              href="https://github.com/MugguruMonagallu"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="group flex items-center justify-between p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 active:scale-[0.98] transition-all mt-2 min-h-[56px]"
              style={{ transitionTimingFunction: EASE }}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-zinc-500">04</span>
                  <span className="font-serif text-2xl font-normal text-white group-hover:text-zinc-200">
                    GitHub
                  </span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500 pl-7">
                  github.com/MugguruMonagallu
                </span>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                source ↗
              </span>
            </a>
          </nav>

          {/* Mobile Overlay Telemetry & Footer */}
          <div className="px-6 pt-5 border-t border-white/[0.08] flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-zinc-300">Systems Live</span>
              </div>
              <span className="text-zinc-500">3 Purpose Built Tools</span>
            </div>
            <div className="text-[11px] text-zinc-500 flex justify-between items-center font-mono">
              <a href="mailto:contact@snaplabs.tech" className="hover:text-zinc-300 transition-colors">
                contact@snaplabs.tech
              </a>
              <span>© {new Date().getFullYear()} SnapLabs</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
