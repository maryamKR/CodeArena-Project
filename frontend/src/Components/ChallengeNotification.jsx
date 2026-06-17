import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket/socket';

export default function ChallengeNotification() {
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    
    if (!socket.connected) socket.connect();

    socket.on('challenge_received', (data) => {
      setNotification(data);
    });

    socket.on('challenge_accepted', (data) => {
      navigate(`/match/${data.id}`, {
        state: { challengeId: data.id }
      });
    });

    return () => {
      socket.off('challenge_received');
      socket.off('challenge_accepted');
    };
  }, []);

  if (!notification) return null;

  return (
  <div style={styles.banner}>
    <div style={styles.bannerContent}>
      <span style={styles.icon}>⚔</span>
      <span style={styles.text}>
        <span style={styles.sender}>{notification.sender?.username}</span>
        {' challenged you!'}
      </span>
      <button 
        style={styles.viewBtn} 
        onClick={() => { setNotification(null); navigate('/dashboard'); }}
      >
        VIEW INVITE
      </button>
      <button style={styles.closeBtn} onClick={() => setNotification(null)}>×</button>
    </div>
  </div>
);
}

const styles = {
  banner: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    background: '#1e1f1a',
    borderBottom: '3px solid #f92672',
    padding: '10px 24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  },
  bannerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: "'Space Mono', monospace",
  },
  icon: { fontSize: '18px', flexShrink: 0, color: '#f92672' },
  text: { flex: 1, fontSize: '13px', color: '#f8f8f2', fontWeight: 700 },
  sender: { color: '#e6db74' },
  viewBtn: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '11px',
    fontWeight: 700,
    background: 'transparent',
    color: '#66d9e8',
    border: '2px solid #66d9e8',
    padding: '5px 14px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    flexShrink: 0,
  },
  closeBtn: {
    background: 'transparent', border: 'none', color: '#75715e',
    fontSize: '20px', cursor: 'pointer', flexShrink: 0, lineHeight: 1,
  },
};