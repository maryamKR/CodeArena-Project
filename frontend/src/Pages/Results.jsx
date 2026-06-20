import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { useTheme } from '../Context/ThemeContext';
import { getThemeColors } from '../constants/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';

const themeColor = (hex, t) => {
  if (hex === '#e6db74') return t.yellow;
  if (hex === '#a6e22e') return t.green;
  return hex;
};

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const t = getThemeColors(theme);
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';

  const { score = 0, total = 0, category = 'js', difficulty = 'easy', review = [] } = location.state || {};
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

  return (
    <div style={{ ...styles.page, background: t.pageBg }}>

      {/* Navbar */}
      <nav style={{ ...styles.nav, background: t.navBg, borderBottomColor: t.border, padding: isMobile ? '12px 16px' : '12px 24px' }}>
        <div style={styles.logo}>
          <span style={styles.bracket}>[</span>
          <span style={styles.logoName}>CODE</span>
          <span style={styles.bracket}>]</span>
          {' '}ARENA
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button style={{ ...styles.themeToggle, borderColor: t.border }} onClick={toggleTheme} title="Toggle theme">
            {t.isLight ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#2c2c2a"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e6db74" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" /></svg>
            )}
          </button>
          <div style={styles.xpBadge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#272822" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            {user?.totalXP || 0} XP
          </div>
        </div>
      </nav>

      <div style={{ ...styles.content, padding: isMobile ? '20px 16px' : '28px 24px' }}>

        <div style={{ ...styles.tag, background: t.tagBg, color: t.textMuted }}>{'// quiz_complete'}</div>
        <h1 style={{ ...styles.title, color: t.text, fontSize: isMobile ? '20px' : '28px' }}>
          <span style={styles.kw}>return</span>{' '}
          <span style={styles.fn}>results</span>
          <span style={{ color: t.text }}>()</span>
        </h1>

        {/* Score card */}
        <div style={{ ...styles.scoreCard, background: t.cardBg, borderColor: t.border, boxShadow: t.shadow, padding: isMobile ? '20px' : '28px' }}>
          <div style={{ ...styles.scoreTop, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '20px' : '32px', textAlign: isMobile ? 'center' : 'left' }}>
            <div style={{ ...styles.scoreCircle, borderColor: t.border, width: isMobile ? '100px' : '120px', height: isMobile ? '100px' : '120px', alignSelf: isMobile ? 'center' : 'auto' }}>
              <div style={{ ...styles.scoreNum, color: themeColor(msg.color, t), fontSize: isMobile ? '26px' : '32px' }}>{percentage}%</div>
              <div style={{ ...styles.scoreLabel, color: t.textMuted }}>SCORE</div>
            </div>
            <div style={styles.scoreDetails}>
              <div style={{ ...styles.msgTag, color: t.textMuted }}>{msg.text}</div>
              <div style={{ ...styles.scoreBreakdown, gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr' }}>
                <div style={styles.breakdownItem}>
                  <span style={{ ...styles.breakdownVal, color: t.green, fontSize: isMobile ? '16px' : '20px' }}>{score}/{total}</span>
                  <span style={{ ...styles.breakdownLabel, color: t.textMuted }}>correct answers</span>
                </div>
                <div style={styles.breakdownItem}>
                  <span style={{ ...styles.breakdownVal, color: t.yellow, fontSize: isMobile ? '16px' : '20px' }}>+{xpEarned}</span>
                  <span style={{ ...styles.breakdownLabel, color: t.textMuted }}>XP earned</span>
                </div>
                <div style={styles.breakdownItem}>
                  <span style={{ ...styles.breakdownVal, color: '#66d9e8', fontSize: isMobile ? '16px' : '20px' }}>{category}</span>
                  <span style={{ ...styles.breakdownLabel, color: t.textMuted }}>category</span>
                </div>
                <div style={styles.breakdownItem}>
                  <span style={{ ...styles.breakdownVal, color: '#f92672', fontSize: isMobile ? '16px' : '20px' }}>{difficulty}</span>
                  <span style={{ ...styles.breakdownLabel, color: t.textMuted }}>difficulty</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Answer review */}
        {review.length > 0 && (
          <div style={{ ...styles.reviewCard, background: t.cardBg, borderColor: t.border, boxShadow: t.shadow }}>
            <div style={{ ...styles.reviewHeader, borderBottomColor: t.border, color: t.textMuted }}>{'// answer_review'}</div>
            {review.map((q, i) => (
              <div
                key={i}
                style={{
                  ...styles.reviewRow,
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  gap: isMobile ? '8px' : '14px',
                  borderLeft: `4px solid ${q.isCorrect ? '#a6e22e' : '#f92672'}`,
                  borderBottom: i < review.length - 1 ? `2px solid ${t.borderLight}` : 'none',
                }}
              >
                <div style={{ ...styles.reviewQNum, color: t.textMuted }}>
                  <span style={{ color: q.isCorrect ? t.green : '#f92672', fontWeight: 700 }}>
                    {q.isCorrect ? '✓' : '✗'}
                  </span>{' '}
                  q{i + 1}
                </div>
                <div style={{ ...styles.reviewText, color: t.text }}>{q.text}</div>
                <div style={{ ...styles.reviewAnswers, justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
                  <span style={{
                    ...styles.reviewPill,
                    color: q.isCorrect ? t.green : '#f92672',
                    borderColor: q.isCorrect ? t.green : '#f92672',
                  }}>
                    you: {fmt(q.selected)}
                  </span>
                  {!q.isCorrect && (
                    <span style={{ ...styles.reviewPill, color: t.green, borderColor: t.green }}>
                      correct: {fmt(q.correct)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ ...styles.actionsRow, flexDirection: isMobile ? 'column' : 'row' }}>
          <button
            style={{ ...styles.playAgainBtn, boxShadow: t.shadow, width: isMobile ? '100%' : 'auto' }}
            onClick={() => navigate('/quiz', { state: { category, difficulty } })}
            onMouseEnter={e => e.currentTarget.style.background = '#8dca25'}
            onMouseLeave={e => e.currentTarget.style.background = '#a6e22e'}
          >
            ▶ PLAY AGAIN
          </button>
          <button
            style={{ ...styles.dashboardBtn, borderColor: t.border, color: t.textMuted, width: isMobile ? '100%' : 'auto' }}
            onClick={() => navigate('/dashboard')}
            onMouseEnter={e => { e.currentTarget.style.background = t.borderLight; e.currentTarget.style.color = t.text; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.textMuted; }}
          >
            ← BACK TO DASHBOARD
          </button>
          <button
            style={{ ...styles.leaderboardBtn, color: t.yellow, borderColor: t.yellow, width: isMobile ? '100%' : 'auto' }}
            onClick={() => navigate('/leaderboard')}
            onMouseEnter={e => e.currentTarget.style.background = t.borderLight}
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
  themeToggle: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '2px solid #75715e', padding: '6px 10px', cursor: 'pointer' },
  xpBadge: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, background: '#e6db74', color: '#272822', border: '2px solid #e6db74', padding: '4px 14px', display: 'flex', alignItems: 'center' },
  content: { padding: '28px 24px', maxWidth: '700px', margin: '0 auto' },
  tag: { fontSize: '11px', background: '#3e3d32', color: '#75715e', display: 'inline-block', padding: '3px 10px', marginBottom: '10px', letterSpacing: '2px' },
  title: { fontSize: '28px', fontWeight: 700, color: '#f8f8f2', marginBottom: '28px' },
  kw: { color: '#66d9e8' },
  fn: { color: '#a6e22e' },
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