import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import api from '../api/axios';

const NAV_LINKS = [
    { label: 'Home', path: '/' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Quiz', path: '/quiz' },
    { label: 'Leaderboard', path: '/leaderboard' },
    { label: 'Profile', path: '/profile' },
];

const TIMER_MAX = 30;

export default function Quiz() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const category = location.state?.category || 'js';
    const difficulty = location.state?.difficulty || 'easy';

    const [questions, setQuestions] = useState([]);
    const [current, setCurrent] = useState(0);
    const [selected, setSelected] = useState(null);
    const [timer, setTimer] = useState(TIMER_MAX);
    const [answered, setAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [seenIds, setSeenIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [xpGain, setXpGain] = useState(null);
    const [exploding, setExploding] = useState(false);

    // Fetch questions
    useEffect(() => {
        const fetchQuestions = async () => {
            setLoading(true);
            try {
                const exclude = seenIds.join(',');
                const res = await api.get(`/questions?category=${category}&difficulty=${difficulty}${exclude ? `&exclude=${exclude}` : ''}`);
                setQuestions(res.data);
                setSeenIds(prev => [...prev, ...res.data.map(q => q._id)]);
            } catch (err) {
                setError('Failed to load questions');
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, []);

    // Timer
    useEffect(() => {
        if (answered || loading) return;
        if (timer === 0) {
            setExploding(true);
            setTimeout(() => {
                setExploding(false);
                handleNext();
            }, 1000);
            return;
        }
        const interval = setInterval(() => setTimer(t => t - 1), 1000);
        return () => clearInterval(interval);
    }, [timer, answered, loading]);

    const getTimerColor = () => {
        if (timer > 20) return '#a6e22e';
        if (timer > 10) return '#e6db74';
        return '#f92672';
    };

    const handleAnswer = useCallback((answer) => {
        if (answered) return;
        setAnswered(true);
        setSelected(answer);
        const correct = questions[current]?.correct_answer === answer;
        if (correct) {
            setScore(s => s + 1);
            setXpGain(10);
            setTimeout(() => setXpGain(null), 1500);
        }
    }, [answered, questions, current]);

    const handleNext = useCallback(() => {
        if (current + 1 >= questions.length) {
            navigate('/results', { state: { score, total: questions.length, category, difficulty } });
            return;
        }
        setCurrent(c => c + 1);
        setSelected(null);
        setAnswered(false);
        setTimer(TIMER_MAX);
    }, [current, questions.length, score, category, difficulty, navigate]);

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

            {/* Navbar */}
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

            {/* Progress bar */}
            <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${((current) / questions.length) * 100}%`, background: getTimerColor() }} />
            </div>

            <div style={styles.content}>

                {/* Header row */}
                <div style={styles.headerRow}>
                    <div style={styles.questionTag}>
                        {'// '}<span style={{ color: '#66d9e8' }}>{category}</span>
                        {'.'}<span style={{ color: '#a6e22e' }}>{difficulty}</span>
                    </div>
                    <div style={styles.scoreTag}>score: <span style={{ color: '#a6e22e' }}>{score}</span>/{questions.length}</div>
                </div>

                {/* Timer bomb */}
                <div style={styles.timerRow}>
                    <div style={{ ...styles.timerCircle, borderColor: getTimerColor(), color: getTimerColor(), boxShadow: `0 0 20px ${getTimerColor()}40` }}>
                        <div style={styles.timerNum}>{timer}</div>
                        <div style={styles.timerLabel}>SEC</div>
                    </div>
                    {exploding && (
                        <div style={styles.explosion}>💥 TIME'S UP!</div>
                    )}
                </div>

                {/* Question */}
                <div style={styles.questionCard}>
                    <div style={styles.questionNum}>// question_{current + 1}</div>
                    <div style={styles.questionText}>{question?.text}</div>
                </div>

                {/* XP animation */}
                {xpGain && (
                    <div style={styles.xpPop}>+{xpGain} XP</div>
                )}

                {/* True / False buttons */}
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

                {/* Next button */}
                {answered && (
                    <div style={styles.nextRow}>
                        <div style={{ ...styles.resultTag, color: selected === question?.correct_answer ? '#a6e22e' : '#f92672' }}>
                            {selected === question?.correct_answer ? '// correct! +10 XP' : '// wrong!'}
                        </div>
                        <button
                            style={styles.nextBtn}
                            onClick={handleNext}
                            onMouseEnter={e => e.currentTarget.style.background = '#8dca25'}
                            onMouseLeave={e => e.currentTarget.style.background = '#a6e22e'}
                        >
                            {current + 1 >= questions.length ? 'VIEW RESULTS →' : 'NEXT →'}
                        </button>
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

    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    questionTag: { fontSize: '12px', background: '#3e3d32', color: '#75715e', padding: '3px 10px', letterSpacing: '1px' },
    scoreTag: { fontSize: '12px', color: '#75715e', fontFamily: "'Space Mono', monospace" },

    timerRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px', gap: '20px' },
    timerCircle: { width: '80px', height: '80px', borderRadius: '50%', border: '4px solid', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.5s, color 0.5s, box-shadow 0.5s' },
    timerNum: { fontSize: '24px', fontWeight: 700, lineHeight: 1 },
    timerLabel: { fontSize: '9px', letterSpacing: '2px', marginTop: '2px' },
    explosion: { fontSize: '20px', fontWeight: 700, color: '#f92672', animation: 'shake 0.5s' },

    questionCard: { background: '#1e1f1a', border: '3px solid #75715e', padding: '24px', marginBottom: '28px', boxShadow: '4px 4px 0 #3e3d32' },
    questionNum: { fontSize: '11px', color: '#75715e', marginBottom: '12px', letterSpacing: '1px' },
    questionText: { fontSize: '18px', fontWeight: 700, color: '#f8f8f2', lineHeight: 1.5 },

    xpPop: { position: 'fixed', top: '40%', left: '50%', transform: 'translateX(-50%)', fontSize: '28px', fontWeight: 700, color: '#a6e22e', animation: 'popUp 1.5s forwards', zIndex: 999, fontFamily: "'Space Mono', monospace", pointerEvents: 'none' },

    answerRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' },
    answerBtn: { fontFamily: "'Space Mono', monospace", fontSize: '20px', fontWeight: 700, padding: '24px', border: '3px solid', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '3px', boxShadow: '4px 4px 0 #3e3d32', transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
    answerKey: { fontSize: '11px', fontWeight: 400, letterSpacing: '1px', opacity: 0.6 },
    trueBtn: { background: '#1e1f1a', color: '#a6e22e', borderColor: '#a6e22e' },
    falseBtn: { background: '#1e1f1a', color: '#f92672', borderColor: '#f92672' },
    correctBtn: { background: '#a6e22e', color: '#272822', borderColor: '#a6e22e' },
    wrongBtn: { background: '#f92672', color: '#f8f8f2', borderColor: '#f92672' },

    nextRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    resultTag: { fontSize: '13px', fontFamily: "'Space Mono', monospace" },
    nextBtn: { fontFamily: "'Space Mono', monospace", fontSize: '13px', fontWeight: 700, background: '#a6e22e', color: '#272822', border: '3px solid #a6e22e', padding: '10px 24px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '2px', boxShadow: '4px 4px 0 #3e3d32', transition: 'background 0.15s' },

    loadingTag: { fontSize: '14px', color: '#75715e', fontFamily: "'Space Mono', monospace" },
    errorBox: { background: 'rgba(249,38,114,0.15)', border: '2px solid #f92672', color: '#f92672', padding: '10px 14px', fontFamily: "'Space Mono', monospace", fontSize: '12px' },
};