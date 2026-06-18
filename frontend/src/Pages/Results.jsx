import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/useAuth';

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { score = 0, total = 0, category = 'js', difficulty = 'easy', review = [], timeTaken = null } = location.state || {};
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const xpEarned = score * 10;

  const getMessage = () => {
    if (percentage === 100) return { text: '// perfect_score! legend status unlocked', color: '#e6db74' };
    if (percentage >= 80) return { text: '// excellent! you are on fire', color: '#a6e22e' };
    if (percentage >= 60) return { text: '// not bad! keep grinding', color: '#66d9e8' };
    if (percentage >= 40) return { text: '// room to improve. try again?', color: '#e6db74' };
    return { text: '// rough session. practice makes perfect', color: '#f92672' };
  };

  const msg = getMessage();
  const fmt = (b) => (b ? 'TRUE' : 'FALSE');
  const fmtTime = (secs) => {
    if (secs == null) return '—';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

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

        {/* Header */}
        <div style={styles.tag}>{'// quiz_complete'}</div>
        <h1 style={styles.title}>
          <span style={styles.kw}>return</span>{' '}
          <span style={styles.fn}>results</span>
          <span style={styles.paren}>()</span>
        </h1>

        {/* Score card */}
        <div style={styles.scoreCard}>
          <div style={styles.scoreTop}>
            <div style={styles.scoreCircle}>
              <div style={{ ...styles.scoreNum, color: msg.color }}>{percentage}%</div>
              <div style={styles.scoreLabel}>SCORE</div>
            </div>
            <div style={styles.scoreDetails}>
              <div style={styles.msgTag}>{msg.text}</div>
              <div style={styles.scoreBreakdown}>
                <div style={styles.breakdownItem}>
                  <span style={styles.breakdownVal}>{score}/{total}</span>
                  <span style={styles.breakdownLabel}>correct answers</span>
                </div>
                <div style={styles.breakdownItem}>
                  <span style={{ ...styles.breakdownVal, color: '#e6db74' }}>+{xpEarned}</span>
                  <span style={styles.breakdownLabel}>XP earned</span>
                </div>
                <div style={styles.breakdownItem}>
                  <span style={{ ...styles.breakdownVal, color: '#66d9e8' }}>{category}</span>
                  <span style={styles.breakdownLabel}>category</span>
                </div>
                <div style={styles.breakdownItem}>
                  <span style={{ ...styles.breakdownVal, color: '#f92672' }}>{difficulty}</span>
                  <span style={styles.breakdownLabel}>difficulty</span>
                </div>
                <div style={styles.breakdownItem}>
                  <span style={{ ...styles.breakdownVal, color: '#fd971f' }}>{fmtTime(timeTaken)}</span>
                  <span style={styles.breakdownLabel}>time taken</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Answer review */}
        {review.length > 0 && (
          <div style={styles.reviewCard}>
            <div style={styles.reviewHeader}>{'// answer_review'}</div>
            {review.map((q, i) => (
              <div
                key={i}
                style={{
                  ...styles.reviewRow,
                  borderLeft: `4px solid ${q.isCorrect ? '#a6e22e' : '#f92672'}`,
                  borderBottom: i < review.length - 1 ? '2px solid #3e3d32' : 'none',
                }}
              >
                <div style={styles.reviewQNum}>
                  <span style={{ color: q.isCorrect ? '#a6e22e' : '#f92672', fontWeight: 700 }}>
                    {q.isCorrect ? '✓' : '✗'}
                  </span>{' '}
                  q{i + 1}
                </div>
                <div style={styles.reviewText}>{q.text}</div>
                <div style={styles.reviewAnswers}>
                  <span style={{
                    ...styles.reviewPill,
                    color: q.isCorrect ? '#a6e22e' : '#f92672',
                    borderColor: q.isCorrect ? '#a6e22e' : '#f92672',
                  }}>
                    you: {fmt(q.selected)}
                  </span>
                  {!q.isCorrect && (
                    <span style={{ ...styles.reviewPill, color: '#a6e22e', borderColor: '#a6e22e' }}>
                      correct: {fmt(q.correct)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div style={styles.actionsRow}>
          <button
            style={styles.playAgainBtn}
            onClick={() => navigate('/quiz', { state: { category, difficulty } })}
            onMouseEnter={e => e.currentTarget.style.background = '#8dca25'}
            onMouseLeave={e => e.currentTarget.style.background = '#a6e22e'}
          >
            ▶ PLAY AGAIN
          </button>
          <button
            style={styles.dashboardBtn}
            onClick={() => navigate('/dashboard')}
            onMouseEnter={e => { e.currentTarget.style.background = '#3e3d32'; e.currentTarget.style.color = '#f8f8f2'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#75715e'; }}
          >
            ← BACK TO DASHBOARD
          </button>
          <button
            style={styles.leaderboardBtn}
            onClick={() => navigate('/leaderboard')}
            onMouseEnter={e => e.currentTarget.style.background = '#3e3d32'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
             LEADERBOARD
          </button>
        </div>

      </div>
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

  content: { padding: '28px 24px', maxWidth: '700px', margin: '0 auto' },

  tag: { fontSize: '11px', background: '#3e3d32', color: '#75715e', display: 'inline-block', padding: '3px 10px', marginBottom: '10px', letterSpacing: '2px' },
  title: { fontSize: '28px', fontWeight: 700, color: '#f8f8f2', marginBottom: '28px' },
  kw: { color: '#66d9e8' },
  fn: { color: '#a6e22e' },
  paren: { color: '#f8f8f2' },

  scoreCard: { background: '#1e1f1a', border: '3px solid #75715e', padding: '28px', marginBottom: '24px', boxShadow: '6px 6px 0 #3e3d32' },
  scoreTop: { display: 'flex', alignItems: 'center', gap: '32px' },
  scoreCircle: { width: '120px', height: '120px', borderRadius: '50%', border: '4px solid #75715e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  scoreNum: { fontSize: '32px', fontWeight: 700, lineHeight: 1 },
  scoreLabel: { fontSize: '10px', color: '#75715e', letterSpacing: '2px', marginTop: '4px' },
  scoreDetails: { flex: 1 },
  msgTag: { fontSize: '12px', color: '#75715e', borderLeft: '3px solid #f92672', paddingLeft: '10px', marginBottom: '20px', fontStyle: 'italic' },
  scoreBreakdown: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  breakdownItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  breakdownVal: { fontSize: '20px', fontWeight: 700, color: '#a6e22e' },
  breakdownLabel: { fontSize: '10px', color: '#75715e', textTransform: 'uppercase', letterSpacing: '1px' },

  reviewCard: { background: '#1e1f1a', border: '3px solid #75715e', marginBottom: '24px', boxShadow: '6px 6px 0 #3e3d32' },
  reviewHeader: { padding: '12px 16px', borderBottom: '3px solid #75715e', fontSize: '11px', color: '#75715e', letterSpacing: '2px' },
  reviewRow: { display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px' },
  reviewQNum: { width: '48px', fontSize: '12px', color: '#75715e', flexShrink: 0 },
  reviewText: { flex: 1, fontSize: '13px', color: '#f8f8f2', lineHeight: 1.4 },
  reviewAnswers: { display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' },
  reviewPill: { fontSize: '10px', fontWeight: 700, padding: '2px 8px', border: '2px solid', letterSpacing: '1px' },

  actionsRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  playAgainBtn: { fontFamily: "'Space Mono', monospace", fontSize: '13px', fontWeight: 700, background: '#a6e22e', color: '#272822', border: '3px solid #a6e22e', padding: '12px 24px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '2px', boxShadow: '4px 4px 0 #3e3d32', transition: 'background 0.15s' },
  dashboardBtn: { fontFamily: "'Space Mono', monospace", fontSize: '13px', fontWeight: 700, background: 'transparent', color: '#75715e', border: '2px solid #75715e', padding: '12px 24px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', transition: 'all 0.15s' },
  leaderboardBtn: { fontFamily: "'Space Mono', monospace", fontSize: '13px', fontWeight: 700, background: 'transparent', color: '#e6db74', border: '2px solid #e6db74', padding: '12px 24px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', transition: 'background 0.15s' },
};