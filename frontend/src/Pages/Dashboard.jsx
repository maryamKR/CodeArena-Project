import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/useAuth';
import { useTheme } from '../Context/ThemeContext';
import { getThemeColors } from '../Constants/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';
import socket from '../socket/socket';
import api from '../API/axios';

const NAV_LINKS = [
    { label: 'Home', path: '/' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Quiz', path: '/quiz' },
    { label: 'Leaderboard', path: '/leaderboard' },
    { label: 'Profile', path: '/profile' },
];

const BADGE_COLORS = {
  'First Blood': '#f92672',
  'Perfect Score': '#e6db74',
  'Speed Demon': '#66d9e8',
  '10 Wins': '#a6e22e',
  'Centurion': '#e6db74',
  'XP Master': '#f92672',
  'Streak 3': '#66d9e8',
  'Streak 7': '#a6e22e',
};

const themeColor = (hex, t) => {
    if (hex === '#e6db74') return t.yellow;
    if (hex === '#a6e22e') return t.green;
    return hex;
};

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const t = getThemeColors(theme);
    const bp = useBreakpoint();
    const isMobile = bp === 'mobile';
    const isTablet = bp === 'tablet';

    const [history, setHistory] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [myRank, setMyRank] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);

    const [showChallenge, setShowChallenge] = useState(false);
    const [opponent, setOpponent] = useState('');
    const [challengeMsg, setChallengeMsg] = useState(null);
    const [sending, setSending] = useState(false);
    const [categories, setCategories] = useState([]);
    const [chCategory, setChCategory] = useState('');
    const [chDifficulty, setChDifficulty] = useState('Easy');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const debounceRef = useRef(null);
    const searchWrapRef = useRef(null);

    const [invites, setInvites] = useState([]);
    const [invitesLoading, setInvitesLoading] = useState(true);
    const [actioningId, setActioningId] = useState(null);

    useEffect(() => {
        if (!user?._id) return;
        api.get('/leaderboard')
            .then(res => setLeaderboard(res.data.data?.slice(0, 10) || []))
            .catch(() => setLeaderboard([]));
        api.get(`/history/${user.username}`)
            .then(res => setHistory(res.data.data?.slice(0, 5) || []))
            .catch(() => setHistory([]));
        api.get('/leaderboard/me')
            .then(res => setMyRank(res.data.data))
            .catch(() => { });
        api.get('/categories')
            .then(res => setCategories(Array.isArray(res.data) ? res.data : []))
            .catch(() => setCategories([]));
        api.get('/challenges/pending')
            .then(res => setInvites(res.data.data || []))
            .catch(() => setInvites([]))
            .finally(() => setInvitesLoading(false));
    }, [user]);

    useEffect(() => {
        if (!showDropdown) return;
        const onClickAway = (e) => {
            if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', onClickAway);
        return () => document.removeEventListener('mousedown', onClickAway);
    }, [showDropdown]);

    useEffect(() => {
        if (!socket.connected) socket.connect();

        const handleChallengeReceived = (data) => {
            setInvites(prev => {
                if (prev.some(i => i.id === data.id)) return prev;
                return [...prev, data];
            });
        };

        const handleChallengeAccepted = (data) => {
            navigate(`/match/${data.id}`, {
                state: {
                    challengeId: data.id,
                    opponent: data.receiver,
                    category: data.category,
                    difficulty: data.difficulty,
                },
            });
        };

        socket.on('challenge_received', handleChallengeReceived);
        socket.on('challenge_accepted', handleChallengeAccepted);

        return () => {
            socket.off('challenge_received', handleChallengeReceived);
            socket.off('challenge_accepted', handleChallengeAccepted);
        };
    }, [navigate]);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const handleOpponentChange = (value) => {
        setOpponent(value);
        setChallengeMsg(null);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        const q = value.trim();
        if (q.length < 3) { setResults([]); setShowDropdown(false); return; }
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
                const list = (res.data.data || []).filter(u => u.username !== user?.username);
                setResults(list);
                setShowDropdown(true);
            } catch { setResults([]); setShowDropdown(false); }
            finally { setSearching(false); }
        }, 300);
    };

    const pickOpponent = (username) => { setOpponent(username); setResults([]); setShowDropdown(false); };

    const handleSendChallenge = async () => {
        const name = opponent.trim();
        if (name.length < 3) { setChallengeMsg({ type: 'error', text: 'Username must be at least 3 characters' }); return; }
        setSending(true); setChallengeMsg(null); setShowDropdown(false);
        try {
            const body = { receiverUsername: name, difficulty: chDifficulty };
            if (chCategory) body.category = chCategory;
            await api.post('/challenges', body);
            setChallengeMsg({ type: 'success', text: `Challenge sent to ${name}!` });
            setOpponent(''); setResults([]);
        } catch (err) {
            const status = err?.response?.status;
            const text = status === 404 ? 'No player found with that username' : status === 409 ? 'You already have a pending challenge with this player' : status === 400 ? 'You cannot challenge yourself' : status === 429 ? 'Too many challenges — try again later' : 'Failed to send challenge';
            setChallengeMsg({ type: 'error', text });
        } finally { setSending(false); }
    };

    const handleAcceptInvite = async (inv) => {
        setActioningId(inv.id);
        try {
            await api.put(`/challenges/${inv.id}/accept`);
            navigate(`/match/${inv.id}`, { state: { challengeId: inv.id, opponent: inv.sender, category: inv.category?.slug, difficulty: inv.difficulty } });
        } catch { setInvites(prev => prev.filter(i => i.id !== inv.id)); setActioningId(null); }
    };

    const handleDeclineInvite = async (inv) => {
        setActioningId(inv.id);
        try { await api.put(`/challenges/${inv.id}/decline`); } catch { }
        finally { setInvites(prev => prev.filter(i => i.id !== inv.id)); setActioningId(null); }
    };

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
                                    ...(i === 1 ? styles.navLinkActive : {}),
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
                    {!isMobile && <div style={{ ...styles.userBadge, color: t.green, borderColor: t.green }}>{user?.username || 'player'}</div>}
                    <div style={styles.xpBadge}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#272822" style={{ marginRight: '6px', verticalAlign: 'middle' }}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                        {user?.totalXP || 0} XP
                    </div>
                    {!isMobile && <button style={styles.logoutBtn} onClick={handleLogout}>logout()</button>}
                </div>

                {isMobile && menuOpen && (
                    <div style={{ ...styles.mobileMenu, background: t.navBg, borderTopColor: t.border }}>
                        {NAV_LINKS.map((link) => (
                            <a key={link.label} onClick={() => { navigate(link.path); setMenuOpen(false); }} style={{ ...styles.mobileMenuItem, color: t.textMuted, borderBottomColor: t.borderLight }}>
                                {link.label}
                            </a>
                        ))}
                        <a onClick={async () => { await handleLogout(); setMenuOpen(false); }} style={{ ...styles.mobileMenuItem, color: '#f92672', borderBottomColor: t.borderLight }}>
                            logout()
                        </a>
                    </div>
                )}
            </nav>

            <div style={{ ...styles.content, padding: isMobile ? '20px 16px' : '28px 24px' }}>

                {/* Welcome */}
                <div style={{ ...styles.welcomeRow, borderBottomColor: t.borderLight, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '12px' : '0' }}>
                    <div>
                        <div style={{ ...styles.welcomeTag, background: t.tagBg, color: t.textMuted }}>{'// welcome_back'}</div>
                        <h1 style={{ ...styles.welcomeTitle, color: t.text, fontSize: isMobile ? '20px' : '28px' }}>
                            <span style={styles.kw}>const</span> player{' '}
                            <span style={styles.op}>=</span>{' '}
                            <span style={{ ...styles.str, color: t.yellow }}>"{user?.username || 'coder'}"</span>
                        </h1>
                    </div>
                    <div style={{ ...styles.rankBadge, background: t.cardBg, borderColor: t.border, boxShadow: t.shadow }}>
                        <div style={{ ...styles.rankLabel, color: t.textMuted }}>RANK</div>
                        <div style={{ ...styles.rankVal, color: t.green }}>{user?.rank || 'Beginner'}</div>
                    </div>
                </div>

                {/* Stats */}
                <div style={{ ...styles.statsRow, borderColor: t.border, gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)' }}>
                    {[
                        { label: 'Total XP', val: user?.totalXP || 0, color: '#e6db74' },
                        { label: 'Quizzes Played', val: user?.quizzesPlayed || 0, color: '#a6e22e' },
                        { label: 'Global Rank', val: myRank ? `#${myRank.globalRank}` : '-', color: '#66d9e8' },
                        { label: 'Badges', val: user?.badges?.length || 0, color: '#f92672' },
                        { label: 'Streak', val: `${user?.streak || 0} days`, color: '#e6db74' },
                    ].map((stat, i) => (
                        <div key={stat.label} style={{ ...styles.statCard, background: t.cardBg, borderRight: `2px solid ${t.border}`, borderBottom: `2px solid ${t.border}` }}>
                            <div style={{ ...styles.statVal, color: themeColor(stat.color, t), fontSize: isMobile ? '20px' : '26px' }}>{stat.val}</div>
                            <div style={{ ...styles.statLabel, color: t.textMuted }}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Challenge invites */}
                <div style={{ ...styles.sectionTag, background: t.tagBg, color: t.textMuted }}>{'// challenge_invites'}</div>
                <div style={{ ...styles.invitesCard, background: t.cardBg, borderColor: t.border, boxShadow: t.shadow }}>
                    {invitesLoading ? (
                        <div style={{ ...styles.emptyTag, color: t.textMuted }}>{'// loading_invites...'}</div>
                    ) : invites.length === 0 ? (
                        <div style={{ ...styles.emptyTag, color: t.textMuted }}>{'// no_pending_challenges'}</div>
                    ) : (
                        invites.map((inv, i) => (
                            <div key={inv.id} style={{ ...styles.inviteRow, borderBottom: i < invites.length - 1 ? `2px solid ${t.borderLight}` : 'none', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
                                <div style={styles.inviteLeft}>
                                    <span style={{ ...styles.inviteFrom, color: t.text }}>
                                        {inv.sender?.isOnline && <span style={styles.onlineDot} />}
                                        {inv.sender?.username || 'someone'}
                                    </span>
                                    <span style={{ ...styles.inviteMeta, color: t.textMuted }}>
                                        challenges you{inv.category?.name ? ` · ${inv.category.name}` : ''}{inv.difficulty ? ` · ${inv.difficulty}` : ''}
                                    </span>
                                </div>
                                <div style={{ ...styles.inviteBtns, width: isMobile ? '100%' : 'auto', marginTop: isMobile ? '8px' : '0' }}>
                                    <button style={{ ...styles.acceptBtn, flex: isMobile ? 1 : 'none', opacity: actioningId === inv.id ? 0.6 : 1 }} onClick={() => handleAcceptInvite(inv)} disabled={actioningId === inv.id}>✓ ACCEPT</button>
                                    <button style={{ ...styles.declineBtn, flex: isMobile ? 1 : 'none', opacity: actioningId === inv.id ? 0.6 : 1 }} onClick={() => handleDeclineInvite(inv)} disabled={actioningId === inv.id}>✕ DECLINE</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div style={{ ...styles.mainGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 300px' }}>

                    {/* Left */}
                    <div>
                        <div style={{ ...styles.sectionTag, background: t.tagBg, color: t.textMuted }}>{'// quick_actions'}</div>
                        <div style={{ ...styles.actionsGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>

                            {/* Solo */}
                            <div style={{ ...styles.actionCard, background: t.cardBg, borderColor: t.border, boxShadow: t.shadow, borderTop: `4px solid ${t.green}` }}>
                                <div style={{ ...styles.actionTitle, color: t.green }}>SOLO QUIZ</div>
                                <div style={{ ...styles.actionSub, color: t.textMuted }}>Practice at your own pace.</div>
                                <button style={styles.soloBtn} onClick={() => navigate('/quiz', { state: { mode: 'solo' } })} onMouseEnter={e => e.currentTarget.style.background = '#8dca25'} onMouseLeave={e => e.currentTarget.style.background = '#a6e22e'}>
                                    ▶ Start Solo
                                </button>
                            </div>

                            {/* 1v1 */}
                            <div style={{ ...styles.actionCard, background: t.cardBg, borderColor: t.border, boxShadow: t.shadow, borderTop: '4px solid #f92672' }}>
                                <div style={{ ...styles.actionTitle, color: '#f92672' }}>1v1 CHALLENGE</div>
                                <div style={{ ...styles.actionSub, color: t.textMuted }}>Battle an opponent in real-time.</div>
                                <div style={styles.challengeBtns}>
                                    <button style={styles.randomBtn} onClick={() => navigate('/quiz', { state: { mode: '1v1' } })} onMouseEnter={e => e.currentTarget.style.opacity = '0.85'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                        ⚔ Find Random Opponent
                                    </button>
                                    <div style={styles.orDivider}>
                                        <div style={{ ...styles.orLine, background: t.borderLight }}></div>
                                        <span style={{ ...styles.orText, color: t.textMuted }}>OR</span>
                                        <div style={{ ...styles.orLine, background: t.borderLight }}></div>
                                    </div>
                                    {!showChallenge ? (
                                        <button style={styles.friendBtn} onClick={() => { setShowChallenge(true); setChallengeMsg(null); }} onMouseEnter={e => { e.currentTarget.style.background = '#f92672'; e.currentTarget.style.color = '#f8f8f2'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#f92672'; }}>
                                            Challenge a Friend
                                        </button>
                                    ) : (
                                        <div style={styles.challengeFormCol}>
                                            <div style={{ ...styles.challengeSelectRow, flexDirection: isMobile ? 'column' : 'row' }}>
                                                <select style={{ ...styles.challengeSelect, background: t.pageBg, borderColor: t.border, color: t.text }} value={chCategory} onChange={e => setChCategory(e.target.value)}>
                                                    <option value="">any category</option>
                                                    {categories.map(c => (<option key={c._id} value={c._id}>{c.name}</option>))}
                                                </select>
                                                <select style={{ ...styles.challengeSelect, background: t.pageBg, borderColor: t.border, color: t.text }} value={chDifficulty} onChange={e => setChDifficulty(e.target.value)}>
                                                    <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
                                                </select>
                                            </div>
                                            <div style={styles.challengeForm}>
                                                <div style={styles.searchWrap} ref={searchWrapRef}>
                                                    <input style={{ ...styles.challengeInput, background: t.pageBg, borderColor: t.border, color: t.text }} type="text" placeholder="opponent_username" value={opponent} onChange={e => handleOpponentChange(e.target.value)} onFocus={() => { if (results.length > 0) setShowDropdown(true); }} onKeyDown={e => e.key === 'Enter' && handleSendChallenge()} autoComplete="off" autoFocus />
                                                    {showDropdown && (
                                                        <div style={{ ...styles.dropdown, background: t.cardBg, borderColor: t.border, boxShadow: t.shadow }}>
                                                            {searching ? (<div style={{ ...styles.dropdownEmpty, color: t.textMuted }}>{'// searching...'}</div>
                                                            ) : results.length === 0 ? (<div style={{ ...styles.dropdownEmpty, color: t.textMuted }}>{'// no_players_found'}</div>
                                                            ) : (results.map((u) => (
                                                                <div key={u._id} style={{ ...styles.dropdownRow, borderBottomColor: t.borderLight }} onClick={() => pickOpponent(u.username)} onMouseEnter={e => e.currentTarget.style.background = t.borderLight} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                                    <span style={{ ...styles.dropdownName, color: t.text }}>{u.isOnline && <span style={styles.onlineDot} />}{u.username}</span>
                                                                    <span style={{ ...styles.dropdownRank, color: t.textMuted }}>{u.rank}</span>
                                                                </div>
                                                            )))}
                                                        </div>
                                                    )}
                                                </div>
                                                <button style={{ ...styles.challengeSendBtn, opacity: sending ? 0.6 : 1 }} onClick={handleSendChallenge} disabled={sending}>{sending ? '...' : 'SEND'}</button>
                                            </div>
                                        </div>
                                    )}
                                    {challengeMsg && (
                                        <div style={{ ...styles.challengeMsg, color: challengeMsg.type === 'success' ? t.green : '#f92672', borderColor: challengeMsg.type === 'success' ? t.green : '#f92672' }}>
                                            {challengeMsg.text}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recent activity */}
                        <div style={{ ...styles.sectionTag, background: t.tagBg, color: t.textMuted, marginTop: '20px' }}>{'// recent_activity'}</div>
                        <div style={{ ...styles.activityCard, background: t.cardBg, borderColor: t.border }}>
                            <div style={{ ...styles.activityHeader, borderBottomColor: t.borderLight, color: t.textMuted }}>// quiz_history</div>
                            {history.length === 0 ? (
                                <div style={{ ...styles.emptyTag, color: t.textMuted }}>{'// no_recent_activity — play a quiz to see your history!'}</div>
                            ) : (
                                history.map((h, i) => (
                                    <div key={i} style={{ ...styles.activityRow, gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr 1fr', borderBottom: i < history.length - 1 ? `1px solid ${t.borderLight}` : 'none' }}>
                                        <div style={{ color: '#66d9e8', fontSize: '12px', textAlign: 'left' }}>{h.category?.name || '?'}</div>
                                        <div style={{ color: t.textMuted, fontSize: '11px', textAlign: isMobile ? 'right' : 'center' }}>{h.difficulty}</div>
                                        <div style={{ color: t.green, fontWeight: 700, fontSize: '12px', textAlign: isMobile ? 'left' : 'center' }}>{h.correctAnswers}/10</div>
                                        <div style={{ color: t.yellow, fontSize: '11px', textAlign: 'right' }}>+{h.earnedXP} XP</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right */}
                    <div style={styles.rightCol}>
                        <div style={{ ...styles.sectionTag, background: t.tagBg, color: t.textMuted }}>{'// top_players'}</div>
                        <div style={{ ...styles.leaderCard, background: t.cardBg, borderColor: t.border, boxShadow: t.shadow }}>
                            {leaderboard.map((p, i) => (
                                <div key={p._id || i} style={{ ...styles.leaderRow, borderBottom: i < 2 ? `1px solid ${t.borderLight}` : 'none' }}>
                                    <div style={{ ...styles.leaderRank, color: t.yellow }}>#{i + 1}</div>
                                    <div style={{ ...styles.leaderName, color: t.text }}>{p.username}</div>
                                    <div style={{ ...styles.leaderXP, color: t.yellow }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill={t.yellow} style={{ marginRight: '4px', verticalAlign: 'middle' }}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                                        {p.totalXP}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ ...styles.sectionTag, background: t.tagBg, color: t.textMuted, marginTop: '16px' }}>{'// badges'}</div>
                        <div style={{ ...styles.badgesCard, background: t.cardBg, borderColor: t.border }}>
                            {user?.badges?.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {user.badges.map((badge, i) => (
                                        <div key={i} style={{ ...styles.badge, borderColor: themeColor(BADGE_COLORS[badge] || t.textMuted, t), color: themeColor(BADGE_COLORS[badge] || t.textMuted, t) }}>{badge}</div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ ...styles.emptyTag, color: t.textMuted }}>{'// no_badges_yet'}</div>
                            )}
                        </div>
                    </div>
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
    navLinks: { display: 'flex' },
    navLink: { fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, color: '#75715e', textDecoration: 'none', padding: '5px 14px', border: '2px solid #75715e', borderRight: 'none', textTransform: 'uppercase', letterSpacing: '1px', background: 'transparent' },
    navLinkActive: { background: '#a6e22e', color: '#272822', borderColor: '#a6e22e' },
    hamburger: { fontFamily: "'Space Mono', monospace", fontSize: '18px', fontWeight: 700, background: 'transparent', border: '2px solid #75715e', padding: '4px 10px', cursor: 'pointer' },
    mobileMenu: { width: '100%', borderTop: '2px solid #3e3d32', display: 'flex', flexDirection: 'column' },
    mobileMenuItem: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, padding: '12px 16px', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', textDecoration: 'none', borderBottom: '1px solid #3e3d32' },
    themeToggle: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '2px solid #75715e', padding: '6px 10px', cursor: 'pointer' },
    navRight: { display: 'flex', alignItems: 'center', gap: '10px' },
    userBadge: { fontFamily: "'Space Mono', monospace", fontSize: '12px', color: '#a6e22e', border: '2px solid #a6e22e', padding: '4px 12px' },
    xpBadge: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, background: '#e6db74', color: '#272822', border: '2px solid #e6db74', padding: '4px 14px', display: 'flex', alignItems: 'center' },
    logoutBtn: { fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#f92672', border: '2px solid #f92672', padding: '4px 12px', background: 'transparent', cursor: 'pointer' },

    content: { padding: '28px 24px' },

    welcomeRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '3px solid #3e3d32', paddingBottom: '20px' },
    welcomeTag: { fontSize: '11px', background: '#3e3d32', color: '#75715e', display: 'inline-block', padding: '3px 10px', marginBottom: '10px', letterSpacing: '2px' },
    welcomeTitle: { fontSize: '28px', fontWeight: 700, color: '#f8f8f2', margin: 0 },
    kw: { color: '#66d9e8' },
    op: { color: '#f92672' },
    str: { color: '#e6db74' },
    rankBadge: { background: '#1e1f1a', border: '3px solid #75715e', padding: '12px 20px', textAlign: 'center', boxShadow: '4px 4px 0 #3e3d32' },
    rankLabel: { fontSize: '10px', color: '#75715e', letterSpacing: '2px', marginBottom: '4px' },
    rankVal: { fontSize: '16px', fontWeight: 700, color: '#a6e22e' },

    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', border: '3px solid #75715e', marginBottom: '28px' },
    statCard: { padding: '16px 20px', textAlign: 'center', background: '#1e1f1a' },
    statVal: { fontSize: '26px', fontWeight: 700 },
    statLabel: { fontSize: '10px', color: '#75715e', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' },

    invitesCard: { background: '#1e1f1a', border: '3px solid #75715e', marginBottom: '28px', boxShadow: '4px 4px 0 #3e3d32' },
    inviteRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', gap: '16px', flexWrap: 'wrap' },
    inviteLeft: { display: 'flex', flexDirection: 'column', gap: '4px' },
    inviteFrom: { fontSize: '14px', fontWeight: 700, color: '#f8f8f2', display: 'flex', alignItems: 'center' },
    inviteMeta: { fontSize: '11px', color: '#75715e' },
    inviteMessage: { fontSize: '11px', color: '#e6db74', fontStyle: 'italic', marginTop: '2px' },
    onlineDot: { width: '7px', height: '7px', borderRadius: '50%', background: '#a6e22e', marginRight: '8px', display: 'inline-block' },
    inviteBtns: { display: 'flex', gap: '8px', flexShrink: 0 },
    acceptBtn: { fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, background: '#a6e22e', color: '#272822', border: '2px solid #a6e22e', padding: '7px 14px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' },
    declineBtn: { fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, background: 'transparent', color: '#f92672', border: '2px solid #f92672', padding: '7px 14px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' },

    mainGrid: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' },

    sectionTag: { fontSize: '11px', background: '#3e3d32', color: '#75715e', display: 'inline-block', padding: '3px 10px', marginBottom: '12px', letterSpacing: '2px' },

    actionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
    actionCard: { background: '#1e1f1a', border: '3px solid #75715e', padding: '18px', boxShadow: '4px 4px 0 #3e3d32' },
    actionTitle: { fontSize: '14px', fontWeight: 700, marginBottom: '8px', letterSpacing: '1px' },
    actionSub: { fontSize: '11px', color: '#75715e', marginBottom: '14px', lineHeight: 1.5 },
    soloBtn: { width: '100%', background: '#a6e22e', color: '#272822', border: 'none', fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, padding: '10px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', transition: 'background 0.15s' },
    challengeBtns: { display: 'flex', flexDirection: 'column', gap: '8px' },
    randomBtn: { width: '100%', background: '#f92672', color: '#f8f8f2', border: 'none', fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, padding: '9px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', transition: 'opacity 0.15s' },
    orDivider: { display: 'flex', alignItems: 'center', gap: '8px' },
    orLine: { flex: 1, height: '1px', background: '#3e3d32' },
    orText: { fontSize: '9px', color: '#75715e', letterSpacing: '2px' },
    friendBtn: { width: '100%', background: 'transparent', color: '#f92672', border: '2px solid #f92672', fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, padding: '9px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', transition: 'all 0.15s' },
    challengeForm: { display: 'flex', gap: '6px' },
    challengeFormCol: { display: 'flex', flexDirection: 'column', gap: '6px' },
    challengeSelectRow: { display: 'flex', gap: '6px' },
    challengeSelect: { flex: 1, background: '#272822', border: '2px solid #75715e', color: '#f8f8f2', fontFamily: "'Space Mono', monospace", fontSize: '10px', padding: '7px 8px', outline: 'none', cursor: 'pointer' },
    searchWrap: { position: 'relative', flex: 1 },
    dropdown: { position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#1e1f1a', border: '2px solid #75715e', boxShadow: '4px 4px 0 #3e3d32', zIndex: 30, maxHeight: '180px', overflowY: 'auto' },
    dropdownRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #3e3d32' },
    dropdownName: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, color: '#f8f8f2', display: 'flex', alignItems: 'center' },
    dropdownRank: { fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#75715e', textTransform: 'uppercase', letterSpacing: '1px' },
    dropdownEmpty: { fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#75715e', padding: '10px 12px', fontStyle: 'italic' },
    challengeInput: { width: '100%', boxSizing: 'border-box', background: '#272822', border: '2px solid #75715e', color: '#f8f8f2', fontFamily: "'Space Mono', monospace", fontSize: '11px', padding: '8px 10px', outline: 'none' },
    challengeSendBtn: { background: '#f92672', color: '#f8f8f2', border: 'none', fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, padding: '8px 14px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' },
    challengeMsg: { fontFamily: "'Space Mono', monospace", fontSize: '10px', fontWeight: 700, padding: '6px 8px', border: '2px solid', letterSpacing: '0.5px' },

    activityCard: { background: '#1e1f1a', border: '3px solid #75715e' },
    activityHeader: { padding: '10px 14px', borderBottom: '2px solid #3e3d32', fontSize: '10px', color: '#75715e', letterSpacing: '2px' },
    activityRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', alignItems: 'center', padding: '10px 14px', gap: '8px' },
    emptyTag: { padding: '16px 14px', fontSize: '11px', color: '#75715e', fontStyle: 'italic' },

    rightCol: { display: 'flex', flexDirection: 'column' },
    leaderCard: { background: '#1e1f1a', border: '3px solid #75715e', boxShadow: '4px 4px 0 #3e3d32' },
    leaderRow: { display: 'flex', alignItems: 'center', padding: '12px 14px', gap: '10px' },
    leaderRank: { fontSize: '12px', fontWeight: 700, color: '#e6db74', width: '28px' },
    leaderName: { flex: 1, fontSize: '12px', fontWeight: 700, color: '#f8f8f2' },
    leaderXP: { fontSize: '11px', color: '#e6db74', display: 'flex', alignItems: 'center' },

    badgesCard: { background: '#1e1f1a', border: '3px solid #75715e', padding: '14px', marginTop: '0' },
    badge: { fontSize: '10px', fontWeight: 700, padding: '3px 8px', border: '2px solid #75715e', color: '#75715e', letterSpacing: '1px' },
};