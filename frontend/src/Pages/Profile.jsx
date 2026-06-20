import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/useAuth';
import { useTheme } from '../Context/ThemeContext';
<<<<<<< HEAD
import { getThemeColors } from '../Constants/theme';
import api from '../API/axios';
=======
import { getThemeColors } from '../constants/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';
import api from '../api/axios';
>>>>>>> feat/selma-frontend

const NAV_LINKS = [
    { label: 'Home', path: '/' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Quiz', path: '/quiz' },
    { label: 'Leaderboard', path: '/leaderboard' },
    { label: 'Profile', path: '/profile' },
];

const BADGE_COLORS = {
    'First Blood': '#f92672', 'Perfect Score': '#e6db74', 'Speed Demon': '#66d9e8',
    '10 Wins': '#a6e22e', 'Centurion': '#e6db74', 'XP Master': '#f92672',
    'Streak 3': '#66d9e8', 'Streak 7': '#a6e22e',
};

const BADGE_INFO = {
    'First Blood': 'Won your very first quiz', 'Perfect Score': 'Answered every question correctly in a quiz',
    'Speed Demon': 'Finished a quiz with lots of time to spare', '10 Wins': 'Won 10 quizzes',
    'Centurion': 'Earned 100+ total XP', 'XP Master': 'Reached a top XP milestone',
    'Streak 3': 'Played 3 days in a row', 'Streak 7': 'Played 7 days in a row',
};

const themeColor = (hex, t) => {
    if (hex === '#e6db74') return t.yellow;
    if (hex === '#a6e22e') return t.green;
    return hex;
};

export default function Profile() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const t = getThemeColors(theme);
    const bp = useBreakpoint();
    const isMobile = bp === 'mobile';

    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myRank, setMyRank] = useState(null);
    const [hoveredBadge, setHoveredBadge] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            try { const res = await api.get(`/history/${user?.username}`); setHistory(res.data.data || []); }
            catch { setHistory([]); } finally { setLoading(false); }
        };
        if (user?._id) fetchHistory();
        api.get('/leaderboard/me').then(res => setMyRank(res.data.data)).catch(() => { });
    }, [user]);

    const handleLogout = async () => { await logout(); navigate('/'); };

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
                            <a key={link.label} onClick={() => navigate(link.path)} style={{ ...styles.navLink, borderColor: t.border, color: t.textMuted, ...(i === 4 ? styles.navLinkActive : {}), ...(i === NAV_LINKS.length - 1 ? { borderRight: `2px solid ${t.border}` } : { borderRight: 'none' }), cursor: 'pointer' }}>
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
                            <a key={link.label} onClick={() => { navigate(link.path); setMenuOpen(false); }} style={{ ...styles.mobileMenuItem, color: t.textMuted, borderBottomColor: t.borderLight }}>{link.label}</a>
                        ))}
                        <a onClick={async () => { await handleLogout(); setMenuOpen(false); }} style={{ ...styles.mobileMenuItem, color: '#f92672', borderBottomColor: t.borderLight }}>logout()</a>
                    </div>
                )}
            </nav>

            <div style={{ ...styles.content, padding: isMobile ? '20px 16px' : '28px 24px' }}>

                <div style={{ ...styles.tag, background: t.tagBg, color: t.textMuted }}>{'// profile'}</div>
                <h1 style={{ ...styles.title, color: t.text, fontSize: isMobile ? '18px' : '24px' }}>
                    <span style={styles.kw}>const</span> me{' '}
                    <span style={styles.op}>=</span>{' '}
                    <span style={{ ...styles.str, color: t.yellow }}>"{user?.username}"</span>
                </h1>

                <div style={{ ...styles.mainGrid, gridTemplateColumns: isMobile ? '1fr' : '340px 1fr' }}>

                    {/* Left column */}
                    <div style={styles.leftCol}>
                        <div style={{ ...styles.userCard, background: t.cardBg, borderColor: t.border, boxShadow: t.shadow }}>
                            <div style={styles.avatar}>{user?.username?.[0]?.toUpperCase()}</div>
                            <div>
                                <div style={{ ...styles.username, color: t.text }}>{user?.username}</div>
                                <div style={{ ...styles.email, color: t.textMuted }}>{user?.email}</div>
                                <div style={{ ...styles.rankBadge, color: t.green, borderColor: t.green, background: t.isLight ? 'rgba(74,122,12,0.15)' : 'rgba(166,226,46,0.15)' }}>{user?.rank || 'Beginner'}</div>
                            </div>
                        </div>

                        <div style={{ ...styles.statsGrid, borderColor: t.border }}>
                            {[
                                { label: 'Total XP', val: user?.totalXP || 0, color: '#e6db74' },
                                { label: 'Quizzes', val: user?.quizzesPlayed || 0, color: '#a6e22e' },
                                { label: 'Global Rank', val: myRank ? `#${myRank.globalRank}` : '-', color: '#66d9e8' },
                                { label: 'Badges', val: user?.badges?.length || 0, color: '#f92672' },
                            ].map((stat) => (
                                <div key={stat.label} style={{ ...styles.statCard, background: t.cardBg, borderColor: t.border }}>
                                    <div style={{ ...styles.statVal, color: themeColor(stat.color, t) }}>{stat.val}</div>
                                    <div style={{ ...styles.statLabel, color: t.textMuted }}>{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ ...styles.section, background: t.cardBg, borderColor: t.border }}>
                            <div style={{ ...styles.sectionTag, background: t.tagBg, color: t.textMuted }}>{'// badges_earned'}</div>
                            <div style={styles.badgesWrap}>
                                {user?.badges?.length > 0 ? user.badges.map((badge, i) => (
                                    <div key={i} style={styles.badgeWrap} onMouseEnter={() => setHoveredBadge(i)} onMouseLeave={() => setHoveredBadge(null)}>
                                        <div style={{ ...styles.badge, borderColor: themeColor(BADGE_COLORS[badge] || t.textMuted, t), color: themeColor(BADGE_COLORS[badge] || t.textMuted, t), cursor: 'help' }}>{badge}</div>
                                        {hoveredBadge === i && (
                                            <div style={{ ...styles.tooltip, background: t.cardBg, borderColor: themeColor(BADGE_COLORS[badge] || t.textMuted, t), color: t.text, boxShadow: t.shadow }}>
                                                {BADGE_INFO[badge] || 'Achievement unlocked'}
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <div style={{ ...styles.emptyTag, color: t.textMuted }}>{'// no_badges_yet — play more quizzes!'}</div>
                                )}
                            </div>
                        </div>

                        {user?.role === 'admin' && (
                            <button style={styles.adminBtn} onClick={() => navigate('/admin')} onMouseEnter={e => { e.currentTarget.style.background = '#fd971f'; e.currentTarget.style.color = '#272822'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#fd971f'; }}>⚙ ADMIN PANEL</button>
                        )}
                        <button style={styles.logoutBtn} onClick={handleLogout}>logout()</button>
                    </div>

                    {/* Right column — Quiz history */}
                    <div style={{ ...styles.rightCol, background: t.cardBg, borderColor: t.border, boxShadow: t.shadow }}>
                        <div style={{ ...styles.sectionTag, background: t.tagBg, color: t.textMuted }}>{'// quiz_history'}</div>
                        {loading ? (
                            <div style={{ ...styles.emptyTag, color: t.textMuted }}>{'// loading...'}</div>
                        ) : history.length === 0 ? (
                            <div style={{ ...styles.emptyTag, color: t.textMuted }}>{'// no_quizzes_played_yet'}</div>
                        ) : (
                            <div style={styles.historyWrap}>
                                {history.map((h, i) => (
                                    <div key={i} style={{ ...styles.historyRow, borderBottom: i < history.length - 1 ? `2px solid ${t.borderLight}` : 'none' }}>
                                        <div style={styles.historyLeft}>
                                            <div style={{ ...styles.historyCategory, color: t.text }}>{h.category?.name || '?'}</div>
                                            <div style={{ ...styles.historyDiff, color: t.textMuted }}>{h.difficulty}</div>
                                        </div>
                                        <div style={styles.historyCenter}>
                                            <div style={{ ...styles.historyScore, color: t.text }}><span style={{ color: t.green }}>{h.correctAnswers}</span>/10</div>
                                            <div style={{ ...styles.historyDate, color: t.textMuted }}>{new Date(h.createdAt).toLocaleDateString()}</div>
                                        </div>
                                        <div style={{ ...styles.historyXP, color: t.yellow }}>+{h.earnedXP} XP</div>
                                    </div>
                                ))}
                            </div>
                        )}
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
    navRight: { display: 'flex', alignItems: 'center', gap: '10px' },
    hamburger: { fontFamily: "'Space Mono', monospace", fontSize: '18px', fontWeight: 700, background: 'transparent', border: '2px solid #75715e', padding: '4px 10px', cursor: 'pointer' },
    mobileMenu: { width: '100%', borderTop: '2px solid #3e3d32', display: 'flex', flexDirection: 'column' },
    mobileMenuItem: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, padding: '12px 16px', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', textDecoration: 'none', borderBottom: '1px solid #3e3d32' },
    themeToggle: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '2px solid #75715e', padding: '6px 10px', cursor: 'pointer' },
    xpBadge: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, background: '#e6db74', color: '#272822', border: '2px solid #e6db74', padding: '4px 14px', display: 'flex', alignItems: 'center' },
    content: { padding: '28px 24px', maxWidth: '1000px', margin: '0 auto' },
    tag: { fontSize: '11px', background: '#3e3d32', color: '#75715e', display: 'inline-block', padding: '3px 10px', marginBottom: '10px', letterSpacing: '2px' },
    title: { fontSize: '24px', fontWeight: 700, color: '#f8f8f2', marginBottom: '28px' },
    kw: { color: '#66d9e8' }, op: { color: '#f92672' }, str: { color: '#e6db74' },
    mainGrid: { display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px' },
    leftCol: { display: 'flex', flexDirection: 'column', gap: '16px' },
    userCard: { background: '#1e1f1a', border: '3px solid #75715e', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '4px 4px 0 #3e3d32' },
    avatar: { width: '60px', height: '60px', borderRadius: '50%', background: '#a6e22e', color: '#272822', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, flexShrink: 0 },
    username: { fontSize: '16px', fontWeight: 700, color: '#f8f8f2', marginBottom: '4px' },
    email: { fontSize: '11px', color: '#75715e', marginBottom: '8px' },
    rankBadge: { display: 'inline-block', background: 'rgba(166,226,46,0.15)', color: '#a6e22e', border: '1px solid #a6e22e', fontSize: '10px', fontWeight: 700, padding: '2px 8px', letterSpacing: '1px' },
    statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', border: '3px solid #75715e' },
    statCard: { padding: '14px', textAlign: 'center', background: '#1e1f1a', borderRight: '2px solid #75715e', borderBottom: '2px solid #75715e' },
    statVal: { fontSize: '22px', fontWeight: 700 }, statLabel: { fontSize: '10px', color: '#75715e', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' },
    section: { background: '#1e1f1a', border: '3px solid #75715e', padding: '16px' },
    sectionTag: { fontSize: '11px', background: '#3e3d32', color: '#75715e', display: 'inline-block', padding: '3px 10px', marginBottom: '12px', letterSpacing: '2px' },
    badgesWrap: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
    badge: { fontSize: '11px', fontWeight: 700, padding: '4px 10px', border: '2px solid', letterSpacing: '1px', textTransform: 'uppercase' },
    badgeWrap: { position: 'relative', display: 'inline-block' },
    tooltip: { position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', background: '#1e1f1a', border: '2px solid', color: '#f8f8f2', fontSize: '10px', fontWeight: 400, letterSpacing: '0.5px', textTransform: 'none', padding: '6px 10px', width: 'max-content', maxWidth: '180px', boxShadow: '3px 3px 0 #3e3d32', zIndex: 10, pointerEvents: 'none' },
    emptyTag: { fontSize: '11px', color: '#75715e', fontStyle: 'italic' },
    adminBtn: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, background: 'transparent', color: '#fd971f', border: '2px solid #fd971f', padding: '10px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '2px', width: '100%', transition: 'all 0.15s' },
    logoutBtn: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, background: 'transparent', color: '#f92672', border: '2px solid #f92672', padding: '10px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '2px', width: '100%' },
    rightCol: { background: '#1e1f1a', border: '3px solid #75715e', padding: '20px', boxShadow: '4px 4px 0 #3e3d32' },
    historyWrap: { display: 'flex', flexDirection: 'column' },
    historyRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', gap: '12px' },
    historyLeft: { display: 'flex', flexDirection: 'column', gap: '4px' },
    historyCategory: { fontSize: '13px', fontWeight: 700, color: '#f8f8f2', textTransform: 'uppercase' },
    historyDiff: { fontSize: '11px', color: '#75715e' },
    historyCenter: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
    historyScore: { fontSize: '16px', fontWeight: 700, color: '#f8f8f2' },
    historyDate: { fontSize: '10px', color: '#75715e' },
    historyXP: { fontSize: '13px', fontWeight: 700 },
};