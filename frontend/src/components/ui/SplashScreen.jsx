import React, { useEffect, useState } from 'react';
import reloadLogo from '../../assets/reload_logo.png';

// Total CSS animation runtime: 1.25s
// 0–0.7s  → logo fully visible
// 0.7–1.0s → logo fades to invisible
// 1.0–1.25s → overlay fades out
const TOTAL_MS = 1250;
const REDUCED_MOTION_MS = 300;

const styles = `
  @keyframes _splash_overlay {
    0%, 80% { opacity: 1; }
    100%    { opacity: 0; }
  }
  @keyframes _splash_logo {
    0%, 56% { opacity: 1; }
    80%     { opacity: 0; }
    100%    { opacity: 0; }
  }
  .splash-overlay {
    animation: _splash_overlay 1.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
  .splash-logo {
    animation: _splash_logo 1.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
  @media (prefers-reduced-motion: reduce) {
    .splash-overlay { animation-duration: 0.3s !important; }
    .splash-logo    { animation-duration: 0.3s !important; }
  }
`;

const SplashScreen = () => {
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const prefersReduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = prefersReduced ? REDUCED_MOTION_MS : TOTAL_MS;

    const timer = setTimeout(() => setMounted(false), duration + 50);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <style>{styles}</style>
      <div
        className="splash-overlay"
        role="presentation"
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          backgroundColor: '#09090b', // zinc-950 — no pure black, no white flash
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'all',
          userSelect: 'none',
        }}
      >
        <img
          src={reloadLogo}
          alt="RELOAD"
          className="splash-logo"
          style={{
            width: 'min(70vw, 400px)',
            height: 'auto',
            objectFit: 'contain'
          }}
        />
      </div>
    </>
  );
};

export default SplashScreen;
