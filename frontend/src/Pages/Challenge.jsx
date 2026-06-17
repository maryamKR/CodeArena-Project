import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/useAuth';
import socket from '../socket/socket';
import api from '../api/axios';

const TIMER_MAX = 10;

export default function Challenge() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

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
  const [waiting, setWaiting] = useState(false); // finished locally, awaiting server result

  const question = questions[current];

  const getTimerColor = () => {
    if (timer > 6) return '#a6e22e';
    if (timer > 3) return '#e6db74';
    return '#f92672';
  };

  

  useEffect(() => {
    socket.connect();

    
    socket.on('connect', () => {
      socket.emit('join_match', { challengeId });
    });

    // if already connected
    if (socket.connected) {
      socket.emit('join_match', { challengeId });
    }

    socket.on('match_ready', (data) => {
      setQuestions(data.questions);
      setLoading(false);
    });

    socket.on('opponent_progress', (data) => {
      // Only update oppScore — ignore events about ourselves
      if (String(data.userId) !== String(user._id)) {
        setOppScore(data.questionsAnswered);
      }
    });

    socket.on('match_over', (data) => {
      const myResult = data.results?.[String(user._id)];
      const oppResult = Object.entries(data.results || {})
        .find(([id]) => id !== String(user._id))?.[1];

      // Use authoritative server scores
      if (myResult) setMyScore(myResult.correctCount ?? 0);
      if (oppResult) setOppScore(oppResult.correctCount ?? 0);

      // Determine winner — null winnerId means draw
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
        // fallback
      }
    }

    // Always emit to the backend so it knows we've passed this question, even if we timed out
    socket.emit('submit_answer', {
      challengeId,
      questionId: questions[current]?._id,
      answer: answer,
      timeTakenSec: TIMER_MAX - timer,
    });
  };

  // Timer
  useEffect(() => {
    if (answered || gameOver) return;
    if (timer === 0) {
      setTimeout(() => handleAnswer(null), 0);;
      return;
    }
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer, answered, gameOver]);

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      // All questions answered locally — wait for the server's authoritative match_over
      setWaiting(true);
      return;
    }
    setCurrent(c => c + 1);
    setSelected(null);
    setAnswered(false);
    setTimer(TIMER_MAX);
  };

  // Keyboard shortcuts
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
    <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#75715e', fontFamily: "'Space Mono', monospace" }}>
        {'// waiting_for_opponent...'}
      </div>
    </div>
  );

  if (waiting) return (
    <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', fontFamily: "'Space Mono', monospace" }}>
        <div style={{ color: '#a6e22e', fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>// done!</div>
        <div style={{ color: '#75715e', fontSize: '13px' }}>waiting_for_opponent...</div>
      </div>
    </div>
  );
  if (gameOver) return (
    <div style={styles.page}>
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
        <div style={styles.tag}>{'// match_over'}</div>
        <h1 style={{ ...styles.title, color: winner === 'you' ? '#a6e22e' : winner === 'draw' ? '#e6db74' : '#f92672' }}>
          {winner === 'you' ? 'victory()' : winner === 'draw' ? 'draw()' : 'defeat()'}
        </h1>
        <div style={styles.finalCard}>
          <div style={styles.finalScores}>
            <div style={styles.finalPlayer}>
              <div style={{ ...styles.finalAvatar, background: '#a6e22e', color: '#272822' }}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div style={styles.finalName}>{user?.username}</div>
              <div style={{ ...styles.finalScore, color: '#a6e22e' }}>{myScore}</div>
            </div>
            <div style={styles.vsText}>VS</div>
            <div style={styles.finalPlayer}>
              <div style={{ ...styles.finalAvatar, background: '#f92672', color: '#fff' }}>
                {opponent?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={styles.finalName}>{opponent?.username || 'opponent'}</div>
              <div style={{ ...styles.finalScore, color: '#f92672' }}>{oppScore}</div>
            </div>
          </div>
          <div style={styles.winnerMsg}>
            {winner === 'you' && <div style={{ color: '#a6e22e' }}>// you_crushed_it! +50 XP</div>}
            {winner === 'draw' && <div style={{ color: '#e6db74' }}>// evenly_matched! +25 XP</div>}
            {winner === 'opponent' && <div style={{ color: '#f92672' }}>// better_luck_next_time</div>}
          </div>
        </div>
        <div style={styles.actionsRow}>
          <button style={styles.playAgainBtn} onClick={() => navigate('/quiz')}
            onMouseEnter={e => e.currentTarget.style.background = '#8dca25'}
            onMouseLeave={e => e.currentTarget.style.background = '#a6e22e'}
          >▶ PLAY AGAIN</button>
          <button style={styles.dashBtn} onClick={() => navigate('/dashboard')}>← DASHBOARD</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
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

      {/* Progress bar */}
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${(current / questions.length) * 100}%`, background: getTimerColor() }} />
      </div>

      <div style={styles.content}>

        {/* Scoreboard */}
        <div style={styles.scoreboard}>
          <div style={styles.scorePlayer}>
            <div style={{ ...styles.scoreAvatar, background: '#a6e22e', color: '#272822' }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div style={styles.scoreName}>{user?.username}</div>
            <div style={{ ...styles.scoreNum, color: '#a6e22e' }}>{myScore}</div>
          </div>

          <div style={styles.scoreCenter}>
            <div style={styles.timerCircle2}>
              <div style={{ ...styles.timerNum, color: getTimerColor() }}>{timer}</div>
              <div style={styles.timerLabel}>SEC</div>
            </div>
            <div style={styles.questionCounter}>Q{current + 1}/{questions.length}</div>
          </div>

          <div style={styles.scorePlayer}>
            <div style={{ ...styles.scoreAvatar, background: '#f92672', color: '#fff' }}>
              {opponent?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div style={styles.scoreName}>{opponent?.username || 'opponent'}</div>
            <div style={{ ...styles.scoreNum, color: '#f92672' }}>{oppScore}</div>
          </div>
        </div>

        {/* Question */}
        <div style={styles.questionCard}>
          <div style={styles.questionMeta}>
            {'// '}<span style={{ color: '#66d9e8' }}>{category}</span>
            {'.'}<span style={{ color: '#a6e22e' }}>{difficulty}</span>
            <span style={{ color: '#75715e' }}> — question_{current + 1}</span>
          </div>
          <div style={styles.questionText}>{question?.text}</div>
        </div>

        {/* True / False */}
        <div style={styles.answerRow}>
          <button
            style={{
              ...styles.answerBtn,
              ...styles.trueBtn,
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
            <div style={{ ...styles.resultTag, color: selected === question?.correct_answer ? '#a6e22e' : '#f92672' }}>
              {selected === question?.correct_answer ? '// correct! +10 XP' : selected === null ? '// time_up!' : '// wrong!'}
            </div>
            <button style={styles.nextBtn} onClick={handleNext}
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
  winnerMsg: { textAlign: 'center', fontSize: '13px', fontStyle: 'italic', padding: '12px', background: '#272822', border: '2px solid #3e3d32' },

  actionsRow: { display: 'flex', gap: '12px' },
  playAgainBtn: { flex: 1, fontFamily: "'Space Mono', monospace", fontSize: '13px', fontWeight: 700, background: '#a6e22e', color: '#272822', border: '3px solid #a6e22e', padding: '12px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '2px', boxShadow: '4px 4px 0 #3e3d32', transition: 'background 0.15s' },
  dashBtn: { fontFamily: "'Space Mono', monospace", fontSize: '13px', fontWeight: 700, background: 'transparent', color: '#75715e', border: '2px solid #75715e', padding: '12px 20px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' },
};