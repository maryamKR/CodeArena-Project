import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket/socket';
import api from '../api/axios';

export default function ChallengeNotification() {
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Listen for incoming challenges
    socket.on('challenge_received', (data) => {
      setNotification(data);
    });

    // Listen for challenge accepted by opponent
    socket.on('challenge_accepted', (data) => {
      // navigate to matchmaking or match
      navigate(`/match/${data.id}`, {
        state: { challengeId: data.id }
      });
    });

    return () => {
      socket.off('challenge_received');
      socket.off('challenge_accepted');
    };
  }, []);

  const handleAccept = async () => {
    try {
      await api.put(`/challenges/${notification.id}/accept`);
      setNotification(null);
      navigate(`/match/${notification.id}`, {
        state: { challengeId: notification.id }
      });
    } catch {
      setNotification(null);
    }
  };

  const handleDecline = async () => {
    try {
      await api.put(`/challenges/${notification.id}/decline`);
    } catch {
      // ignore
    }
    setNotification(null);
  };

  if (!notification) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.tag}>{'// challenge_received'}</div>
        <div style={styles.message}>
          <span style={styles.sender}>{notification.sender?.username}</span>
          {' challenged you!'}
        </div>
        <div style={styles.details}>
          <span style={styles.pill}>{notification.category?.name || 'Any'}</span>
          <span style={styles.pill}>{notification.difficulty}</span>
        </div>
        {notification.message && (
          <div style={styles.challengeMsg}>"{notification.message}"</div>
        )}
        <div style={styles.btnRow}>
          <button style={styles.acceptBtn} onClick={handleAccept}>
            ✅ ACCEPT
          </button>
          <button style={styles.declineBtn} onClick={handleDecline}>
            ✕ DECLINE
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 },
  card: { background: '#1e1f1a', border: '3px solid #a6e22e', padding: '20px', maxWidth: '320px', boxShadow: '4px 4px 0 #3e3d32', fontFamily: "'Space Mono', monospace" },
  tag: { fontSize: '10px', background: '#3e3d32', color: '#a6e22e', display: 'inline-block', padding: '2px 8px', marginBottom: '10px', letterSpacing: '2px' },
  message: { fontSize: '14px', fontWeight: 700, color: '#f8f8f2', marginBottom: '10px' },
  sender: { color: '#a6e22e' },
  details: { display: 'flex', gap: '8px', marginBottom: '10px' },
  pill: { fontSize: '10px', fontWeight: 700, padding: '2px 8px', border: '2px solid #75715e', color: '#75715e', textTransform: 'uppercase' },
  challengeMsg: { fontSize: '11px', color: '#75715e', fontStyle: 'italic', marginBottom: '12px', borderLeft: '3px solid #3e3d32', paddingLeft: '8px' },
  btnRow: { display: 'flex', gap: '8px' },
  acceptBtn: { flex: 1, fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, background: '#a6e22e', color: '#272822', border: '2px solid #a6e22e', padding: '8px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' },
  declineBtn: { flex: 1, fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, background: 'transparent', color: '#f92672', border: '2px solid #f92672', padding: '8px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' },
};