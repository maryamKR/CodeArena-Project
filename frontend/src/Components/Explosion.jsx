import { useState } from 'react';

const generateParticles = () =>
  Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 12 + 4,
    color: ['#f92672', '#a6e22e', '#66d9e8', '#e6db74'][Math.floor(Math.random() * 4)],
    duration: Math.random() * 1 + 0.5,
    tx: Math.random() * 200 - 100,
    ty: Math.random() * 200 - 100,
  }));

export default function Explosion() {
  const [particles] = useState(generateParticles);

  return (
    <div style={styles.overlay}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: p.size,
          height: p.size,
          background: p.color,
          borderRadius: '2px',
          animation: `explode-${p.id} ${p.duration}s ease-out forwards`,
        }}>
          <style>{`
            @keyframes explode-${p.id} {
              0%   { transform: scale(0) rotate(0deg); opacity: 1; }
              100% { transform: scale(3) rotate(720deg) translate(${p.tx}px, ${p.ty}px); opacity: 0; }
            }
          `}</style>
        </div>
      ))}
      <div style={styles.text}>// time's up!</div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: '#272822', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  text: { color: '#f92672', fontFamily: "'Space Mono', monospace", fontSize: '32px', fontWeight: 700, zIndex: 10 },
};