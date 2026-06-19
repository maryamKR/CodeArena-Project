import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/useAuth';
import { useTheme } from '../Context/ThemeContext';
import { getThemeColors } from '../constants/theme';
import api from '../api/axios';

const NAV_LINKS = [
    { label: 'Home', path: '/' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Quiz', path: '/quiz' },
    { label: 'Leaderboard', path: '/leaderboard' },
    { label: 'Profile', path: '/profile' },
];

const PODIUM = [
    { rank: 1, color: '#e6db74', label: '1ST', shadow: '0 0 30px rgba(230,219,116,0.4)' },
    { rank: 2, color: '#c0c0c0', label: '2ND', shadow: '0 0 30px rgba(192,192,192,0.4)' },
    { rank: 3, color: '#cd7f32', label: '3RD', shadow: '0 0 30px rgba(205,127,50,0.4)' },
];

const BoltIcon = ({ size = 12, color = '#e6db74' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}
         style={{ marginRight: '5px', verticalAlign: 'middle' }} aria-hidden="true">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
);

const MedalIcon = ({ size = 16, color = '#272822' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"
         style={{ marginRight: '6px', verticalAlign: 'middle' }} aria-hidden="true">
        <circle cx="12" cy="14" r="6" />
        <path d="M12 14l0 0" />
        <path d="M8.5 8.5L5 2M15.5 8.5L19 2" />
    </svg>
);

export default function HallOfFame() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const t = getThemeColors(theme);

    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchHallOfFame = async () => {
            setLoading(true);
            try {
                const res = await api.get('/hall-of-fame');
                setPlayers(res.data.data || []);
            } catch {
                setError('Failed to load Hall of Fame');
            } finally {
                setLoading(false);
            }
        };
        fetchHallOfFame();
    }, []);

    const top3 = players.slice(0, 3);
    const rest = players.slice(3);

    return (
        <div style={{ ...styles.page, background: t.pageBg }}>

            {/* Navbar */}
            <nav style={{ ...styles.nav, background: t.navBg, borderBottomColor: t.border }}>
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
                                borderColor: t.border,
                                color: t.textMuted,
                                ...(i === NAV_LINKS.length - 1 ? { borderRight: `2px solid ${t.border}` } : { borderRight: 'none' }),
                                cursor: 'pointer',
                            }}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button style={{ ...styles.themeToggle, borderColor: t.border }} onClick={toggleTheme} title="Toggle theme">
                        {t.isLight ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#2c2c2a">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e6db74" strokeWidth="2">
                                <circle cx="12" cy="12" r="4" />
                                <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" />
                            </svg>
                        )}
                    </button>
                    <div style={styles.xpBadge}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#272822" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                        {user?.totalXP || 0} XP
                    </div>
                </div>
            </nav>

            <div style={styles.content}>

                {/* Header */}
                <div style={styles.headerRow}>
                    <div>
                        <div style={{ ...styles.tag, background: t.tagBg, color: t.textMuted }}>{'// hall_of_fame'}</div>
                        <h1 style={{ ...styles.title, color: t.text }}>
                            <span style={styles.kw}>all</span>
                            <span style={styles.fn}>.time</span>
                            <span style={{ color: t.text }}>.legends()</span>
                        </h1>
                    </div>
                    <button style={{ ...styles.backBtn, borderColor: t.border, color: t.textMuted }} onClick={() => navigate('/leaderboard')}>
                        ← Leaderboard
                    </button>
                </div>

                {loading ? (
                    <div style={{ ...styles.loadingTag, color: t.textMuted }}>{'// loading_legends...'}</div>
                ) : error ? (
                    <div style={styles.errorBox}>{error}</div>
                ) : (
                    <>
                        {/* Top 3 Podium */}
                        <div style={styles.podium}>
                            {[top3[1], top3[0], top3[2]].map((player, idx) => {
                                if (!player) return null;
                                const actualRank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
                                const podiumData = PODIUM.find(p => p.rank === actualRank);
                                const height = actualRank === 1 ? '180px' : actualRank === 2 ? '140px' : '120px';
                                return (
                                    <div key={player._id} style={{ ...styles.podiumCard, background: t.cardBg, borderColor: t.borderLight, borderTop: `4px solid ${podiumData.color}`, boxShadow: podiumData.shadow }}>
                                        <div style={{ ...styles.podiumAvatar, background: podiumData.color, color: '#272822' }}>
                                            {player.username?.[0]?.toUpperCase()}
                                        </div>
                                        <div style={{ ...styles.podiumName, color: podiumData.color }}>{player.username}</div>
                                        <div style={{ ...styles.podiumXP, color: t.yellow }}><BoltIcon size={12} color={t.yellow} />{player.totalXP} XP</div>
                                        <div style={{ ...styles.podiumBadges, color: t.textMuted }}>{player.badges?.length || 0} badges</div>
                                        <div style={{ ...styles.podiumRankLabel, background: podiumData.color, color: '#272822', height }}>
                                            <MedalIcon size={16} color="#272822" />{podiumData.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Rest of top 10 */}
                        {rest.length > 0 && (
                            <div style={{ ...styles.tableWrap, background: t.cardBg, borderColor: t.border, boxShadow: t.shadow }}>
                                {rest.map((player, i) => (
                                    <div key={player._id} style={{ ...styles.tableRow, borderBottom: i < rest.length - 1 ? `2px solid ${t.borderLight}` : 'none' }}>
                                        <div style={{ width: '50px', fontWeight: 700, color: t.textMuted }}>#{i + 4}</div>
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ ...styles.avatar, background: t.borderLight, color: t.text }}>{player.username?.[0]?.toUpperCase()}</div>
                                            <span style={{ fontWeight: 700, color: player.username === user?.username ? t.green : t.text }}>
                                                {player.username}
                                            </span>
                                        </div>
                                        <div style={{ color: t.yellow, fontWeight: 700, display: 'flex', alignItems: 'center' }}><BoltIcon size={12} color={t.yellow} />{player.totalXP} XP</div>
                                        <div style={{ width: '100px', textAlign: 'right', color: t.textMuted }}>{player.badges?.length || 0} badges</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
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
    themeToggle: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '2px solid #75715e', padding: '6px 10px', cursor: 'pointer' },
    xpBadge: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, background: '#e6db74', color: '#272822', border: '2px solid #e6db74', padding: '4px 14px', display: 'flex', alignItems: 'center' },

    content: { padding: '28px 24px', maxWidth: '900px', margin: '0 auto' },

    headerRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' },
    tag: { fontSize: '11px', background: '#3e3d32', color: '#75715e', display: 'inline-block', padding: '3px 10px', marginBottom: '10px', letterSpacing: '2px' },
    title: { fontSize: '28px', fontWeight: 700, color: '#f8f8f2', margin: 0 },
    kw: { color: '#66d9e8' },
    fn: { color: '#a6e22e' },
    paren: { color: '#f8f8f2' },
    backBtn: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, background: 'transparent', color: '#75715e', border: '2px solid #75715e', padding: '8px 16px', cursor: 'pointer' },

    podium: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '28px', alignItems: 'flex-end' },
    podiumCard: { background: '#1e1f1a', border: '3px solid #3e3d32', padding: '20px 16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', overflow: 'hidden' },
    podiumAvatar: { width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700 },
    podiumName: { fontSize: '14px', fontWeight: 700, textAlign: 'center' },
    podiumXP: { fontSize: '12px', color: '#e6db74', display: 'flex', alignItems: 'center' },
    podiumBadges: { fontSize: '11px', color: '#75715e' },
    podiumRankLabel: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', marginTop: '12px', letterSpacing: '2px' },

    tableWrap: { background: '#1e1f1a', border: '3px solid #75715e', boxShadow: '4px 4px 0 #3e3d32' },
    tableRow: { display: 'flex', alignItems: 'center', padding: '14px 16px', gap: '12px', fontSize: '13px' },
    avatar: { width: '28px', height: '28px', borderRadius: '50%', background: '#3e3d32', color: '#f8f8f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 },

    loadingTag: { fontSize: '14px', color: '#75715e', textAlign: 'center', padding: '40px' },
    errorBox: { background: 'rgba(249,38,114,0.15)', border: '2px solid #f92672', color: '#f92672', padding: '10px 14px', fontSize: '12px' },
};