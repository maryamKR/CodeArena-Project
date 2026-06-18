import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import api from '../api/axios';

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
  const [tab, setTab] = useState('Questions');
  const [categories, setCategories] = useState([]);
  const [msg, setMsg] = useState(null); // { type, text }

  // Questions form
  const [qText, setQText] = useState('');
  const [qAnswer, setQAnswer] = useState(true);
  const [qCategory, setQCategory] = useState('');
  const [qDifficulty, setQDifficulty] = useState('Easy');
  const [qSaving, setQSaving] = useState(false);
  const [deleteId, setDeleteId] = useState('');

  // Category form
  const [cName, setCName] = useState('');
  const [cSlug, setCSlug] = useState('');
  const [cColor, setCColor] = useState('#a6e22e');
  const [cSaving, setCSaving] = useState(false);

  // Daily challenge form
  const [dCategory, setDCategory] = useState('');
  const [dDifficulty, setDDifficulty] = useState('Easy');
  const [dBonus, setDBonus] = useState(50);
  const [dDate, setDDate] = useState('');
  const [dSaving, setDSaving] = useState(false);

  // Global history
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    api.get('/categories')
      .then(res => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCategories([]));
  }, []);

  // load global history when that tab opens
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
                ...(i === NAV_LINKS.length - 1 ? { borderRight: '2px solid #75715e' } : {}),
                cursor: 'pointer',
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
        <div style={styles.adminTag}>⚙ ADMIN</div>
      </nav>

      <div style={styles.content}>

        {/* Header */}
        <div style={styles.tag}>{'// admin_panel'}</div>
        <h1 style={styles.title}>
          <span style={styles.kw}>sudo</span>{' '}
          <span style={styles.fn}>manage</span>
          <span style={styles.paren}>()</span>
        </h1>

        {/* Tabs */}
        <div style={styles.tabsRow}>
          {TABS.map((t) => (
            <button
              key={t}
              style={{ ...styles.tabBtn, ...(tab === t ? styles.tabBtnActive : {}) }}
              onClick={() => { setTab(t); setMsg(null); }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Flash message */}
        {msg && (
          <div style={{
            ...styles.flash,
            color: msg.type === 'success' ? '#a6e22e' : '#f92672',
            borderColor: msg.type === 'success' ? '#a6e22e' : '#f92672',
          }}>
            {msg.type === 'success' ? '// ' : '// error: '}{msg.text}
          </div>
        )}

        {/* ---- QUESTIONS ---- */}
        {tab === 'Questions' && (
          <div style={styles.panelGrid}>
            <div style={styles.panel}>
              <div style={styles.panelTitle}>{'// add_question'}</div>
              <label style={styles.label}>question text</label>
              <textarea
                style={styles.textarea}
                rows={3}
                placeholder="Is JavaScript single-threaded?"
                value={qText}
                onChange={e => setQText(e.target.value)}
              />
              <label style={styles.label}>correct answer</label>
              <div style={styles.toggleRow}>
                <button
                  style={{ ...styles.toggleBtn, ...(qAnswer === true ? styles.toggleActiveGreen : {}) }}
                  onClick={() => setQAnswer(true)}
                >TRUE</button>
                <button
                  style={{ ...styles.toggleBtn, ...(qAnswer === false ? styles.toggleActivePink : {}) }}
                  onClick={() => setQAnswer(false)}
                >FALSE</button>
              </div>
              <label style={styles.label}>category</label>
              <select style={styles.select} value={qCategory} onChange={e => setQCategory(e.target.value)}>
                <option value="">select category</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <label style={styles.label}>difficulty</label>
              <select style={styles.select} value={qDifficulty} onChange={e => setQDifficulty(e.target.value)}>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <button style={{ ...styles.primaryBtn, opacity: qSaving ? 0.6 : 1 }} onClick={handleAddQuestion} disabled={qSaving}>
                {qSaving ? 'SAVING...' : '+ ADD QUESTION'}
              </button>
            </div>

            <div style={styles.panel}>
              <div style={styles.panelTitle}>{'// delete_question'}</div>
              <label style={styles.label}>question ID</label>
              <input
                style={styles.input}
                type="text"
                placeholder="60d5ecb8b392d700153c3c12"
                value={deleteId}
                onChange={e => setDeleteId(e.target.value)}
              />
              <div style={styles.hint}>{'// paste the _id of the question to remove'}</div>
              <button style={styles.dangerBtn} onClick={handleDeleteQuestion}>
                ✕ DELETE QUESTION
              </button>
            </div>
          </div>
        )}

        {/* ---- CATEGORIES ---- */}
        {tab === 'Categories' && (
          <div style={styles.panelGrid}>
            <div style={styles.panel}>
              <div style={styles.panelTitle}>{'// add_category'}</div>
              <label style={styles.label}>name</label>
              <input style={styles.input} type="text" placeholder="Frontend" value={cName} onChange={e => setCName(e.target.value)} />
              <label style={styles.label}>slug</label>
              <input style={styles.input} type="text" placeholder="frontend" value={cSlug} onChange={e => setCSlug(e.target.value)} />
              <label style={styles.label}>color</label>
              <div style={styles.colorRow}>
                <input style={styles.colorPicker} type="color" value={cColor} onChange={e => setCColor(e.target.value)} />
                <span style={{ ...styles.colorHex, color: cColor }}>{cColor}</span>
              </div>
              <button style={{ ...styles.primaryBtn, opacity: cSaving ? 0.6 : 1 }} onClick={handleAddCategory} disabled={cSaving}>
                {cSaving ? 'SAVING...' : '+ ADD CATEGORY'}
              </button>
            </div>

            <div style={styles.panel}>
              <div style={styles.panelTitle}>{'// existing_categories'}</div>
              <div style={styles.catList}>
                {categories.length === 0 ? (
                  <div style={styles.hint}>{'// none yet'}</div>
                ) : categories.map(c => (
                  <div key={c._id} style={styles.catItem}>
                    <span style={{ ...styles.catDot, background: c.color || '#75715e' }} />
                    <span style={styles.catName}>{c.name}</span>
                    <span style={styles.catSlug}>{c.slug}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---- DAILY CHALLENGE ---- */}
        {tab === 'Daily Challenge' && (
          <div style={styles.panel}>
            <div style={styles.panelTitle}>{'// set_daily_challenge'}</div>
            <label style={styles.label}>category</label>
            <select style={styles.select} value={dCategory} onChange={e => setDCategory(e.target.value)}>
              <option value="">select category</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <label style={styles.label}>difficulty</label>
            <select style={styles.select} value={dDifficulty} onChange={e => setDDifficulty(e.target.value)}>
              {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <label style={styles.label}>bonus XP</label>
            <input style={styles.input} type="number" min="0" max="10000" value={dBonus} onChange={e => setDBonus(e.target.value)} />
            <label style={styles.label}>active date (optional — defaults to today)</label>
            <input style={styles.input} type="date" value={dDate} onChange={e => setDDate(e.target.value)} />
            <button style={{ ...styles.primaryBtn, opacity: dSaving ? 0.6 : 1 }} onClick={handleSetDaily} disabled={dSaving}>
              {dSaving ? 'SAVING...' : '✓ SET DAILY CHALLENGE'}
            </button>
          </div>
        )}

        {/* ---- GLOBAL HISTORY ---- */}
        {tab === 'Global History' && (
          <div style={styles.panel}>
            <div style={styles.panelTitle}>{'// global_history (last 50)'}</div>
            {historyLoading ? (
              <div style={styles.hint}>{'// loading...'}</div>
            ) : history.length === 0 ? (
              <div style={styles.hint}>{'// no_attempts_yet'}</div>
            ) : (
              <div style={styles.historyWrap}>
                <div style={styles.historyHead}>
                  <span style={{ flex: 1 }}>user</span>
                  <span style={{ width: '120px' }}>category</span>
                  <span style={{ width: '70px' }}>diff</span>
                  <span style={{ width: '50px', textAlign: 'center' }}>score</span>
                  <span style={{ width: '70px', textAlign: 'right' }}>XP</span>
                </div>
                {history.map((h, i) => (
                  <div key={h._id || i} style={styles.historyRow}>
                    <span style={{ flex: 1, color: '#f8f8f2', fontWeight: 700 }}>{h.user?.username || '?'}</span>
                    <span style={{ width: '120px', color: '#66d9e8' }}>{h.category?.name || '?'}</span>
                    <span style={{ width: '70px', color: '#75715e' }}>{h.difficulty}</span>
                    <span style={{ width: '50px', textAlign: 'center', color: '#a6e22e', fontWeight: 700 }}>{h.correctAnswers}/10</span>
                    <span style={{ width: '70px', textAlign: 'right', color: '#e6db74' }}>+{h.earnedXP}</span>
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