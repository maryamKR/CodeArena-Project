import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/useAuth';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';

const NAV_LINKS = [
    { label: 'Home', path: '/' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Quiz', path: '/quiz' },
    { label: 'Leaderboard', path: '/leaderboard' },
    { label: 'Profile', path: '/profile' },
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export default function Quiz() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const location = useLocation();
    const [mode, setMode] = useState(location.state?.mode || null);
    const [oneVoneType, setOneVoneType] = useState('random'); // 'random' | 'friend'
    const [category, setCategory] = useState(location.state?.category || null);
    const [difficulty, setDifficulty] = useState('Easy');
    const [categories, setCategories] = useState([]);

    // Friend-challenge state
    const [opponent, setOpponent] = useState('');
    const [challengeMsg, setChallengeMsg] = useState(null); // { type, text }
    const [sending, setSending] = useState(false);

    useEffect(() => {
        api.get('/categories')
            .then(res => {
            if (Array.isArray(res.data) && res.data.length > 0) {
                setCategories(res.data.map(cat => ({
                slug: cat.slug,
                name: cat.name,
                short: cat.slug.toUpperCase().slice(0, 3),
                color: cat.color || '#a6e22e',
                _id: cat._id,
                })));
            }
            })
            .catch(() => {});
    }, []);

    const selectedCategory = categories.find(c => c.slug === category);

    const handleStart = () => {
        if (!category) return;
        if (mode === 'solo') {
            navigate('/quiz/play', { state: { category, difficulty, categoryId: selectedCategory?._id } });
        } else if (mode === '1v1' && oneVoneType === 'random') {
            navigate('/matchmaking', { state: { category, difficulty } });
        }
    };

    const handleSendChallenge = async () => {
        const name = opponent.trim();
        if (name.length < 3) {
            setChallengeMsg({ type: 'error', text: 'Username must be at least 3 characters' });
            return;
        }
        if (!category) {
            setChallengeMsg({ type: 'error', text: 'Pick a category first' });
            return;
        }
        setSending(true);
        setChallengeMsg(null);
        try {
            await api.post('/challenges', {
                receiverUsername: name,
                category: selectedCategory?._id,
                difficulty,
            });
            setChallengeMsg({ type: 'success', text: `Challenge sent to ${name}!` });
            setOpponent('');
        } catch (err) {
            const status = err?.response?.status;
            const text =
                status === 404 ? 'No player found with that username' :
                status === 409 ? 'You already have a pending challenge with this player' :
                status === 400 ? 'You cannot challenge yourself' :
                status === 429 ? 'Too many challenges — try again later' :
                'Failed to send challenge';
            setChallengeMsg({ type: 'error', text });
        } finally {
            setSending(false);
        }
    };

    const isFriend = mode === '1v1' && oneVoneType === 'friend';

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

            <div style={styles.content}>

                {/* Header */}
                <div style={styles.tag}>{'// setup_match'}</div>
                <h1 style={styles.title}>
                    <span style={styles.kw}>const</span> match{' '}
                    <span style={styles.op}>=</span>{' '}
                    <span style={styles.fn}>configure</span>
                    <span style={styles.paren}>()</span>
                </h1>

                {/* Step 1 — Mode */}
                <div style={styles.section}>
                    <div style={styles.stepTag}>{'// step_1: select_mode'}</div>
                    <div style={styles.modeGrid}>
                        <div
                            style={{ ...styles.modeCard, ...(mode === 'solo' ? styles.modeCardActive : {}), borderColor: mode === 'solo' ? '#a6e22e' : '#75715e' }}
                            onClick={() => setMode('solo')}
                        >
                            <div style={styles.modeIcon}><svg width="32" height="32" viewBox="0 0 24 24" fill="#a6e22e"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" /></svg></div>
                            <div style={{ ...styles.modeName, color: mode === 'solo' ? '#a6e22e' : '#f8f8f2' }}>SOLO</div>
                            <div style={styles.modeDesc}>Practice at your own pace</div>
                        </div>
                        <div
                            style={{ ...styles.modeCard, ...(mode === '1v1' ? styles.modeCardActive : {}), borderColor: mode === '1v1' ? '#f92672' : '#75715e' }}
                            onClick={() => setMode('1v1')}
                        >
                            <div style={{ ...styles.modeIcon, color: '#f92672' }}>⚔</div>
                            <div style={{ ...styles.modeName, color: mode === '1v1' ? '#f92672' : '#f8f8f2' }}>1v1 CHALLENGE</div>
                            <div style={styles.modeDesc}>Battle another player</div>
                        </div>
                    </div>

                    {/* 1v1 sub-choice: random vs friend */}
                    {mode === '1v1' && (
                        <div style={styles.subChoiceRow}>
                            <button
                                style={{ ...styles.subChoiceBtn, ...(oneVoneType === 'random' ? styles.subChoiceActive : {}) }}
                                onClick={() => { setOneVoneType('random'); setChallengeMsg(null); }}
                            >
                                ⚔ Random Opponent
                            </button>
                            <button
                                style={{ ...styles.subChoiceBtn, ...(oneVoneType === 'friend' ? styles.subChoiceActive : {}) }}
                                onClick={() => { setOneVoneType('friend'); setChallengeMsg(null); }}
                            >
                                Challenge a Friend
                            </button>
                        </div>
                    )}

                    {/* Friend: username input shown up top, right after selecting Friend */}
                    {isFriend && (
                        <div style={styles.opponentBlock}>
                            <div style={styles.opponentLabel}>{'// opponent_username'}</div>
                            <input
                                style={styles.challengeInput}
                                type="text"
                                placeholder="opponent_username"
                                value={opponent}
                                onChange={e => setOpponent(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendChallenge()}
                            />
                        </div>
                    )}
                </div>

                {/* Step 2 — Category */}
                {mode && (
                    <div style={styles.section}>
                        <div style={styles.stepTag}>{'// step_2: select_category'}</div>
                        <div style={styles.catsGrid}>
                            {categories.map((cat, i) => (
                                <div
                                    key={cat.slug}
                                    style={{
                                        ...styles.catCard,
                                        borderTop: `4px solid ${cat.color}`,
                                        borderRight: (i + 1) % 4 !== 0 ? '3px solid #75715e' : 'none',
                                        borderBottom: '3px solid #75715e',
                                        ...(category === cat.slug ? { background: '#3e3d32' } : {}),
                                    }}
                                    onClick={() => setCategory(cat.slug)}
                                    onMouseEnter={e => e.currentTarget.style.background = '#3e3d32'}
                                    onMouseLeave={e => e.currentTarget.style.background = category === cat.slug ? '#3e3d32' : '#2d2c28'}
                                >
                                    <div style={{ ...styles.catIcon, color: cat.color }}>{cat.short}</div>
                                    <div style={styles.catName}>{cat.name}</div>
                                    {category === cat.slug && <div style={{ fontSize: '10px', color: cat.color, marginTop: '4px' }}>✓ selected</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3 — Difficulty */}
                {mode && category && (
                    <div style={styles.section}>
                        <div style={styles.stepTag}>{'// step_3: select_difficulty'}</div>
                        <div style={styles.diffRow}>
                            {DIFFICULTIES.map((d, i) => (
                                <button
                                    key={d}
                                    style={{
                                        ...styles.diffBtn,
                                        borderRight: i === DIFFICULTIES.length - 1 ? '2px solid #75715e' : 'none',
                                        ...(difficulty === d ? styles.diffBtnActive : {}),
                                    }}
                                    onClick={() => setDifficulty(d)}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Final action — Start (solo / random) OR Send challenge (friend) */}
                {mode && category && (
                    isFriend ? (
                        <div style={styles.section}>
                            {challengeMsg && (
                                <div style={{
                                    ...styles.challengeMsg,
                                    color: challengeMsg.type === 'success' ? '#a6e22e' : '#f92672',
                                    borderColor: challengeMsg.type === 'success' ? '#a6e22e' : '#f92672',
                                }}>
                                    {challengeMsg.text}
                                </div>
                            )}
                            <button
                                style={{ ...styles.startBtn, background: '#f92672', borderColor: '#f92672', color: '#f8f8f2', opacity: sending ? 0.6 : 1 }}
                                onClick={handleSendChallenge}
                                disabled={sending}
                            >
                                {sending ? 'SENDING...' : '⚔ SEND CHALLENGE'}
                            </button>
                            <div style={styles.challengeHint}>
                                {'// they\'ll get a notification to accept or decline'}
                            </div>
                        </div>
                    ) : (
                        <button
                            style={{ ...styles.startBtn, opacity: !category ? 0.5 : 1 }}
                            onClick={handleStart}
                            onMouseEnter={e => e.currentTarget.style.background = '#8dca25'}
                            onMouseLeave={e => e.currentTarget.style.background = '#a6e22e'}
                        >
                            {mode === 'solo' ? '▶ START SOLO QUIZ' : '⚔ FIND OPPONENT'}
                        </button>
                    )
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
    navLinks: { display: 'flex' },
    navLink: { fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, color: '#75715e', textDecoration: 'none', padding: '5px 14px', border: '2px solid #75715e', borderRight: 'none', textTransform: 'uppercase', letterSpacing: '1px', background: 'transparent' },
    navLinkActive: { background: '#a6e22e', color: '#272822', borderColor: '#a6e22e' },
    xpBadge: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, background: '#e6db74', color: '#272822', border: '2px solid #e6db74', padding: '4px 14px', display: 'flex', alignItems: 'center' },

    content: { padding: '28px 24px', maxWidth: '900px', margin: '0 auto' },

    tag: { fontSize: '11px', background: '#3e3d32', color: '#75715e', display: 'inline-block', padding: '3px 10px', marginBottom: '10px', letterSpacing: '2px' },
    title: { fontSize: '28px', fontWeight: 700, color: '#f8f8f2', marginBottom: '28px' },
    kw: { color: '#66d9e8' },
    op: { color: '#f92672' },
    fn: { color: '#a6e22e' },
    paren: { color: '#f8f8f2' },

    section: { marginBottom: '24px' },
    stepTag: { fontSize: '11px', background: '#3e3d32', color: '#75715e', display: 'inline-block', padding: '3px 10px', marginBottom: '12px', letterSpacing: '2px' },

    modeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    modeCard: { background: '#1e1f1a', border: '3px solid', padding: '24px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s', boxShadow: '4px 4px 0 #3e3d32' },
    modeCardActive: { boxShadow: '4px 4px 0 #3e3d32' },
    modeIcon: { fontSize: '32px', marginBottom: '12px' },
    modeName: { fontFamily: "'Space Mono', monospace", fontSize: '16px', fontWeight: 700, marginBottom: '8px', letterSpacing: '2px' },
    modeDesc: { fontSize: '11px', color: '#75715e' },

    subChoiceRow: { display: 'flex', gap: '12px', marginTop: '16px' },
    subChoiceBtn: { flex: 1, fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, padding: '12px', border: '2px solid #75715e', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', background: 'transparent', color: '#75715e', transition: 'all 0.15s' },
    subChoiceActive: { background: '#f92672', color: '#f8f8f2', borderColor: '#f92672' },

    opponentBlock: { marginTop: '16px' },
    opponentLabel: { fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#75715e', marginBottom: '8px', letterSpacing: '1px' },
    challengeInput: { width: '100%', background: '#1e1f1a', border: '3px solid #75715e', color: '#f8f8f2', fontFamily: "'Space Mono', monospace", fontSize: '13px', padding: '12px 14px', outline: 'none', boxSizing: 'border-box' },

    catsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '3px solid #75715e' },
    catCard: { padding: '16px', background: '#2d2c28', cursor: 'pointer', transition: 'background 0.15s' },
    catIcon: { fontSize: '18px', fontWeight: 700, marginBottom: '6px' },
    catName: { fontSize: '11px', fontWeight: 700, color: '#f8f8f2', textTransform: 'uppercase', letterSpacing: '1px' },

    diffRow: { display: 'flex' },
    diffBtn: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, padding: '8px 24px', border: '2px solid #75715e', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', background: 'transparent', color: '#75715e' },
    diffBtnActive: { background: '#f92672', color: '#f8f8f2', borderColor: '#f92672' },

    startBtn: { width: '100%', background: '#a6e22e', color: '#272822', border: '3px solid #a6e22e', fontFamily: "'Space Mono', monospace", fontSize: '14px', fontWeight: 700, padding: '14px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '2px', boxShadow: '4px 4px 0 #3e3d32', transition: 'background 0.15s' },
    challengeMsg: { fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, padding: '8px 12px', border: '2px solid', letterSpacing: '0.5px', marginBottom: '12px' },
    challengeHint: { fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#75715e', marginTop: '10px' },
};