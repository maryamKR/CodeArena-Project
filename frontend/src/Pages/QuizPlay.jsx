import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/useAuth';
import api from '../api/axios';

const NAV_LINKS = [
    { label: 'Home', path: '/' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Quiz', path: '/quiz' },
    { label: 'Leaderboard', path: '/leaderboard' },
    { label: 'Profile', path: '/profile' },
];

const TIMER_MAX = 10;
const AUTO_ADVANCE_MS = 1400;

export default function Quiz() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, refreshUser } = useAuth();

    const category = location.state?.category || 'js';
    const difficulty = location.state?.difficulty || 'Easy';
    const categoryId = location.state?.categoryId || null;
    const isDailyChallenge = location.state?.isDailyChallenge || false;

    const [questions, setQuestions] = useState([]);
    const [current, setCurrent] = useState(0);
    const [selected, setSelected] = useState(null);
    const [timer, setTimer] = useState(TIMER_MAX);
    const [answered, setAnswered] = useState(false);
    const [result, setResult] = useState(null);
    const [score, setScore] = useState(0);
    const [seenIds, setSeenIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [xpGain, setXpGain] = useState(null);
    const [exploding, setExploding] = useState(false);
    const [answers, setAnswers] = useState([]);
    const [review, setReview] = useState([]); // per-question review for Results page
    const [focusMode, setFocusMode] = useState(false);

    // Fetch questions
    useEffect(() => {
        const fetchQuestions = async () => {
            setLoading(true);
            try {
                const exclude = seenIds.join(',');
                const res = await api.get(`/questions?category=${category}&difficulty=${difficulty}${exclude ? `&exclude=${exclude}` : ''}`);
                setQuestions(res.data);
                setSeenIds(prev => [...prev, ...res.data.map(q => q._id)]);
            } catch {
                setError('Failed to load questions');
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, []);

    const getTimerColor = () => {
        if (timer > 6) return '#a6e22e';
        if (timer > 3) return '#e6db74';
        return '#f92672';
    };

    const handleNext = useCallback(async () => {
        if (current + 1 >= questions.length) {
            try {
                const res = await api.post('/scores', {
                    answers,
                    difficulty,
                    timeLeft: timer,
                    timeLimit: TIMER_MAX * questions.length,
                    categoryId,
                    isDailyChallenge,
                });
                await refreshUser();
                navigate('/results', {
                    state: {
                        result: res.data.data,
                        score,
                        total: questions.length,
                        category,
                        difficulty,
                        review, // pass review through
                    },
                });
            } catch {
                navigate('/results', {
                    state: { score, total: questions.length, category, difficulty, review },
                });
            }
            return;
        }
        setCurrent(c => c + 1);
        setSelected(null);
        setAnswered(false);
        setResult(null);
        setTimer(TIMER_MAX);
    }, [current, questions.length, score, timer, category, difficulty, navigate, answers, refreshUser, categoryId, isDailyChallenge, review]);

    const handleAnswer = useCallback(async (answer) => {
        if (answered) return;
        setAnswered(true);
        setSelected(answer);
        setAnswers(prev => [...prev, { questionId: questions[current]._id, selectedAnswer: answer }]);
        try {
            const res = await api.post(`/questions/${questions[current]._id}/check`, {
                selectedAnswer: answer
            });
            const correctAnswer = res.data.correctAnswer;
            setQuestions(prev => prev.map((q, i) =>
                i === current ? { ...q, correct_answer: correctAnswer } : q
            ));
            // record this question for the Results review
            setReview(prev => [...prev, {
                text: questions[current].text,
                selected: answer,
                correct: correctAnswer,
                isCorrect: res.data.correct,
            }]);
            if (res.data.correct) {
                setResult('correct');
                setScore(s => s + 1);
                setXpGain(10);
                setTimeout(() => setXpGain(null), 1500);
            } else {
                setResult('wrong');
            }
        } catch {
            setResult('wrong');
        }
    }, [answered, questions, current]);

    // Auto-advance after the answer is checked
    useEffect(() => {
        if (!result) return;
        const t = setTimeout(() => handleNext(), AUTO_ADVANCE_MS);
        return () => clearTimeout(t);
    }, [result, handleNext]);

    // Timer
    useEffect(() => {
        if (answered || loading) return;
        if (timer === 0) {
            setTimeout(() => {
                setExploding(true);
                setTimeout(() => {
                    setExploding(false);
                    handleNext();
                }, 1000);
            }, 0);
            return;
        }
        const interval = setInterval(() => setTimer(t => t - 1), 1000);
        return () => clearInterval(interval);
    }, [timer, answered, loading, handleNext]);

    // Keyboard shortcuts
    useEffect(() => {
        if (answered) return;
        const handleKey = (e) => {
            if (e.key === 't' || e.key === '1') handleAnswer(true);
            if (e.key === 'f' || e.key === '2') handleAnswer(false);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [answered, handleAnswer]);

    if (loading) return (
        <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={styles.loadingTag}>{'// loading_questions...'}</div>
        </div>
    );

    if (error) return (
        <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={styles.errorBox}>{error}</div>
        </div>
    );

    const question = questions[current];

    return (
        <div style={{ ...styles.page, animation: exploding ? 'shake 0.5s' : 'none' }}>

            {/* Navbar — hidden in focus mode */}
            {!focusMode && (
                <nav style={styles.nav}>
                    <div style={styles.logo}>
                        <span style={styles.bracket}>[</span>
                        <span style={styles.logoName}>CODE</span>
                        <span style={styles.bracket}>]</span>
                        {' '}ARENA
                    </div>
                    <div style={styles.navLinks}>
                        {NAV_LINKS.map((link, i) => (
                            <a
                            
                                key={link.label}
                                onClick={() => navigate(link.path)}
                                style={{
                                    ...styles.navLink,
                                    ...(i === 2 ? styles.navLinkActive : {}),
                                    ...(i === NAV_LINKS.length - 1 ? { borderRight: '2px solid #75715e' } : {}),
                                    cursor: 'pointer',
                                }}
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>
                    <div style={styles.xpBadge}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#272822" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                        {user?.totalXP || 0} XP
                    </div>
                </nav>
            )}

            {/* Progress bar */}
            <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${((current) / questions.length) * 100}%`, background: getTimerColor() }} />
            </div>

            <div style={focusMode ? styles.contentFocus : styles.content}>

                {/* Header row */}
                <div style={styles.headerRow}>
                    <div style={styles.questionTag}>
                        {'// '}<span style={{ color: '#66d9e8' }}>{category}</span>
                        {'.'}<span style={{ color: '#a6e22e' }}>{difficulty}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={styles.scoreTag}>score: <span style={{ color: '#a6e22e' }}>{score}</span>/{questions.length}</div>
                        <button style={styles.focusBtn} onClick={() => setFocusMode(f => !f)} title="Toggle focus mode">
                            {focusMode ? '◱ exit focus' : '⛶ focus'}
                        </button>
                    </div>
                </div>

                {/* Timer */}
                <div style={styles.timerRow}>
                    <div style={{ ...styles.timerCircle, borderColor: getTimerColor(), color: getTimerColor(), boxShadow: `0 0 20px ${getTimerColor()}40` }}>
                        <div style={styles.timerNum}>{timer}</div>
                        <div style={styles.timerLabel}>SEC</div>
                    </div>
                    {exploding && <div style={styles.explosion}>TIME'S UP!</div>}
                </div>

                {/* Question */}
                <div style={{ ...styles.questionCard, ...(focusMode ? styles.questionCardFocus : {}) }}>
                    <div style={styles.questionNum}>// question_{current + 1}</div>
                    <div style={{ ...styles.questionText, ...(focusMode ? styles.questionTextFocus : {}) }}>{question?.text}</div>
                </div>

                {/* XP animation */}
                {xpGain && <div style={styles.xpPop}>+{xpGain} XP</div>}

                {/* True / False buttons */}
                <div style={styles.answerRow}>
                    <button
                        style={{
                            ...styles.answerBtn,
                            ...styles.trueBtn,
                            ...(result && question?.correct_answer === true ? styles.correctBtn : {}),
                            ...(result && selected === true && question?.correct_answer !== true ? styles.wrongBtn : {}),
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
                            ...(result && question?.correct_answer === false ? styles.correctBtn : {}),
                            ...(result && selected === false && question?.correct_answer !== false ? styles.wrongBtn : {}),
                            opacity: answered ? 0.85 : 1,
                        }}
                        onClick={() => handleAnswer(false)}
                        disabled={answered}
                    >
                        <span style={styles.answerKey}>[F / 2]</span>
                        FALSE
                    </button>
                </div>

                {/* Result line (auto-advances, no Next button) */}
                {answered && (
                    <div style={styles.resultRow}>
                        {result ? (
                            <div style={{ ...styles.resultTag, color: result === 'correct' ? '#a6e22e' : '#f92672' }}>
                                {result === 'correct' ? '// correct! +10 XP' : '// wrong!'}
                            </div>
                        ) : (
                            <div style={{ ...styles.resultTag, color: '#75715e' }}>{'// checking...'}</div>
                        )}
                        <div style={styles.nextHint}>
                            {current + 1 >= questions.length ? '// loading results...' : '// next question...'}
                        </div>
                    </div>
                )}

            </div>

            <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-10px); }
          80% { transform: translateX(10px); }
        }
        @keyframes popUp {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-60px); opacity: 0; }
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
    navLinks: { display: 'flex' },
    navLink: { fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, color: '#75715e', textDecoration: 'none', padding: '5px 14px', border: '2px solid #75715e', borderRight: 'none', textTransform: 'uppercase', letterSpacing: '1px', background: 'transparent' },
    navLinkActive: { background: '#a6e22e', color: '#272822', borderColor: '#a6e22e' },
    xpBadge: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, background: '#e6db74', color: '#272822', border: '2px solid #e6db74', padding: '4px 14px', display: 'flex', alignItems: 'center' },

    progressBar: { height: '6px', background: '#3e3d32', width: '100%' },
    progressFill: { height: '100%', transition: 'width 0.3s ease, background 0.5s ease' },

    content: { padding: '28px 24px', maxWidth: '800px', margin: '0 auto' },
    contentFocus: { padding: '48px 24px', maxWidth: '1000px', margin: '0 auto', minHeight: 'calc(100vh - 6px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' },

    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    questionTag: { fontSize: '12px', background: '#3e3d32', color: '#75715e', padding: '3px 10px', letterSpacing: '1px' },
    scoreTag: { fontSize: '12px', color: '#75715e', fontFamily: "'Space Mono', monospace" },
    focusBtn: { fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, color: '#66d9e8', border: '2px solid #66d9e8', padding: '4px 12px', background: 'transparent', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' },

    timerRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px', gap: '20px' },
    timerCircle: { width: '80px', height: '80px', borderRadius: '50%', border: '4px solid', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.5s, color 0.5s, box-shadow 0.5s' },
    timerNum: { fontSize: '24px', fontWeight: 700, lineHeight: 1 },
    timerLabel: { fontSize: '9px', letterSpacing: '2px', marginTop: '2px' },
    explosion: { fontSize: '20px', fontWeight: 700, color: '#f92672', animation: 'shake 0.5s' },

    questionCard: { background: '#1e1f1a', border: '3px solid #75715e', padding: '24px', marginBottom: '28px', boxShadow: '4px 4px 0 #3e3d32' },
    questionCardFocus: { padding: '48px', marginBottom: '40px' },
    questionNum: { fontSize: '11px', color: '#75715e', marginBottom: '12px', letterSpacing: '1px' },
    questionText: { fontSize: '18px', fontWeight: 700, color: '#f8f8f2', lineHeight: 1.5 },
    questionTextFocus: { fontSize: '28px', lineHeight: 1.4, textAlign: 'center' },

    xpPop: { position: 'fixed', top: '40%', left: '50%', transform: 'translateX(-50%)', fontSize: '28px', fontWeight: 700, color: '#a6e22e', animation: 'popUp 1.5s forwards', zIndex: 999, fontFamily: "'Space Mono', monospace", pointerEvents: 'none' },

    answerRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' },
    answerBtn: { fontFamily: "'Space Mono', monospace", fontSize: '20px', fontWeight: 700, padding: '24px', border: '3px solid', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '3px', boxShadow: '4px 4px 0 #3e3d32', transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
    answerKey: { fontSize: '11px', fontWeight: 400, letterSpacing: '1px', opacity: 0.6 },
    trueBtn: { background: '#1e1f1a', color: '#a6e22e', borderColor: '#a6e22e' },
    falseBtn: { background: '#1e1f1a', color: '#f92672', borderColor: '#f92672' },
    correctBtn: { background: '#a6e22e', color: '#272822', borderColor: '#a6e22e' },
    wrongBtn: { background: '#f92672', color: '#f8f8f2', borderColor: '#f92672' },

    resultRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    resultTag: { fontSize: '13px', fontFamily: "'Space Mono', monospace" },
    nextHint: { fontSize: '12px', color: '#75715e', fontFamily: "'Space Mono', monospace" },

    loadingTag: { fontSize: '14px', color: '#75715e', fontFamily: "'Space Mono', monospace" },
    errorBox: { background: 'rgba(249,38,114,0.15)', border: '2px solid #f92672', color: '#f92672', padding: '10px 14px', fontFamily: "'Space Mono', monospace", fontSize: '12px' },
};