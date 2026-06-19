import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/useAuth';
import { useTheme } from '../Context/ThemeContext';
import { getThemeColors } from '../Constants/theme';
import socket from '../socket/socket';
import api from '../API/axios';

const TIMER_MAX = 10;

export default function Challenge() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const t = getThemeColors(theme);

  const category = location.state?.category || 'js';
  const difficulty = location.state?.difficulty || 'easy';
  const challengeId = location.state?.challengeId || null;
  const [opponent] = useState(location.state?.opponent || null);

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [timer, setTimer] = useState(TIMER_MAX);
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [waiting, setWaiting] = useState(false);
  const [matchTime, setMatchTime] = useState(null);
  const matchStartRef = useRef(null);

  const question = questions[current];

  const getTimerColor = () => {
    if (timer > 6) return '#a6e22e';
    if (timer > 3) return '#e6db74';
    return '#f92672';
  };

  const fmtTime = (secs) => {
    if (secs == null) return '—';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      socket.emit('join_match', { challengeId });
    });

    if (socket.connected) {
      socket.emit('join_match', { challengeId });
    }

    socket.on('match_ready', (data) => {
      setQuestions(data.questions);
      setLoading(false);
      matchStartRef.current = Date.now();
    });

    socket.on('opponent_progress', (data) => {
      if (String(data.userId) !== String(user._id)) {
        setOppScore(data.questionsAnswered);
      }
    });

    socket.on('match_over', (data) => {
      const myResult = data.results?.[String(user._id)];
      const oppResult = Object.entries(data.results || {})
        .find(([id]) => id !== String(user._id))?.[1];

      if (myResult) setMyScore(myResult.correctCount ?? 0);
      if (oppResult) setOppScore(oppResult.correctCount ?? 0);

      if (matchStartRef.current) {
        setMatchTime(Math.round((Date.now() - matchStartRef.current) / 1000));
      }

      if (data.winnerId === null || data.winnerId === undefined) {
        setWinner('draw');
      } else if (String(data.winnerId) === String(user._id)) {
        setWinner('you');
      } else if (data.forfeit && String(data.forfeitedBy) !== String(user._id)) {
        setWinner('you');
      } else {
        setWinner('opponent');
      }

      setWaiting(false);
      setGameOver(true);
    });

    return () => {
      socket.off('connect');
      socket.off('match_ready');
      socket.off('opponent_progress');
      socket.off('match_over');
    };
  }, [challengeId]);

  const handleAnswer = async (answer) => {
    if (answered) return;
    setAnswered(true);
    setSelected(answer);

    if (answer !== null) {
      try {
        const res = await api.post(`/questions/${questions[current]._id}/check`, {
          selectedAnswer: answer
        });
        if (res.data.correct) {
          setMyScore(s => s + 1);
        }
        setQuestions(prev => prev.map((q, i) =>
          i === current ? { ...q, correct_answer: res.data.correctAnswer } : q
        ));
      } catch {
      }
    }

    socket.emit('submit_answer', {
      challengeId,
      questionId: questions[current]?._id,
      answer: answer,
      timeTakenSec: TIMER_MAX - timer,
    });
  };

  useEffect(() => {
    if (answered || gameOver) return;
    if (timer === 0) {
      setTimeout(() => handleAnswer(null), 0);
      return;
    }
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer, answered, gameOver]);

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setWaiting(true);
      return;
    }
    setCurrent(c => c + 1);
    setSelected(null);
    setAnswered(false);
    setTimer(TIMER_MAX);
  };

  useEffect(() => {
    if (answered || gameOver) return;
    const handleKey = (e) => {
      if (e.key === 't' || e.key === '1') handleAnswer(true);
      if (e.key === 'f' || e.key === '2') handleAnswer(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [answered, gameOver]);

  if (loading) return (
    <div style={{ ...styles.page, background: t.pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: t.textMuted, fontFamily: "'Space Mono', monospace" }}>
        {'// waiting_for_opponent...'}
      </div>
    </div>
  );

  if (waiting) return (
    <div style={{ ...styles.page, background: t.pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', fontFamily: "'Space Mono', monospace" }}>
        <div style={{ color: t.green, fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>// done!</div>
        <div style={{ color: t.textMuted, fontSize: '13px' }}>waiting_for_opponent...</div>
      </div>
    </div>
  );

  if (gameOver) return (
    <div style={{ ...styles.page, background: t.pageBg }}>
      <nav style={{ ...styles.nav, background: t.navBg, borderBottomColor: t.border }}>
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
        <div style={{ ...styles.tag, background: t.tagBg, color: t.textMuted }}>{'// match_over'}</div>
        <h1 style={{ ...styles.title, color: winner === 'you' ? t.green : winner === 'draw' ? t.yellow : '#f92672' }}>
          {winner === 'you' ? 'victory()' : winner === 'draw' ? 'draw()' : 'defeat()'}
        </h1>
        <div style={{ ...styles.finalCard, background: t.cardBg, borderColor: t.border, boxShadow: t.shadow }}>
          <div style={styles.finalScores}>
            <div style={styles.finalPlayer}>
              <div style={{ ...styles.finalAvatar, background: '#a6e22e', color: '#272822' }}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div style={{ ...styles.finalName, color: t.text }}>{user?.username}</div>
              <div style={{ ...styles.finalScore, color: t.green }}>{myScore}</div>
            </div>
            <div style={styles.vsText}>VS</div>
            <div style={styles.finalPlayer}>
              <div style={{ ...styles.finalAvatar, background: '#f92672', color: '#fff' }}>
                {opponent?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={{ ...styles.finalName, color: t.text }}>{opponent?.username || 'opponent'}</div>
              <div style={{ ...styles.finalScore, color: '#f92672' }}>{oppScore}</div>
            </div>
          </div>
          <div style={{ ...styles.matchTimeRow, color: t.textMuted }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fd971f" strokeWidth="2.5" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            match time: <span style={{ color: '#fd971f', fontWeight: 700, marginLeft: '4px' }}>{fmtTime(matchTime)}</span>
          </div>
          <div style={{ ...styles.winnerMsg, background: t.pageBg, borderColor: t.borderLight }}>
            {winner === 'you' && <div style={{ color: t.green }}>// you_crushed_it! +50 XP</div>}
            {winner === 'draw' && <div style={{ color: t.yellow }}>// evenly_matched! +25 XP</div>}
            {winner === 'opponent' && <div style={{ color: '#f92672' }}>// better_luck_next_time</div>}
          </div>
        </div>
        <div style={styles.actionsRow}>
          <button style={{ ...styles.playAgainBtn, boxShadow: t.shadow }} onClick={() => navigate('/quiz')}
            onMouseEnter={e => e.currentTarget.style.background = '#8dca25'}
            onMouseLeave={e => e.currentTarget.style.background = '#a6e22e'}
          >▶ PLAY AGAIN</button>
          <button style={{ ...styles.dashBtn, borderColor: t.border, color: t.textMuted }} onClick={() => navigate('/dashboard')}>← DASHBOARD</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ ...styles.page, background: t.pageBg }}>
      <nav style={{ ...styles.nav, background: t.navBg, borderBottomColor: t.border }}>
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

      {/* Progress bar */}
      <div style={{ ...styles.progressBar, background: t.borderLight }}>
        <div style={{ ...styles.progressFill, width: `${(current / questions.length) * 100}%`, background: getTimerColor() }} />
      </div>

      <div style={styles.content}>

        {/* Scoreboard */}
        <div style={{ ...styles.scoreboard, background: t.cardBg, borderColor: t.border, boxShadow: t.shadow }}>
          <div style={styles.scorePlayer}>
            <div style={{ ...styles.scoreAvatar, background: '#a6e22e', color: '#272822' }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div style={{ ...styles.scoreName, color: t.text }}>{user?.username}</div>
            <div style={{ ...styles.scoreNum, color: t.green }}>{myScore}</div>
          </div>

          <div style={styles.scoreCenter}>
            <div style={{ ...styles.timerCircle2, borderColor: t.border }}>
              <div style={{ ...styles.timerNum, color: getTimerColor() }}>{timer}</div>
              <div style={{ ...styles.timerLabel, color: t.textMuted }}>SEC</div>
            </div>
            <div style={{ ...styles.questionCounter, color: t.textMuted }}>Q{current + 1}/{questions.length}</div>
          </div>

          <div style={styles.scorePlayer}>
            <div style={{ ...styles.scoreAvatar, background: '#f92672', color: '#fff' }}>
              {opponent?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div style={{ ...styles.scoreName, color: t.text }}>{opponent?.username || 'opponent'}</div>
            <div style={{ ...styles.scoreNum, color: '#f92672' }}>{oppScore}</div>
          </div>
        </div>

        {/* Question */}
        <div style={{ ...styles.questionCard, background: t.cardBg, borderColor: t.border, boxShadow: t.shadow }}>
          <div style={{ ...styles.questionMeta, color: t.textMuted }}>
            {'// '}<span style={{ color: '#66d9e8' }}>{category}</span>
            {'.'}<span style={{ color: t.green }}>{difficulty}</span>
            <span style={{ color: t.textMuted }}> — question_{current + 1}</span>
          </div>
          <div style={{ ...styles.questionText, color: t.text }}>{question?.text}</div>
        </div>

        {/* True / False */}
        <div style={styles.answerRow}>
          <button
            style={{
              ...styles.answerBtn,
              ...styles.trueBtn,
              background: t.cardBg,
              boxShadow: t.shadow,
              ...(answered && question?.correct_answer === true ? styles.correctBtn : {}),
              ...(answered && selected === true && question?.correct_answer !== true ? styles.wrongBtn : {}),
              opacity: answered ? 0.85 : 1,
            }}
            onClick={() => handleAnswer(true)}
            disabled={answered}
          >
            <span style={styles.answerKey}>[T / 1]</span>
            TRUE
          </button>
          <button
            style={{
              ...styles.answerBtn,
              ...styles.falseBtn,
              background: t.cardBg,
              boxShadow: t.shadow,
              ...(answered && question?.correct_answer === false ? styles.correctBtn : {}),
              ...(answered && selected === false && question?.correct_answer !== false ? styles.wrongBtn : {}),
              opacity: answered ? 0.85 : 1,
            }}
            onClick={() => handleAnswer(false)}
            disabled={answered}
          >
            <span style={styles.answerKey}>[F / 2]</span>
            FALSE
          </button>
        </div>

        {answered && (
          <div style={styles.nextRow}>
            <div style={{ ...styles.resultTag, color: selected === question?.correct_answer ? t.green : '#f92672' }}>
              {selected === question?.correct_answer ? '// correct! +10 XP' : selected === null ? '// time_up!' : '// wrong!'}
            </div>
            <button style={{ ...styles.nextBtn, boxShadow: t.shadow }} onClick={handleNext}
              onMouseEnter={e => e.currentTarget.style.background = '#8dca25'}
              onMouseLeave={e => e.currentTarget.style.background = '#a6e22e'}
            >
              {current + 1 >= questions.length ? 'VIEW RESULTS →' : 'NEXT →'}
            </button>
          </div>
        )}
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

  progressBar: { height: '6px', background: '#3e3d32', width: '100%' },
  progressFill: { height: '100%', transition: 'width 0.3s ease, background 0.5s ease' },

  content: { padding: '24px', maxWidth: '800px', margin: '0 auto' },

  tag: { fontSize: '11px', background: '#3e3d32', color: '#75715e', display: 'inline-block', padding: '3px 10px', marginBottom: '10px', letterSpacing: '2px' },
  title: { fontSize: '32px', fontWeight: 700, marginBottom: '24px' },

  scoreboard: { display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center', background: '#1e1f1a', border: '3px solid #75715e', padding: '16px 24px', marginBottom: '20px', boxShadow: '4px 4px 0 #3e3d32' },
  scorePlayer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
  scoreAvatar: { width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700 },
  scoreName: { fontSize: '12px', fontWeight: 700, color: '#f8f8f2' },
  scoreNum: { fontSize: '24px', fontWeight: 700 },
  scoreCenter: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  timerCircle2: { width: '60px', height: '60px', borderRadius: '50%', border: '3px solid #75715e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  timerNum: { fontSize: '18px', fontWeight: 700, lineHeight: 1 },
  timerLabel: { fontSize: '8px', color: '#75715e', letterSpacing: '1px' },
  questionCounter: { fontSize: '10px', color: '#75715e', letterSpacing: '1px' },

  questionCard: { background: '#1e1f1a', border: '3px solid #75715e', padding: '20px', marginBottom: '20px', boxShadow: '4px 4px 0 #3e3d32' },
  questionMeta: { fontSize: '11px', color: '#75715e', marginBottom: '10px', letterSpacing: '1px' },
  questionText: { fontSize: '18px', fontWeight: 700, color: '#f8f8f2', lineHeight: 1.5 },

  answerRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
  answerBtn: { fontFamily: "'Space Mono', monospace", fontSize: '18px', fontWeight: 700, padding: '20px', border: '3px solid', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '3px', boxShadow: '4px 4px 0 #3e3d32', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
  answerKey: { fontSize: '10px', fontWeight: 400, letterSpacing: '1px', opacity: 0.6 },
  trueBtn: { background: '#1e1f1a', color: '#a6e22e', borderColor: '#a6e22e' },
  falseBtn: { background: '#1e1f1a', color: '#f92672', borderColor: '#f92672' },
  correctBtn: { background: '#a6e22e', color: '#272822', borderColor: '#a6e22e' },
  wrongBtn: { background: '#f92672', color: '#f8f8f2', borderColor: '#f92672' },

  nextRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  resultTag: { fontSize: '13px' },
  nextBtn: { fontFamily: "'Space Mono', monospace", fontSize: '13px', fontWeight: 700, background: '#a6e22e', color: '#272822', border: '3px solid #a6e22e', padding: '10px 24px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '2px', boxShadow: '4px 4px 0 #3e3d32', transition: 'background 0.15s' },

  finalCard: { background: '#1e1f1a', border: '3px solid #75715e', padding: '32px', marginBottom: '24px', boxShadow: '4px 4px 0 #3e3d32' },
  finalScores: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px', marginBottom: '20px' },
  finalPlayer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  finalAvatar: { width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700 },
  finalName: { fontSize: '13px', fontWeight: 700, color: '#f8f8f2' },
  finalScore: { fontSize: '32px', fontWeight: 700 },
  vsText: { fontSize: '20px', fontWeight: 700, color: '#f92672' },
  matchTimeRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#75715e', marginBottom: '16px' },
  winnerMsg: { textAlign: 'center', fontSize: '13px', fontStyle: 'italic', padding: '12px', background: '#272822', border: '2px solid #3e3d32' },

  actionsRow: { display: 'flex', gap: '12px' },
  playAgainBtn: { flex: 1, fontFamily: "'Space Mono', monospace", fontSize: '13px', fontWeight: 700, background: '#a6e22e', color: '#272822', border: '3px solid #a6e22e', padding: '12px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '2px', boxShadow: '4px 4px 0 #3e3d32', transition: 'background 0.15s' },
  dashBtn: { fontFamily: "'Space Mono', monospace", fontSize: '13px', fontWeight: 700, background: 'transparent', color: '#75715e', border: '2px solid #75715e', padding: '12px 20px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' },
};