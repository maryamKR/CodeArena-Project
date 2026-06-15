import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/useAuth';
import api from '../api/axios';

const NAV_LINKS = [
    { label: 'Home', path: '/' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Quiz', path: '/quiz' },
    { label: 'Leaderboard', path: '/leaderboard' },
    { label: 'Profile', path: '/profile' },
];

/* ============================================================
   SVG ICONS
   ============================================================ */

// Medal — top 3 ranks. color tints gold/silver/bronze.
const MedalIcon = ({ color = '#e6db74', size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ verticalAlign: 'middle' }}>
        <path d="M7 2h3.2l-2.4 6.5H4.5L7 2z" fill={color} opacity="0.85" />
        <path d="M13.8 2H17l2.5 6.5h-3.3L13.8 2z" fill={color} opacity="0.85" />
        <circle cx="12" cy="15" r="6.2" fill={color} stroke="#272822" strokeWidth="1.5" />
        <circle cx="12" cy="15" r="2.6" fill="#272822" />
    </svg>
);

// Bolt — XP value (matches the navbar XP badge).
const BoltIcon = ({ color = '#e6db74', size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}
         style={{ marginRight: '5px', verticalAlign: 'middle' }} aria-hidden="true">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
);

const MEDAL_COLORS = { 1: '#e6db74', 2: '#c0c0c0', 3: '#cd7f32' };

export default function Leaderboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [category, setCategory] = useState('All');
    const [difficulty, setDifficulty] = useState('All');
    const [categoryFilters, setCategoryFilters] = useState(['All']);
    const [difficultyFilters] = useState(['All', 'Easy', 'Medium', 'Hard']);


    useEffect(() => {
    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
        const params = {};
        if (category !== 'All') params.category = category;
        if (difficulty !== 'All') params.difficulty = difficulty;
        const res = await api.get('/leaderboard', { params });
        setPlayers(res.data.data || []);
        } catch {
        setError('Failed to load leaderboard');
        } finally {
        setLoading(false);
        }
    };
    fetchLeaderboard();
    }, [category, difficulty]);

    useEffect(() => {
    api.get('/categories')
        .then(res => {
        if (Array.isArray(res.data)) {
            setCategoryFilters(['All', ...res.data.map(c => c.slug)]);
        }
        })
        .catch(() => {});
    }, []);

    const getRankStyle = (rank) => {
        if (rank === 1) return { color: '#e6db74', borderLeft: '4px solid #e6db74' };
        if (rank === 2) return { color: '#c0c0c0', borderLeft: '4px solid #c0c0c0' };
        if (rank === 3) return { color: '#cd7f32', borderLeft: '4px solid #cd7f32' };
        return { color: '#75715e', borderLeft: '4px solid #3e3d32' };
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
                                ...(i === 3 ? styles.navLinkActive : {}),
                                ...(i === NAV_LINKS.length - 1 ? { borderRight: '2px solid #75715e' } : {}),
                                cursor: 'pointer',
                            }}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>
                <div style={styles.xpBadge}>
                    <BoltIcon color="#272822" size={14} />
                    {user?.totalXP || 0} XP
                </div>
            </nav>

            <div style={styles.content}>

                {/* Header */}
                <div style={styles.headerRow}>
                    <div>
                        <div style={styles.tag}>{'// leaderboard'}</div>
                        <h1 style={styles.title}>
                            <span style={styles.kw}>top</span>
                            <span style={styles.fn}>.players</span>
                            <span style={styles.paren}>()</span>
                        </h1>
                    </div>
                    <button style={styles.hallBtn} onClick={() => navigate('/hall-of-fame')}>
                         Hall of Fame
                    </button>
                </div>

                {/* Filters */}
                <div style={styles.filtersRow}>
                    <div style={styles.filterGroup}>
                        <span style={styles.filterLabel}>// category:</span>
                        {categoryFilters.map(cat => (
                            <button
                                key={cat}
                                style={{
                                    ...styles.filterBtn,
                                    ...(category === cat ? styles.filterBtnActive : {}),
                                }}
                                onClick={() => setCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div style={styles.filterGroup}>
                        <span style={styles.filterLabel}>// difficulty:</span>
                        {difficultyFilters.map(diff => (
                            <button
                                key={diff}
                                style={{
                                    ...styles.filterBtn,
                                    ...(difficulty === diff ? styles.filterBtnActive : {}),
                                }}
                                onClick={() => setDifficulty(diff)}
                            >
                                {diff}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div style={styles.loadingTag}>{'// loading_players...'}</div>
                ) : error ? (
                    <div style={styles.errorBox}>{error}</div>
                ) : (
                    <div style={styles.tableWrap}>
                        {/* Table header */}
                        <div style={styles.tableHeader}>
                            <div style={{ width: '60px' }}>RANK</div>
                            <div style={{ flex: 1 }}>PLAYER</div>
                            <div style={{ width: '120px', textAlign: 'right' }}>TOTAL XP</div>
                            <div style={{ width: '100px', textAlign: 'right' }}>QUIZZES</div>
                            <div style={{ width: '100px', textAlign: 'right' }}>BADGES</div>
                        </div>

                        {/* Rows */}
                        {players.map((player, i) => {
                            const rank = i + 1;
                            const isCurrentUser = player.username === user?.username;
                            const rankStyle = getRankStyle(rank);
                            return (
                                <div
                                    key={player._id}
                                    style={{
                                        ...styles.tableRow,
                                        ...rankStyle,
                                        ...(isCurrentUser ? styles.currentUserRow : {}),
                                    }}
                                >
                                    <div style={{ width: '60px', fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center' }}>
                                        {rank <= 3
                                            ? <MedalIcon color={MEDAL_COLORS[rank]} size={22} />
                                            : `#${rank}`}
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ ...styles.avatar, background: isCurrentUser ? '#a6e22e' : '#3e3d32', color: isCurrentUser ? '#272822' : '#f8f8f2' }}>
                                            {player.username?.[0]?.toUpperCase()}
                                        </div>
                                        <span style={{ fontWeight: 700, color: isCurrentUser ? '#a6e22e' : '#f8f8f2' }}>
                                            {player.username}
                                            {isCurrentUser && <span style={{ fontSize: '10px', color: '#a6e22e', marginLeft: '8px' }}>(you)</span>}
                                        </span>
                                    </div>
                                    <div style={{ width: '120px', textAlign: 'right', color: '#e6db74', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                        <BoltIcon color="#e6db74" size={13} /> {player.totalXP}
                                    </div>
                                    <div style={{ width: '100px', textAlign: 'right', color: '#75715e' }}>
                                        {player.quizzesPlayed || 0}
                                    </div>
                                    <div style={{ width: '100px', textAlign: 'right', color: '#75715e' }}>
                                        {player.badges?.length || 0}
                                    </div>
                                </div>
                            );
                        })}

                        {players.length === 0 && (
                            <div style={styles.emptyTag}>{'// no_players_found'}</div>
                        )}
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
    navLinks: { display: 'flex' },
    navLink: { fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, color: '#75715e', textDecoration: 'none', padding: '5px 14px', border: '2px solid #75715e', borderRight: 'none', textTransform: 'uppercase', letterSpacing: '1px', background: 'transparent' },
    navLinkActive: { background: '#a6e22e', color: '#272822', borderColor: '#a6e22e' },
    xpBadge: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, background: '#e6db74', color: '#272822', border: '2px solid #e6db74', padding: '4px 14px', display: 'flex', alignItems: 'center' },

    content: { padding: '28px 24px', maxWidth: '900px', margin: '0 auto' },

    headerRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' },
    tag: { fontSize: '11px', background: '#3e3d32', color: '#75715e', display: 'inline-block', padding: '3px 10px', marginBottom: '10px', letterSpacing: '2px' },
    title: { fontSize: '28px', fontWeight: 700, color: '#f8f8f2', margin: 0 },
    kw: { color: '#66d9e8' },
    fn: { color: '#a6e22e' },
    paren: { color: '#f8f8f2' },
    hallBtn: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, background: '#e6db74', color: '#272822', border: '3px solid #e6db74', padding: '8px 16px', cursor: 'pointer', boxShadow: '3px 3px 0 #3e3d32' },

    filtersRow: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px', background: '#1e1f1a', border: '3px solid #75715e', padding: '14px 16px' },
    filterGroup: { display: 'flex', alignItems: 'center', gap: '0', flexWrap: 'wrap' },
    filterLabel: { fontSize: '11px', color: '#75715e', marginRight: '12px', letterSpacing: '1px' },
    filterBtn: { fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, padding: '4px 12px', border: '2px solid #75715e', borderRight: 'none', cursor: 'pointer', textTransform: 'uppercase', background: 'transparent', color: '#75715e' },
    filterBtnActive: { background: '#f92672', color: '#f8f8f2', borderColor: '#f92672' },

    tableWrap: { background: '#1e1f1a', border: '3px solid #75715e', boxShadow: '4px 4px 0 #3e3d32' },
    tableHeader: { display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '3px solid #75715e', fontSize: '10px', color: '#75715e', letterSpacing: '2px' },
    tableRow: { display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '2px solid #3e3d32', fontSize: '13px', transition: 'background 0.15s' },
    currentUserRow: { background: 'rgba(166,226,46,0.08)' },
    avatar: { width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 },
    emptyTag: { padding: '24px', textAlign: 'center', color: '#75715e', fontSize: '13px' },
    loadingTag: { fontSize: '14px', color: '#75715e', textAlign: 'center', padding: '40px' },
    errorBox: { background: 'rgba(249,38,114,0.15)', border: '2px solid #f92672', color: '#f92672', padding: '10px 14px', fontSize: '12px' },
};