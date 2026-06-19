import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
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

const TABS = ['Questions', 'Categories', 'Daily Challenge', 'Global History'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const t = getThemeColors(theme);

  const [tab, setTab] = useState('Questions');
  const [categories, setCategories] = useState([]);
  const [msg, setMsg] = useState(null);

  const [qText, setQText] = useState('');
  const [qAnswer, setQAnswer] = useState(true);
  const [qCategory, setQCategory] = useState('');
  const [qDifficulty, setQDifficulty] = useState('Easy');
  const [qSaving, setQSaving] = useState(false);
  const [deleteId, setDeleteId] = useState('');

  const [cName, setCName] = useState('');
  const [cSlug, setCSlug] = useState('');
  const [cColor, setCColor] = useState('#a6e22e');
  const [cSaving, setCSaving] = useState(false);

  const [dCategory, setDCategory] = useState('');
  const [dDifficulty, setDDifficulty] = useState('Easy');
  const [dBonus, setDBonus] = useState(50);
  const [dDate, setDDate] = useState('');
  const [dSaving, setDSaving] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    api.get('/categories')
      .then(res => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (tab !== 'Global History') return;
    setHistoryLoading(true);
    api.get('/history?limit=50')
      .then(res => setHistory(res.data.data || []))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [tab]);

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleAddQuestion = async () => {
    if (qText.trim().length < 5) return flash('error', 'Question text is too short');
    if (!qCategory) return flash('error', 'Pick a category');
    setQSaving(true);
    try {
      await api.post('/questions', {
        text: qText.trim(),
        correct_answer: qAnswer,
        category: qCategory,
        difficulty: qDifficulty,
      });
      flash('success', 'Question added');
      setQText('');
    } catch (err) {
      flash('error', err?.response?.data?.message || 'Failed to add question');
    } finally {
      setQSaving(false);
    }
  };

  const handleDeleteQuestion = async () => {
    const id = deleteId.trim();
    if (!id) return flash('error', 'Enter a question ID to delete');
    if (!window.confirm('Delete this question permanently?')) return;
    try {
      await api.delete(`/questions/${id}`);
      flash('success', 'Question deleted');
      setDeleteId('');
    } catch (err) {
      flash('error', err?.response?.data?.message || 'Failed to delete (check the ID)');
    }
  };

  const handleAddCategory = async () => {
    if (cName.trim().length < 2) return flash('error', 'Category name too short');
    if (cSlug.trim().length < 2) return flash('error', 'Slug too short');
    setCSaving(true);
    try {
      const res = await api.post('/categories', {
        name: cName.trim(),
        slug: cSlug.trim().toLowerCase(),
        color: cColor,
      });
      flash('success', `Category "${cName.trim()}" created`);
      setCategories(prev => [...prev, res.data]);
      setCName(''); setCSlug('');
    } catch (err) {
      flash('error', err?.response?.data?.message || 'Failed to add category (slug may be taken)');
    } finally {
      setCSaving(false);
    }
  };

  const handleSetDaily = async () => {
    if (!dCategory) return flash('error', 'Pick a category');
    setDSaving(true);
    try {
      const body = { categoryId: dCategory, difficulty: dDifficulty, bonusXP: Number(dBonus) };
      if (dDate) body.activeDate = dDate;
      await api.post('/daily-challenge', body);
      flash('success', 'Daily challenge set');
    } catch (err) {
      flash('error', err?.response?.data?.message || 'Failed to set daily challenge');
    } finally {
      setDSaving(false);
    }
  };

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
          <div style={styles.adminTag}>⚙ ADMIN</div>
        </div>
      </nav>

      <div style={styles.content}>

        {/* Header */}
        <div style={{ ...styles.tag, background: t.tagBg, color: t.textMuted }}>{'// admin_panel'}</div>
        <h1 style={{ ...styles.title, color: t.text }}>
          <span style={styles.kw}>sudo</span>{' '}
          <span style={styles.fn}>manage</span>
          <span style={{ color: t.text }}>()</span>
        </h1>

        {/* Tabs */}
        <div style={{ ...styles.tabsRow, borderColor: t.border }}>
          {TABS.map((tb) => (
            <button
              key={tb}
              style={{ ...styles.tabBtn, borderRightColor: t.border, color: t.textMuted, ...(tab === tb ? styles.tabBtnActive : {}) }}
              onClick={() => { setTab(tb); setMsg(null); }}
            >
              {tb}
            </button>
          ))}
        </div>

        {/* Flash message */}
        {msg && (
          <div style={{
            ...styles.flash,
            color: msg.type === 'success' ? t.green : '#f92672',
            borderColor: msg.type === 'success' ? t.green : '#f92672',
          }}>
            {msg.type === 'success' ? '// ' : '// error: '}{msg.text}
          </div>
        )}

        {/* ---- QUESTIONS ---- */}
        {tab === 'Questions' && (
          <div style={styles.panelGrid}>
            <div style={{ ...styles.panel, background: t.cardBg, borderColor: t.border, boxShadow: t.shadow }}>
              <div style={styles.panelTitle}>{'// add_question'}</div>
              <label style={{ ...styles.label, color: t.textMuted }}>question text</label>
              <textarea
                style={{ ...styles.textarea, background: t.pageBg, borderColor: t.border, color: t.text }}
                rows={3}
                placeholder="Is JavaScript single-threaded?"
                value={qText}
                onChange={e => setQText(e.target.value)}
              />
              <label style={{ ...styles.label, color: t.textMuted }}>correct answer</label>
              <div style={styles.toggleRow}>
                <button
                  style={{ ...styles.toggleBtn, borderColor: t.border, color: t.textMuted, ...(qAnswer === true ? styles.toggleActiveGreen : {}) }}
                  onClick={() => setQAnswer(true)}
                >TRUE</button>
                <button
                  style={{ ...styles.toggleBtn, borderColor: t.border, color: t.textMuted, ...(qAnswer === false ? styles.toggleActivePink : {}) }}
                  onClick={() => setQAnswer(false)}
                >FALSE</button>
              </div>
              <label style={{ ...styles.label, color: t.textMuted }}>category</label>
              <select style={{ ...styles.select, background: t.pageBg, borderColor: t.border, color: t.text }} value={qCategory} onChange={e => setQCategory(e.target.value)}>
                <option value="">select category</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <label style={{ ...styles.label, color: t.textMuted }}>difficulty</label>
              <select style={{ ...styles.select, background: t.pageBg, borderColor: t.border, color: t.text }} value={qDifficulty} onChange={e => setQDifficulty(e.target.value)}>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <button style={{ ...styles.primaryBtn, boxShadow: t.shadow, opacity: qSaving ? 0.6 : 1 }} onClick={handleAddQuestion} disabled={qSaving}>
                {qSaving ? 'SAVING...' : '+ ADD QUESTION'}
              </button>
            </div>

            <div style={{ ...styles.panel, background: t.cardBg, borderColor: t.border, boxShadow: t.shadow }}>
              <div style={styles.panelTitle}>{'// delete_question'}</div>
              <label style={{ ...styles.label, color: t.textMuted }}>question ID</label>
              <input
                style={{ ...styles.input, background: t.pageBg, borderColor: t.border, color: t.text }}
                type="text"
                placeholder="60d5ecb8b392d700153c3c12"
                value={deleteId}
                onChange={e => setDeleteId(e.target.value)}
              />
              <div style={{ ...styles.hint, color: t.textMuted }}>{'// paste the _id of the question to remove'}</div>
              <button style={styles.dangerBtn} onClick={handleDeleteQuestion}>
                ✕ DELETE QUESTION
              </button>
            </div>
          </div>
        )}

        {/* ---- CATEGORIES ---- */}
        {tab === 'Categories' && (
          <div style={styles.panelGrid}>
            <div style={{ ...styles.panel, background: t.cardBg, borderColor: t.border, boxShadow: t.shadow }}>
              <div style={styles.panelTitle}>{'// add_category'}</div>
              <label style={{ ...styles.label, color: t.textMuted }}>name</label>
              <input style={{ ...styles.input, background: t.pageBg, borderColor: t.border, color: t.text }} type="text" placeholder="Frontend" value={cName} onChange={e => setCName(e.target.value)} />
              <label style={{ ...styles.label, color: t.textMuted }}>slug</label>
              <input style={{ ...styles.input, background: t.pageBg, borderColor: t.border, color: t.text }} type="text" placeholder="frontend" value={cSlug} onChange={e => setCSlug(e.target.value)} />
              <label style={{ ...styles.label, color: t.textMuted }}>color</label>
              <div style={styles.colorRow}>
                <input style={{ ...styles.colorPicker, borderColor: t.border }} type="color" value={cColor} onChange={e => setCColor(e.target.value)} />
                <span style={{ ...styles.colorHex, color: cColor }}>{cColor}</span>
              </div>
              <button style={{ ...styles.primaryBtn, boxShadow: t.shadow, opacity: cSaving ? 0.6 : 1 }} onClick={handleAddCategory} disabled={cSaving}>
                {cSaving ? 'SAVING...' : '+ ADD CATEGORY'}
              </button>
            </div>

            <div style={{ ...styles.panel, background: t.cardBg, borderColor: t.border, boxShadow: t.shadow }}>
              <div style={styles.panelTitle}>{'// existing_categories'}</div>
              <div style={styles.catList}>
                {categories.length === 0 ? (
                  <div style={{ ...styles.hint, color: t.textMuted }}>{'// none yet'}</div>
                ) : categories.map(c => (
                  <div key={c._id} style={{ ...styles.catItem, borderColor: t.borderLight }}>
                    <span style={{ ...styles.catDot, background: c.color || t.textMuted }} />
                    <span style={{ ...styles.catName, color: t.text }}>{c.name}</span>
                    <span style={{ ...styles.catSlug, color: t.textMuted }}>{c.slug}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---- DAILY CHALLENGE ---- */}
        {tab === 'Daily Challenge' && (
          <div style={{ ...styles.panel, background: t.cardBg, borderColor: t.border, boxShadow: t.shadow }}>
            <div style={styles.panelTitle}>{'// set_daily_challenge'}</div>
            <label style={{ ...styles.label, color: t.textMuted }}>category</label>
            <select style={{ ...styles.select, background: t.pageBg, borderColor: t.border, color: t.text }} value={dCategory} onChange={e => setDCategory(e.target.value)}>
              <option value="">select category</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <label style={{ ...styles.label, color: t.textMuted }}>difficulty</label>
            <select style={{ ...styles.select, background: t.pageBg, borderColor: t.border, color: t.text }} value={dDifficulty} onChange={e => setDDifficulty(e.target.value)}>
              {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <label style={{ ...styles.label, color: t.textMuted }}>bonus XP</label>
            <input style={{ ...styles.input, background: t.pageBg, borderColor: t.border, color: t.text }} type="number" min="0" max="10000" value={dBonus} onChange={e => setDBonus(e.target.value)} />
            <label style={{ ...styles.label, color: t.textMuted }}>active date (optional — defaults to today)</label>
            <input style={{ ...styles.input, background: t.pageBg, borderColor: t.border, color: t.text }} type="date" value={dDate} onChange={e => setDDate(e.target.value)} />
            <button style={{ ...styles.primaryBtn, boxShadow: t.shadow, opacity: dSaving ? 0.6 : 1 }} onClick={handleSetDaily} disabled={dSaving}>
              {dSaving ? 'SAVING...' : '✓ SET DAILY CHALLENGE'}
            </button>
          </div>
        )}

        {/* ---- GLOBAL HISTORY ---- */}
        {tab === 'Global History' && (
          <div style={{ ...styles.panel, background: t.cardBg, borderColor: t.border, boxShadow: t.shadow }}>
            <div style={styles.panelTitle}>{'// global_history (last 50)'}</div>
            {historyLoading ? (
              <div style={{ ...styles.hint, color: t.textMuted }}>{'// loading...'}</div>
            ) : history.length === 0 ? (
              <div style={{ ...styles.hint, color: t.textMuted }}>{'// no_attempts_yet'}</div>
            ) : (
              <div style={styles.historyWrap}>
                <div style={{ ...styles.historyHead, borderBottomColor: t.border, color: t.textMuted }}>
                  <span style={{ flex: 1 }}>user</span>
                  <span style={{ width: '120px' }}>category</span>
                  <span style={{ width: '70px' }}>diff</span>
                  <span style={{ width: '50px', textAlign: 'center' }}>score</span>
                  <span style={{ width: '70px', textAlign: 'right' }}>XP</span>
                </div>
                {history.map((h, i) => (
                  <div key={h._id || i} style={{ ...styles.historyRow, borderBottomColor: t.borderLight }}>
                    <span style={{ flex: 1, color: t.text, fontWeight: 700 }}>{h.user?.username || '?'}</span>
                    <span style={{ width: '120px', color: '#66d9e8' }}>{h.category?.name || '?'}</span>
                    <span style={{ width: '70px', color: t.textMuted }}>{h.difficulty}</span>
                    <span style={{ width: '50px', textAlign: 'center', color: t.green, fontWeight: 700 }}>{h.correctAnswers}/10</span>
                    <span style={{ width: '70px', textAlign: 'right', color: t.yellow }}>+{h.earnedXP}</span>
                  </div>
                ))}
              </div>
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
  themeToggle: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '2px solid #75715e', padding: '6px 10px', cursor: 'pointer' },
  adminTag: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, background: '#fd971f', color: '#272822', border: '2px solid #fd971f', padding: '4px 14px', letterSpacing: '1px' },

  content: { padding: '28px 24px', maxWidth: '900px', margin: '0 auto' },

  tag: { fontSize: '11px', background: '#3e3d32', color: '#75715e', display: 'inline-block', padding: '3px 10px', marginBottom: '10px', letterSpacing: '2px' },
  title: { fontSize: '28px', fontWeight: 700, color: '#f8f8f2', marginBottom: '24px' },
  kw: { color: '#f92672' },
  fn: { color: '#a6e22e' },
  paren: { color: '#f8f8f2' },

  tabsRow: { display: 'flex', flexWrap: 'wrap', gap: '0', marginBottom: '20px', border: '2px solid #75715e', width: 'fit-content' },
  tabBtn: { fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, color: '#75715e', background: 'transparent', border: 'none', borderRight: '2px solid #75715e', padding: '10px 18px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' },
  tabBtnActive: { background: '#fd971f', color: '#272822' },

  flash: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, padding: '10px 14px', border: '2px solid', letterSpacing: '0.5px', marginBottom: '20px' },

  panelGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  panel: { background: '#1e1f1a', border: '3px solid #75715e', padding: '20px', boxShadow: '4px 4px 0 #3e3d32' },
  panelTitle: { fontSize: '12px', color: '#fd971f', letterSpacing: '1px', marginBottom: '16px', fontWeight: 700 },

  label: { display: 'block', fontSize: '10px', color: '#75715e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', marginTop: '12px' },
  input: { width: '100%', boxSizing: 'border-box', background: '#272822', border: '2px solid #75715e', color: '#f8f8f2', fontFamily: "'Space Mono', monospace", fontSize: '12px', padding: '9px 10px', outline: 'none' },
  textarea: { width: '100%', boxSizing: 'border-box', background: '#272822', border: '2px solid #75715e', color: '#f8f8f2', fontFamily: "'Space Mono', monospace", fontSize: '12px', padding: '9px 10px', outline: 'none', resize: 'vertical' },
  select: { width: '100%', boxSizing: 'border-box', background: '#272822', border: '2px solid #75715e', color: '#f8f8f2', fontFamily: "'Space Mono', monospace", fontSize: '12px', padding: '9px 10px', outline: 'none', cursor: 'pointer' },

  toggleRow: { display: 'flex', gap: '8px' },
  toggleBtn: { flex: 1, fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, background: 'transparent', color: '#75715e', border: '2px solid #75715e', padding: '9px', cursor: 'pointer', letterSpacing: '1px' },
  toggleActiveGreen: { background: '#a6e22e', color: '#272822', borderColor: '#a6e22e' },
  toggleActivePink: { background: '#f92672', color: '#f8f8f2', borderColor: '#f92672' },

  colorRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  colorPicker: { width: '48px', height: '36px', background: 'transparent', border: '2px solid #75715e', cursor: 'pointer', padding: '2px' },
  colorHex: { fontFamily: "'Space Mono', monospace", fontSize: '13px', fontWeight: 700 },

  primaryBtn: { width: '100%', marginTop: '20px', fontFamily: "'Space Mono', monospace", fontSize: '13px', fontWeight: 700, background: '#a6e22e', color: '#272822', border: '3px solid #a6e22e', padding: '12px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '2px', boxShadow: '4px 4px 0 #3e3d32' },
  dangerBtn: { width: '100%', marginTop: '20px', fontFamily: "'Space Mono', monospace", fontSize: '13px', fontWeight: 700, background: 'transparent', color: '#f92672', border: '3px solid #f92672', padding: '12px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '2px' },

  hint: { fontSize: '11px', color: '#75715e', fontStyle: 'italic', marginTop: '8px' },

  catList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  catItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', border: '2px solid #3e3d32' },
  catDot: { width: '12px', height: '12px', borderRadius: '50%', flexShrink: 0 },
  catName: { flex: 1, fontSize: '12px', fontWeight: 700, color: '#f8f8f2' },
  catSlug: { fontSize: '10px', color: '#75715e' },

  historyWrap: { display: 'flex', flexDirection: 'column' },
  historyHead: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '2px solid #75715e', fontSize: '9px', color: '#75715e', textTransform: 'uppercase', letterSpacing: '1px' },
  historyRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid #3e3d32', fontSize: '12px' },
};