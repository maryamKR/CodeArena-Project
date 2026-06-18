import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/useAuth';
import socket from '../socket/socket';
import api from '../API/axios';

const SEARCHING_MESSAGES = [
  '// scanning_arena_for_opponents...',
  '// analyzing_skill_levels...',
  '// calculating_match_fairness...',
  '// opponent_detected_nearby...',
  '// establishing_connection...',
];

export default function Matchmaking() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const category = location.state?.category || 'js';
  const difficulty = location.state?.difficulty || 'easy';

  const [status, setStatus] = useState('searching');
  const [msgIndex, setMsgIndex] = useState(0);
  const [dots, setDots] = useState('');
  const [countdown, setCountdown] = useState(3);

  // Cycle through messages
  useEffect(() => {
    if (status !== 'searching') return;
    const interval = setInterval(() => {
      setMsgIndex(i => (i + 1) % SEARCHING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [status]);

  // Animate dots
  useEffect(() => {
    if (status !== 'searching') return;
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);
    return () => clearInterval(interval);
  }, [status]);

  // socket
  const [opponent, setOpponent] = useState(null);
  const [challengeId, setChallengeId] = useState(null);

  useEffect(() => {
    if (!user) return;

    const joinMatchmaking = () => {
      api.post('/matchmaking/join', {
        difficulty,
        categorySlug: category,
        socketId: socket.id,
      }).catch(err => {
        console.error('Failed to join matchmaking:', err);
      });
    };

    // Connect socket first if not connected
    if (!socket.connected) {
      socket.connect();
    }

    socket.on('connect', joinMatchmaking);

    // If already connected, manually call the join logic
    if (socket.connected) {
      joinMatchmaking();
    }

    // Listen for match found
    socket.on('matched', (data) => {
      console.log('matched data:', data);
      setOpponent(data.opponent);
      setChallengeId(data.challengeId);
      setStatus('found');
    });

    // Cleanup
    return () => {
      socket.off('connect', joinMatchmaking);
      socket.off('matched');
      // Leave the matchmaking queue if we unmount before a match is found
      if (status === 'searching') {
        api.delete('/matchmaking/leave').catch(() => {});
      }
    };
  }, [user, category, difficulty, status]);

  // Countdown after match found
  useEffect(() => {
    if (status !== 'found') return;
    if (countdown === 0) {
      navigate(`/match/${challengeId}`, { state: { category, difficulty, challengeId, opponent: opponent } });
      return;
    }
    const timeout = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timeout);
  }, [status, countdown, navigate, category, difficulty]);

  return (
    <div style={styles.page}>

      {/* Navbar */}
      <nav style={styles.nav}>
        <div style={styles.logo}>
          <span style={styles.bracket}>[</span>
          <span style={styles.logoName}>CODE</span>
          <span style={styles.bracket}>]</span>
          {' '}ARENA
        </div>
        <div style={styles.xpBadge}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#272822" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          {user?.totalXP || 0} XP
        </div>
      </nav>

      <div style={styles.content}>

        {status === 'searching' ? (
          <>
            <div style={styles.tag}>{'// matchmaking'}</div>
            <h1 style={styles.title}>
              <span style={styles.kw}>await</span>{' '}
              <span style={styles.fn}>findOpponent</span>
              <span style={styles.paren}>()</span>
            </h1>

            {/* Match info */}
            <div style={styles.infoRow}>
              <div style={styles.infoBadge}>
                <span style={{ color: '#75715e' }}>category: </span>
                <span style={{ color: '#66d9e8' }}>{category}</span>
              </div>
              <div style={styles.infoBadge}>
                <span style={{ color: '#75715e' }}>difficulty: </span>
                <span style={{ color: '#f92672' }}>{difficulty}</span>
              </div>
            </div>

            {/* Searching animation */}
            <div style={styles.searchCard}>
              <div style={styles.radarWrap}>
                <div style={styles.radarOuter}>
                  <div style={styles.radarMiddle}>
                    <div style={styles.radarInner}>
                      <div style={styles.playerDot}>
                        {user?.username?.[0]?.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={styles.searchMsg}>{SEARCHING_MESSAGES[msgIndex]}{dots}</div>
              <div style={styles.searchSub}>Searching for a worthy opponent{dots}</div>
            </div>

            <button
              style={styles.cancelBtn}
              onClick={() => navigate('/quiz')}
            >
              cancel_search()
            </button>
          </>
        ) : (
          <>
            <div style={styles.tag}>{'// match_found'}</div>
            <h1 style={{ ...styles.title, color: '#a6e22e' }}>
              <span style={styles.fn}>opponent</span>
              <span style={styles.paren}>.found()</span>
            </h1>

            <div style={styles.foundCard}>
              <div style={styles.foundPlayers}>
                {/* You */}
                <div style={styles.playerCard}>
                  <div style={{ ...styles.foundAvatar, background: '#a6e22e', color: '#272822' }}>
                    {user?.username?.[0]?.toUpperCase()}
                  </div>
                  <div style={styles.foundName}>{user?.username}</div>
                  <div style={styles.foundYou}>(you)</div>
                </div>

                {/* VS */}
                <div style={styles.vsText}>VS</div>

                {/* Opponent */}
                <div style={styles.playerCard}>
                  <div style={{ ...styles.foundAvatar, background: '#f92672', color: '#fff' }}>
                    {opponent?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div style={styles.foundName}>{opponent?.username || 'opponent'}</div>
                  <div style={styles.foundRank}>{opponent?.rank || 'found!'}</div>
                </div>
              </div>

              <div style={styles.countdownWrap}>
                <div style={styles.countdownLabel}>{'// starting_in'}</div>
                <div style={styles.countdownNum}>{countdown}</div>
              </div>
            </div>
          </>
        )}

      </div>

      <style>{`
        @keyframes radar {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#272822', fontFamily: "'Space Mono', monospace" },

  nav: { background: '#1e1f1a', borderBottom: '3px solid #75715e', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontFamily: "'Space Mono', monospace", fontSize: '18px', fontWeight: 700, color: '#f8f8f2', letterSpacing: '-1px' },
  bracket: { color: '#f92672' },
  logoName: { background: '#a6e22e', color: '#272822', padding: '0 5px' },
  xpBadge: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, background: '#e6db74', color: '#272822', border: '2px solid #e6db74', padding: '4px 14px', display: 'flex', alignItems: 'center' },

  content: { padding: '40px 24px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' },

  tag: { fontSize: '11px', background: '#3e3d32', color: '#75715e', display: 'inline-block', padding: '3px 10px', marginBottom: '10px', letterSpacing: '2px' },
  title: { fontSize: '28px', fontWeight: 700, color: '#f8f8f2', marginBottom: '20px' },
  kw: { color: '#66d9e8' },
  fn: { color: '#a6e22e' },
  paren: { color: '#f8f8f2' },

  infoRow: { display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '32px' },
  infoBadge: { background: '#1e1f1a', border: '2px solid #3e3d32', padding: '6px 14px', fontSize: '12px' },

  searchCard: { background: '#1e1f1a', border: '3px solid #75715e', padding: '40px 24px', marginBottom: '24px', boxShadow: '4px 4px 0 #3e3d32' },

  radarWrap: { display: 'flex', justifyContent: 'center', marginBottom: '24px' },
  radarOuter: { width: '120px', height: '120px', borderRadius: '50%', border: '2px solid rgba(166,226,46,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'radar 2s infinite' },
  radarMiddle: { width: '80px', height: '80px', borderRadius: '50%', border: '2px solid rgba(166,226,46,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  radarInner: { width: '48px', height: '48px', borderRadius: '50%', border: '2px solid #a6e22e', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  playerDot: { width: '32px', height: '32px', borderRadius: '50%', background: '#a6e22e', color: '#272822', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 },

  searchMsg: { fontSize: '12px', color: '#a6e22e', marginBottom: '8px', letterSpacing: '1px' },
  searchSub: { fontSize: '11px', color: '#75715e' },

  cancelBtn: { fontFamily: "'Space Mono', monospace", fontSize: '12px', color: '#f92672', border: '2px solid #f92672', padding: '8px 20px', background: 'transparent', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' },

  foundCard: { background: '#1e1f1a', border: '3px solid #a6e22e', padding: '32px', marginBottom: '24px', boxShadow: '4px 4px 0 #3e3d32' },
  foundPlayers: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px', marginBottom: '28px' },
  playerCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  foundAvatar: { width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, border: '3px solid #3e3d32' },
  foundName: { fontSize: '14px', fontWeight: 700, color: '#f8f8f2' },
  foundYou: { fontSize: '10px', color: '#a6e22e', letterSpacing: '1px' },
  foundRank: { fontSize: '10px', color: '#f92672', letterSpacing: '1px' },
  vsText: { fontSize: '24px', fontWeight: 700, color: '#f92672', fontFamily: "'Space Mono', monospace" },

  countdownWrap: { textAlign: 'center' },
  countdownLabel: { fontSize: '11px', color: '#75715e', marginBottom: '8px' },
  countdownNum: { fontSize: '48px', fontWeight: 700, color: '#a6e22e', animation: 'pulse 1s infinite' },
};