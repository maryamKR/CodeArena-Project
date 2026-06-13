import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/useAuth';
import api from '../API/axios';

const NAV_LINKS = [
    { label: 'Home', path: '/' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Quiz', path: '/quiz' },
    { label: 'Leaderboard', path: '/leaderboard' },
    { label: 'Profile', path: '/profile' },
];



export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [myRank, setMyRank] = useState(null);

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
            .catch(() => {});
    },[user]);

    const handleLogout = async () => {
        await logout();
        navigate('/');
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
                <div style={styles.navLinks}>
                    {NAV_LINKS.map((link, i) => (
                        <a

                            key={link.label}
                            onClick={() => navigate(link.path)}
                            style={{
                                ...styles.navLink,
                                ...(i === 1 ? styles.navLinkActive : {}),
                                ...(i === NAV_LINKS.length - 1 ? { borderRight: '2px solid #75715e' } : {}),
                                cursor: 'pointer',
                            }}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>
                <div style={styles.navRight}>
                    <div style={styles.userBadge}>{user?.username || 'player'}</div>
                    <div style={styles.xpBadge}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#272822" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                        {user?.totalXP || 0} XP
                    </div>
                    <button style={styles.logoutBtn} onClick={handleLogout}>logout()</button>
                </div>
            </nav>

            <div style={styles.content}>

                {/* Welcome */}
                <div style={styles.welcomeRow}>
                    <div>
                        <div style={styles.welcomeTag}>{'// welcome_back'}</div>
                        <h1 style={styles.welcomeTitle}>
                            <span style={styles.kw}>const</span> player{' '}
                            <span style={styles.op}>=</span>{' '}
                            <span style={styles.str}>"{user?.username || 'coder'}"</span>
                        </h1>
                    </div>
                    <div style={styles.rankBadge}>
                        <div style={styles.rankLabel}>RANK</div>
                        <div style={styles.rankVal}>{user?.rank || 'Beginner'}</div>
                    </div>
                </div>

                {/* Stats */}
                <div style={styles.statsRow}>
                    {[
                        { label: 'Total XP', val: user?.totalXP || 0, color: '#e6db74' },
                        { label: 'Quizzes Played', val: user?.quizzesPlayed || 0, color: '#a6e22e' },
                        { label: 'Global Rank', val: myRank ? `#${myRank.globalRank}` : '-', color: '#66d9e8' },
                        { label: 'Badges', val: user?.badges?.length || 0, color: '#f92672' },
                        { label: 'Streak', val: `${user?.streak || 0} days`, color: '#e6db74' },
                    ].map((stat, i) => (
                        <div key={stat.label} style={{ ...styles.statCard, borderRight: i < 4 ? '3px solid #75715e' : 'none' }}>
                            <div style={{ ...styles.statVal, color: stat.color }}>{stat.val}</div>
                            <div style={styles.statLabel}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                <div style={styles.mainGrid}>

                    {/* Left */}
                    <div>
                        {/* Quick actions */}
                        <div style={styles.sectionTag}>{'// quick_actions'}</div>
                        <div style={styles.actionsGrid}>

                            {/* Solo */}
                            <div style={{ ...styles.actionCard, borderTop: '4px solid #a6e22e' }}>
                                <div style={{ ...styles.actionTitle, color: '#a6e22e' }}>SOLO QUIZ</div>
                                <div style={styles.actionSub}>Practice at your own pace. Pick a category and go.</div>
                                <button
                                    style={styles.soloBtn}
                                    onClick={() => navigate('/quiz', { state: { mode: 'solo' } })}
                                    onMouseEnter={e => e.currentTarget.style.background = '#8dca25'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#a6e22e'}
                                >
                                    ▶ Start Solo
                                </button>
                            </div>

                            {/* 1v1 */}
                            <div style={{ ...styles.actionCard, borderTop: '4px solid #f92672' }}>
                                <div style={{ ...styles.actionTitle, color: '#f92672' }}>1v1 CHALLENGE</div>
                                <div style={styles.actionSub}>Battle an opponent in real-time.</div>
                                <div style={styles.challengeBtns}>
                                    <button
                                        style={styles.randomBtn}
                                        onClick={() => navigate('/quiz', { state: { mode: '1v1' } })}
                                        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                    >
                                        ⚔ Find Random Opponent
                                    </button>
                                    <div style={styles.orDivider}>
                                        <div style={styles.orLine}></div>
                                        <span style={styles.orText}>OR</span>
                                        <div style={styles.orLine}></div>
                                    </div>
                                    <button
                                        style={styles.friendBtn}
                                        onClick={() => navigate('/challenge')}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#f92672'; e.currentTarget.style.color = '#f8f8f2'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#f92672'; }}
                                    >
                                        Challenge a Friend
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Recent activity */}
                        <div style={{ ...styles.sectionTag, marginTop: '20px' }}>{'// recent_activity'}</div>
                        <div style={styles.activityCard}>
                            <div style={styles.activityHeader}>// quiz_history</div>
                            {history.length === 0 ? (
                                <div style={styles.emptyTag}>{'// no_recent_activity — play a quiz to see your history!'}</div>
                            ) : (
                                history.map((h, i) => (
                                    <div key={i} style={{ ...styles.activityRow, borderBottom: i < history.length - 1 ? '1px solid #3e3d32' : 'none' }}>
                                        <div style={{ color: '#66d9e8', fontSize: '12px' }}>{h.category?.name || '?'}</div>
                                        <div style={{ color: '#75715e', fontSize: '11px' }}>{h.difficulty}</div>
                                        <div style={{ color: '#a6e22e', fontWeight: 700, fontSize: '12px' }}>{h.score}/{h.correctAnswers}/10</div>
                                        <div style={{ color: '#e6db74', fontSize: '11px' }}>+{h.earnedXP} XP</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right */}
                    <div style={styles.rightCol}>

                        {/* Leaderboard */}
                        <div style={styles.sectionTag}>{'// top_players'}</div>
                        <div style={styles.leaderCard}>
                            {leaderboard.map((p, i) => (
                                <div key={p.rank} style={{ ...styles.leaderRow, borderBottom: i < 2 ? '1px solid #3e3d32' : 'none' }}>
                                    <div style={styles.leaderRank}>#{i + 1}</div>
                                    <div style={styles.leaderName}>{p.username}</div>
                                    <div style={styles.leaderXP}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#e6db74" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                        </svg>
                                        {p.totalXP}
                                    </div>
                                </div>
                            ))}
                            
                        </div>

                        {/* Badges */}
                        <div style={{ ...styles.sectionTag, marginTop: '16px' }}>{'// badges'}</div>
                        <div style={styles.badgesCard}>
                            {user?.badges?.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {user.badges.map((badge, i) => (
                                        <div key={i} style={styles.badge}>{badge}</div>
                                    ))}
                                </div>
                            ) : (
                                <div style={styles.emptyTag}>{'// no_badges_yet'}</div>
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

    activityCard: { background: '#1e1f1a', border: '3px solid #75715e' },
    activityHeader: { padding: '10px 14px', borderBottom: '2px solid #3e3d32', fontSize: '10px', color: '#75715e', letterSpacing: '2px' },
    activityRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' },
    emptyTag: { padding: '16px 14px', fontSize: '11px', color: '#75715e', fontStyle: 'italic' },

    rightCol: { display: 'flex', flexDirection: 'column' },
    leaderCard: { background: '#1e1f1a', border: '3px solid #75715e', boxShadow: '4px 4px 0 #3e3d32' },
    leaderRow: { display: 'flex', alignItems: 'center', padding: '12px 14px', gap: '10px' },
    leaderRank: { fontSize: '12px', fontWeight: 700, color: '#e6db74', width: '28px' },
    leaderName: { flex: 1, fontSize: '12px', fontWeight: 700, color: '#f8f8f2' },
    leaderXP: { fontSize: '11px', color: '#e6db74', display: 'flex', alignItems: 'center' },
    viewAllBtn: { width: '100%', background: 'transparent', border: 'none', borderTop: '2px solid #3e3d32', color: '#66d9e8', fontFamily: "'Space Mono', monospace", fontSize: '11px', padding: '10px', cursor: 'pointer', textAlign: 'center' },

    badgesCard: { background: '#1e1f1a', border: '3px solid #75715e', padding: '14px', marginTop: '0' },
    badge: { fontSize: '10px', fontWeight: 700, padding: '3px 8px', border: '2px solid #75715e', color: '#75715e', letterSpacing: '1px' },
};