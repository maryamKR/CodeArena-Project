import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/useAuth';
import { useTheme } from '../Context/ThemeContext';
import { getThemeColors } from '../Constants/theme';
import api from '../API/axios';

const NAV_LINKS = [
    { label: 'Home', path: '/' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Quiz', path: '/quiz' },
    { label: 'Leaderboard', path: '/leaderboard' },
    { label: 'Profile', path: '/profile' },
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const themeColor = (hex, t) => {
    if (hex === '#e6db74') return t.yellow;
    if (hex === '#a6e22e') return t.green;
    return hex;
};

export default function Quiz() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const t = getThemeColors(theme);
    const bp = useBreakpoint();
    const isMobile = bp === 'mobile';

    const [mode, setMode] = useState(location.state?.mode || null);
    const [oneVoneType, setOneVoneType] = useState('random');
    const [category, setCategory] = useState(location.state?.category || null);
    const [difficulty, setDifficulty] = useState('Easy');
    const [categories, setCategories] = useState([]);
    const [menuOpen, setMenuOpen] = useState(false);

    const [opponent, setOpponent] = useState('');
    const [challengeMsg, setChallengeMsg] = useState(null);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        api.get('/categories')
            .then(res => {
                if (Array.isArray(res.data) && res.data.length > 0) {
                    setCategories(res.data.map(cat => ({
                        slug: cat.slug, name: cat.name, short: cat.slug.toUpperCase().slice(0, 3), color: cat.color || '#a6e22e', _id: cat._id,
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
        if (name.length < 3) { setChallengeMsg({ type: 'error', text: 'Username must be at least 3 characters' }); return; }
        if (!category) { setChallengeMsg({ type: 'error', text: 'Pick a category first' }); return; }
        setSending(true); setChallengeMsg(null);
        try {
            await api.post('/challenges', { receiverUsername: name, category: selectedCategory?._id, difficulty });
            setChallengeMsg({ type: 'success', text: `Challenge sent to ${name}!` }); setOpponent('');
        } catch (err) {
            const status = err?.response?.status;
            const text = status === 404 ? 'No player found with that username' : status === 409 ? 'You already have a pending challenge with this player' : status === 400 ? 'You cannot challenge yourself' : status === 429 ? 'Too many challenges — try again later' : 'Failed to send challenge';
            setChallengeMsg({ type: 'error', text });
        } finally { setSending(false); }
    };

    const isFriend = mode === '1v1' && oneVoneType === 'friend';

    return (
        <div style={{ ...styles.page, background: t.pageBg }}>

            {/* Navbar */}
            <nav style={{ ...styles.nav, background: t.navBg, borderBottomColor: t.border, flexWrap: isMobile ? 'wrap' : 'nowrap', padding: isMobile ? '12px 16px' : '12px 24px' }}>
                <div style={styles.logo}>
                    <span style={styles.bracket}>[</span>
                    <span style={styles.logoName}>CODE</span>
                    <span style={styles.bracket}>]</span>
                    {' '}ARENA
                </div>

                {!isMobile && (
                    <div style={styles.navLinks}>
                        {NAV_LINKS.map((link, i) => (
                            <a
                            
                                key={link.label}
                                onClick={() => navigate(link.path)}
                                style={{
                                    ...styles.navLink,
                                    borderColor: t.border,
                                    color: t.textMuted,
                                    ...(i === 2 ? styles.navLinkActive : {}),
                                    ...(i === NAV_LINKS.length - 1 ? { borderRight: `2px solid ${t.border}` } : { borderRight: 'none' }),
                                    cursor: 'pointer',
                                }}
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>
                )}

                <div style={styles.navRight}>
                    {isMobile && (
                        <button style={{ ...styles.hamburger, borderColor: t.border, color: t.textMuted }} onClick={() => setMenuOpen(m => !m)}>
                            {menuOpen ? '✕' : '☰'}
                        </button>
                    )}
                    <button style={{ ...styles.themeToggle, borderColor: t.border }} onClick={toggleTheme} title="Toggle theme">
                        {t.isLight ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#2c2c2a"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e6db74" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" /></svg>
                        )}
                    </button>
                    <div style={styles.xpBadge}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#272822" style={{ marginRight: '6px', verticalAlign: 'middle' }}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                        {user?.totalXP || 0} XP
                    </div>
                </div>

                {isMobile && menuOpen && (
                    <div style={{ ...styles.mobileMenu, background: t.navBg, borderTopColor: t.border }}>
                        {NAV_LINKS.map((link) => (
                            <a key={link.label} onClick={() => { navigate(link.path); setMenuOpen(false); }} style={{ ...styles.mobileMenuItem, color: t.textMuted, borderBottomColor: t.borderLight }}>
                                {link.label}
                            </a>
                        ))}
                    </div>
                )}
            </nav>

            <div style={{ ...styles.content, padding: isMobile ? '20px 16px' : '28px 24px' }}>

                {/* Header */}
                <div style={{ ...styles.tag, background: t.tagBg, color: t.textMuted }}>{'// setup_match'}</div>
                <h1 style={{ ...styles.title, color: t.text, fontSize: isMobile ? '20px' : '28px' }}>
                    <span style={styles.kw}>const</span> match{' '}
                    <span style={styles.op}>=</span>{' '}
                    <span style={styles.fn}>configure</span>
                    <span style={{ color: t.text }}>()</span>
                </h1>

                {/* Step 1 — Mode */}
                <div style={styles.section}>
                    <div style={{ ...styles.stepTag, background: t.tagBg, color: t.textMuted }}>{'// step_1: select_mode'}</div>
                    <div style={{ ...styles.modeGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
                        <div
                            style={{ ...styles.modeCard, background: t.cardBg, boxShadow: t.shadow, ...(mode === 'solo' ? styles.modeCardActive : {}), borderColor: mode === 'solo' ? '#a6e22e' : t.border, padding: isMobile ? '18px' : '24px' }}
                            onClick={() => setMode('solo')}
                        >
                            <div style={styles.modeIcon}><svg width="32" height="32" viewBox="0 0 24 24" fill="#a6e22e"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" /></svg></div>
                            <div style={{ ...styles.modeName, color: mode === 'solo' ? t.green : t.text }}>SOLO</div>
                            <div style={{ ...styles.modeDesc, color: t.textMuted }}>Practice at your own pace</div>
                        </div>
                        <div
                            style={{ ...styles.modeCard, background: t.cardBg, boxShadow: t.shadow, ...(mode === '1v1' ? styles.modeCardActive : {}), borderColor: mode === '1v1' ? '#f92672' : t.border, padding: isMobile ? '18px' : '24px' }}
                            onClick={() => setMode('1v1')}
                        >
                            <div style={{ ...styles.modeIcon, color: '#f92672' }}>⚔</div>
                            <div style={{ ...styles.modeName, color: mode === '1v1' ? '#f92672' : t.text }}>1v1 CHALLENGE</div>
                            <div style={{ ...styles.modeDesc, color: t.textMuted }}>Battle another player</div>
                        </div>
                    </div>

                    {mode === '1v1' && (
                        <div style={{ ...styles.subChoiceRow, flexDirection: isMobile ? 'column' : 'row' }}>
                            <button
                                style={{ ...styles.subChoiceBtn, borderColor: t.border, color: t.textMuted, ...(oneVoneType === 'random' ? styles.subChoiceActive : {}) }}
                                onClick={() => { setOneVoneType('random'); setChallengeMsg(null); }}
                            >
                                ⚔ Random Opponent
                            </button>
                            <button
                                style={{ ...styles.subChoiceBtn, borderColor: t.border, color: t.textMuted, ...(oneVoneType === 'friend' ? styles.subChoiceActive : {}) }}
                                onClick={() => { setOneVoneType('friend'); setChallengeMsg(null); }}
                            >
                                Challenge a Friend
                            </button>
                        </div>
                    )}

                    {isFriend && (
                        <div style={styles.opponentBlock}>
                            <div style={{ ...styles.opponentLabel, color: t.textMuted }}>{'// opponent_username'}</div>
                            <input
                                style={{ ...styles.challengeInput, background: t.cardBg, borderColor: t.border, color: t.text }}
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
                        <div style={{ ...styles.stepTag, background: t.tagBg, color: t.textMuted }}>{'// step_2: select_category'}</div>
                        <div style={{ ...styles.catsGrid, borderColor: t.border, gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)' }}>
                            {categories.map((cat, i) => (
                                <div
                                    key={cat.slug}
                                    style={{
                                        ...styles.catCard,
                                        background: t.cardAltBg,
                                        borderTop: `4px solid ${themeColor(cat.color, t)}`,
                                        borderRight: isMobile ? (i % 2 === 0 ? `3px solid ${t.border}` : 'none') : ((i + 1) % 4 !== 0 ? `3px solid ${t.border}` : 'none'),
                                        borderBottom: `3px solid ${t.border}`,
                                        ...(category === cat.slug ? { background: t.isLight ? '#c5c2b5' : '#3e3d32' } : {}),
                                    }}
                                    onClick={() => setCategory(cat.slug)}
                                    onMouseEnter={e => e.currentTarget.style.background = t.isLight ? '#c5c2b5' : '#3e3d32'}
                                    onMouseLeave={e => e.currentTarget.style.background = category === cat.slug ? (t.isLight ? '#c5c2b5' : '#3e3d32') : t.cardAltBg}
                                >
                                    <div style={{ ...styles.catIcon, color: themeColor(cat.color, t) }}>{cat.short}</div>
                                    <div style={{ ...styles.catName, color: t.text }}>{cat.name}</div>
                                    {category === cat.slug && <div style={{ fontSize: '10px', color: themeColor(cat.color, t), marginTop: '4px' }}>✓ selected</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3 — Difficulty */}
                {mode && category && (
                    <div style={styles.section}>
                        <div style={{ ...styles.stepTag, background: t.tagBg, color: t.textMuted }}>{'// step_3: select_difficulty'}</div>
                        <div style={{ ...styles.diffRow, flexDirection: isMobile ? 'column' : 'row' }}>
                            {DIFFICULTIES.map((d, i) => (
                                <button
                                    key={d}
                                    style={{
                                        ...styles.diffBtn,
                                        borderColor: t.border,
                                        color: t.textMuted,
                                        borderRight: isMobile ? `2px solid ${t.border}` : (i === DIFFICULTIES.length - 1 ? `2px solid ${t.border}` : 'none'),
                                        width: isMobile ? '100%' : 'auto',
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

                {/* Final action */}
                {mode && category && (
                    isFriend ? (
                        <div style={styles.section}>
                            {challengeMsg && (
                                <div style={{ ...styles.challengeMsg, color: challengeMsg.type === 'success' ? t.green : '#f92672', borderColor: challengeMsg.type === 'success' ? t.green : '#f92672' }}>
                                    {challengeMsg.text}
                                </div>
                            )}
                            <button
                                style={{ ...styles.startBtn, background: '#f92672', borderColor: '#f92672', color: '#f8f8f2', boxShadow: t.shadow, opacity: sending ? 0.6 : 1, fontSize: isMobile ? '12px' : '14px' }}
                                onClick={handleSendChallenge}
                                disabled={sending}
                            >
                                {sending ? 'SENDING...' : '⚔ SEND CHALLENGE'}
                            </button>
                            <div style={{ ...styles.challengeHint, color: t.textMuted }}>
                                {'// they\'ll get a notification to accept or decline'}
                            </div>
                        </div>
                    ) : (
                        <button
                            style={{ ...styles.startBtn, boxShadow: t.shadow, opacity: !category ? 0.5 : 1, fontSize: isMobile ? '12px' : '14px' }}
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
    hamburger: { fontFamily: "'Space Mono', monospace", fontSize: '18px', fontWeight: 700, background: 'transparent', border: '2px solid #75715e', padding: '4px 10px', cursor: 'pointer' },
    mobileMenu: { width: '100%', borderTop: '2px solid #3e3d32', display: 'flex', flexDirection: 'column' },
    mobileMenuItem: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, padding: '12px 16px', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', textDecoration: 'none', borderBottom: '1px solid #3e3d32' },
    navRight: { display: 'flex', alignItems: 'center', gap: '10px' },
    themeToggle: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '2px solid #75715e', padding: '6px 10px', cursor: 'pointer' },
    xpBadge: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, background: '#e6db74', color: '#272822', border: '2px solid #e6db74', padding: '4px 14px', display: 'flex', alignItems: 'center' },

    content: { padding: '28px 24px', maxWidth: '900px', margin: '0 auto' },

    tag: { fontSize: '11px', background: '#3e3d32', color: '#75715e', display: 'inline-block', padding: '3px 10px', marginBottom: '10px', letterSpacing: '2px' },
    title: { fontSize: '28px', fontWeight: 700, color: '#f8f8f2', marginBottom: '28px' },
    kw: { color: '#66d9e8' },
    op: { color: '#f92672' },
    fn: { color: '#a6e22e' },

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