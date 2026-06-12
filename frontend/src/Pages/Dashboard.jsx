import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import api from '../API/axios';


const NAV_LINKS = [
    { label: 'Home', path: '/' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Quiz', path: '/quiz' },
    { label: 'Leaderboard', path: '/leaderboard' },
    { label: 'Profile', path: '/profile' },
];


const LEADERBOARD = [
    { rank: 1, username: 'n00bslayer', xp: 1240, badge: '#1' },
    { rank: 2, username: 'bytewizard', xp: 980, badge: '#2' },
    { rank: 3, username: 'codesensei', xp: 870, badge: '#3' },
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export default function Dashboard() {

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState('Easy');


    useEffect(() => {
        api.get('/categories')
            .then(res => {
                setCategories(res.data);
                setSelectedCategory(res.data[0]?.slug || null);
            })
            .catch(() => console.error('Failed to load categories'));
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };
    return (
        <div style={styles.page}>
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
                    <div style={styles.xpBadge}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#272822" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                        {user?.totalXP || 0} XP
                    </div>
                    <div style={styles.userBadge}>{user?.username || 'player'}</div>
                    <button style={styles.logoutBtn} onClick={handleLogout}>logout()</button>
                </div>
            </nav>

            <div style={styles.content}>

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

                <div style={styles.statsRow}>
                    {[
                        { label: 'Total XP', val: user?.totalXP || 0, color: '#e6db74' },
                        { label: 'Quizzes Played', val: user?.quizzesPlayed || 0, color: '#a6e22e' },
                        { label: 'Global Rank', val: `#${user?.globalRank || '-'}`, color: '#66d9e8' },
                        { label: 'Badges', val: user?.badges?.length || 0, color: '#f92672' },
                    ].map((stat, i) => (
                        <div key={stat.label} style={{ ...styles.statCard, borderRight: i < 3 ? '3px solid #75715e' : 'none' }}>
                            <div style={{ ...styles.statVal, color: stat.color }}>{stat.val}</div>
                            <div style={styles.statLabel}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                <div style={styles.mainGrid}>

                    <div>
                        <div style={styles.sectionTag}>{'// select_category'}</div>
                        <div style={styles.catsGrid}>
                            {(categories || []).map((cat, i) => (
                                <div
                                    key={cat._id}
                                    style={{
                                        ...styles.catCard,
                                        borderTop: `4px solid ${cat.color}`,
                                        borderRight: (i + 1) % 4 !== 0 ? '3px solid #75715e' : 'none',
                                        borderBottom: '3px solid #75715e',
                                        background: selectedCategory === cat.slug ? '#3e3d32' : '#2d2c28',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#3e3d32'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#2d2c28'}
                                    onClick={() => setSelectedCategory(cat.slug)}
                                >
                                    <div style={{ ...styles.catIcon, color: cat.color }}>{cat.slug.substring(0, 3).toUpperCase()}</div>
                                    <div style={styles.catName}>{cat.name}</div>
                                    <div style={styles.catCount}>{cat.questionCount || 0} questions</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ ...styles.diffRow, position: 'relative', zIndex: 999 }}>
                            <span style={styles.diffLabel}>Difficulty:</span>
                            {DIFFICULTIES.map((d, i) => {
                                const isActive = selectedDifficulty === d;
                                return (
                                    <button
                                        key={d}
                                        onClick={() => setSelectedDifficulty(d)}
                                        style={{
                                            fontFamily: "'Space Mono', monospace",
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            padding: '5px 14px',
                                            cursor: 'pointer',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            border: `2px solid ${isActive ? '#f92672' : '#75715e'}`,
                                            borderRight: i === DIFFICULTIES.length - 1 ? `2px solid ${isActive ? '#f92672' : '#75715e'}` : 'none',
                                            background: isActive ? '#f92672' : 'transparent',
                                            color: isActive ? '#f8f8f2' : '#75715e',
                                        }}
                                    >
                                        {d}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            style={styles.startBtn}
                            onClick={() => navigate('/quiz', {
                                state: {
                                    category: selectedCategory,
                                    difficulty: selectedDifficulty,
                                }
                            })}
                            onMouseEnter={e => e.currentTarget.style.background = '#8dca25'}
                            onMouseLeave={e => e.currentTarget.style.background = '#a6e22e'}
                        >
                            ▶ START QUIZ
                        </button>
                    </div>

                    <div>
                        <div style={styles.sectionTag}>{'// top_players'}</div>
                        <div style={styles.leaderCard}>
                            {LEADERBOARD.map((p, i) => (
                                <div key={p.rank} style={{ ...styles.leaderRow, borderBottom: i < 2 ? '2px solid #3e3d32' : 'none' }}>
                                    <div style={styles.leaderRank}>{p.badge}</div>
                                    <div style={styles.leaderName}>{p.username}</div>
                                    <div style={styles.leaderXP}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#e6db74" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                        </svg>
                                        {p.xp} XP
                                    </div>
                                </div>
                            ))}
                            <button style={styles.viewAllBtn} onClick={() => navigate('/leaderboard')}>
                                view_all() →
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div >
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
    navRight: { display: 'flex', alignItems: 'center', gap: '12px' },
    xpBadge: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, background: '#e6db74', color: '#272822', border: '2px solid #e6db74', padding: '4px 14px', display: 'flex', alignItems: 'center' },
    userBadge: { fontFamily: "'Space Mono', monospace", fontSize: '12px', color: '#a6e22e', border: '2px solid #a6e22e', padding: '4px 12px' },
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

    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '3px solid #75715e', marginBottom: '28px' },
    statCard: { padding: '16px 20px', textAlign: 'center', background: '#1e1f1a' },
    statVal: { fontSize: '26px', fontWeight: 700 },
    statLabel: { fontSize: '10px', color: '#75715e', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' },

    mainGrid: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' },

    sectionTag: { fontSize: '11px', background: '#3e3d32', color: '#75715e', display: 'inline-block', padding: '3px 10px', marginBottom: '12px', letterSpacing: '2px' },

    catsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '3px solid #75715e' },
    catCard: { padding: '20px', background: '#2d2c28', cursor: 'pointer', transition: 'background 0.15s' },
    catIcon: { fontSize: '24px', fontWeight: 700, marginBottom: '8px' },
    catName: { fontSize: '12px', fontWeight: 700, color: '#f8f8f2', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' },
    catCount: { fontSize: '11px', color: '#75715e' },

    diffRow: { display: 'flex', alignItems: 'center', padding: '12px 16px', borderLeft: '3px solid #75715e', borderRight: '3px solid #75715e', borderBottom: '3px solid #75715e', background: '#1e1f1a' },
    diffLabel: { fontSize: '11px', color: '#75715e', marginRight: '14px', textTransform: 'uppercase', letterSpacing: '1px' },
    diffBtn: { fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, padding: '5px 14px', border: '2px solid #75715e', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', background: 'transparent', color: '#75715e' },
    diffBtnActive: { background: '#f92672', color: '#f8f8f2', borderColor: '#f92672' },

    startBtn: { width: '100%', background: '#a6e22e', color: '#272822', border: '3px solid #a6e22e', fontFamily: "'Space Mono', monospace", fontSize: '13px', fontWeight: 700, padding: '12px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '2px', boxShadow: '4px 4px 0 #3e3d32', transition: 'background 0.15s', marginTop: '16px' },

    leaderCard: { background: '#1e1f1a', border: '3px solid #75715e', boxShadow: '4px 4px 0 #3e3d32' },
    leaderRow: { display: 'flex', alignItems: 'center', padding: '14px 16px', gap: '12px' },
    leaderRank: { fontSize: '13px', fontWeight: 700, color: '#e6db74', width: '28px' },
    leaderName: { flex: 1, fontSize: '13px', fontWeight: 700, color: '#f8f8f2' },
    leaderXP: { fontSize: '12px', color: '#e6db74', display: 'flex', alignItems: 'center' },
    viewAllBtn: { width: '100%', background: 'transparent', border: 'none', borderTop: '2px solid #3e3d32', color: '#66d9e8', fontFamily: "'Space Mono', monospace", fontSize: '12px', padding: '12px', cursor: 'pointer', textAlign: 'center' },
};