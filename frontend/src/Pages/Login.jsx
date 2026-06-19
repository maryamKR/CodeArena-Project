import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../Context/useAuth';
import { parseAuthError } from '../hook/useAuthError';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Logo */}
        <div style={styles.logo}>
          <span style={styles.bracket}>[</span>
          <span style={styles.logoName}>CODE</span>
          <span style={styles.bracket}>]</span>
          {' '}ARENA
        </div>

        <div style={styles.tagline}>{'// authenticate to enter the arena'}</div>

        <h2 style={styles.title}>
          <span style={styles.kw}>login</span>
          <span style={styles.paren}>()</span>
        </h2>

        {error && <div style={styles.errorBox}>{error}</div>}

        {/* Email */}
        <div style={styles.field}>
          <label style={styles.label}>{'// email'}</label>
          <input
            style={styles.input}
            type="email"
            name="email"
            placeholder="user@arena.dev"
            value={form.email}
            onChange={handleChange}
            onFocus={e => e.target.style.borderColor = '#a6e22e'}
            onBlur={e => e.target.style.borderColor = '#75715e'}
          />
        </div>

        {/* Password */}
        <div style={styles.field}>
          <label style={styles.label}>{'// password'}</label>
          <input
            style={styles.input}
            type="password"
            name="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            onFocus={e => e.target.style.borderColor = '#a6e22e'}
            onBlur={e => e.target.style.borderColor = '#75715e'}
          />
        </div>

        {/* Forgot password */}
        <div style={{ textAlign: 'right', marginBottom: '20px' }}>
          <Link to="/forgot-password" style={styles.forgotLink}>forgot_password()?</Link>
        </div>

        {/* Submit */}
        <button
          style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          onClick={handleSubmit}
          disabled={loading}
          onMouseEnter={e => e.currentTarget.style.background = '#8dca25'}
          onMouseLeave={e => e.currentTarget.style.background = '#a6e22e'}
        >
          {loading ? 'LOADING...' : '▶ ENTER ARENA'}
        </button>

        {/* Register link */}
        <div style={styles.bottomLink}>
          <span style={{ color: '#75715e' }}>{'// no account? '}</span>
          <Link to="/register" style={styles.registerLink}>register()</Link>
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#272822', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Mono', monospace", padding: '24px' },

  card: { background: '#1e1f1a', border: '3px solid #75715e', padding: '40px', width: '100%', maxWidth: '440px', boxShadow: '6px 6px 0 #3e3d32' },

  logo: { fontFamily: "'Space Mono', monospace", fontSize: '20px', fontWeight: 700, color: '#f8f8f2', letterSpacing: '-1px', marginBottom: '8px' },
  bracket: { color: '#f92672' },
  logoName: { background: '#a6e22e', color: '#272822', padding: '0 5px' },

  tagline: { fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#75715e', marginBottom: '28px', letterSpacing: '1px' },

  title: { fontFamily: "'Space Mono', monospace", fontSize: '28px', fontWeight: 700, color: '#f8f8f2', marginBottom: '24px', borderLeft: '4px solid #f92672', paddingLeft: '12px' },
  kw: { color: '#66d9e8' },
  paren: { color: '#f8f8f2' },

  errorBox: { background: 'rgba(249,38,114,0.15)', border: '2px solid #f92672', color: '#f92672', padding: '10px 14px', fontFamily: "'Space Mono', monospace", fontSize: '12px', marginBottom: '20px' },

  field: { marginBottom: '20px' },
  label: { display: 'block', fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#75715e', marginBottom: '8px', letterSpacing: '1px' },
  input: { width: '100%', background: '#272822', border: '2px solid #75715e', color: '#f8f8f2', fontFamily: "'Space Mono', monospace", fontSize: '13px', padding: '10px 14px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' },

  forgotLink: { fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#e6db74', textDecoration: 'none' },

  submitBtn: { width: '100%', background: '#a6e22e', color: '#272822', border: '3px solid #a6e22e', fontFamily: "'Space Mono', monospace", fontSize: '13px', fontWeight: 700, padding: '12px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '2px', boxShadow: '4px 4px 0 #3e3d32', transition: 'background 0.15s', marginBottom: '20px' },

  bottomLink: { textAlign: 'center', fontFamily: "'Space Mono', monospace", fontSize: '12px' },
  registerLink: { color: '#a6e22e', textDecoration: 'none', marginLeft: '4px' },
};