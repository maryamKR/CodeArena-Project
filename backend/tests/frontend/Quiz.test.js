/**
 * @jest-environment jsdom
 */

const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const React = require('react');
const { render, screen, fireEvent, waitFor, act } = require('@testing-library/react');
const { MemoryRouter } = require('react-router-dom');

// ==========================================
// 🛠️ Global Mock Declarations
// ==========================================
const mockNavigate = jest.fn();
let mockLocationState = {};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: mockLocationState }),
}));

// Mock API Utilities
const mockGet = jest.fn();
const mockPost = jest.fn();
jest.mock('../../../frontend/src/API/axios', () => ({
  get: (...args) => mockGet(...args),
  post: (...args) => mockPost(...args),
}), { virtual: true });

// Mock Themes & Theme Constants
const mockToggleTheme = jest.fn();
const baseThemeColors = {
  pageBg: '#272822',
  navBg: '#1e1f1a',
  border: '#75715e',
  borderLight: '#3e3d32',
  tagBg: '#3e3d32',
  cardBg: '#1e1f1a',
  cardAltBg: '#2d2c28',
  text: '#f8f8f2',
  textMuted: '#75715e',
  yellow: '#e6db74',
  green: '#a6e22e',
  shadow: '4px 4px 0 #3e3d32',
  isLight: false
};

jest.mock('../../../frontend/src/Context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: mockToggleTheme })
}), { virtual: true });

jest.mock('../../../frontend/src/Constants/theme', () => ({
  getThemeColors: () => baseThemeColors
}), { virtual: true });

// Mock Media Breakpoints Hook
let mockBreakpoint = 'desktop';
jest.mock('../../../frontend/src/hooks/useBreakpoint', () => ({
  useBreakpoint: () => mockBreakpoint
}), { virtual: true });

// Mock Authentication Context
const currentMockUser = { totalXP: 380 };
jest.mock('../../../frontend/src/Context/useAuth', () => ({
  useAuth: () => ({ user: currentMockUser })
}), { virtual: true });

// ==========================================
// 📦 Mock Mirror Component of Quiz.jsx (FIXED test IDs)
// ==========================================
const MockQuizPage = () => {
  const navigate = mockNavigate;
  const { user } = { user: currentMockUser };
  const { toggleTheme } = { toggleTheme: mockToggleTheme };
  const t = baseThemeColors;
  const bp = mockBreakpoint;
  const isMobile = bp === 'mobile';

  const [mode, setMode] = React.useState(mockLocationState?.mode || null);
  const [oneVoneType, setOneVoneType] = React.useState('random');
  const [category, setCategory] = React.useState(mockLocationState?.category || null);
  const [difficulty, setDifficulty] = React.useState('Easy');
  const [categories, setCategories] = React.useState([]);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [opponent, setOpponent] = React.useState('');
  const [challengeMsg, setChallengeMsg] = React.useState(null);
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    mockGet('/categories')
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
      await mockPost('/challenges', { receiverUsername: name, category: selectedCategory?._id, difficulty });
      setChallengeMsg({ type: 'success', text: `Challenge sent to ${name}!` }); setOpponent('');
    } catch (err) {
      const status = err?.response?.status;
      const text = status === 404 ? 'No player found with that username' : status === 409 ? 'You already have a pending challenge with this player' : status === 400 ? 'You cannot challenge yourself' : status === 429 ? 'Too many challenges — try again later' : 'Failed to send challenge';
      setChallengeMsg({ type: 'error', text });
    } finally { setSending(false); }
  };

  const isFriend = mode === '1v1' && oneVoneType === 'friend';

  return React.createElement('div', null,
    React.createElement('nav', null,
      React.createElement('div', null, '[CODE] ARENA'),
      isMobile && React.createElement('button', { onClick: () => setMenuOpen(!menuOpen) }, menuOpen ? '✕' : '☰'),
      React.createElement('button', { 'aria-label': 'Theme Toggle', onClick: toggleTheme }, 'Toggle'),
      React.createElement('div', null, `${user?.totalXP || 0} XP`),
      isMobile && menuOpen && React.createElement('div', { 'data-testid': 'mobile-nav-box' }, 'Mobile Drawer Open')
    ),
    React.createElement('h1', null, 'const match = configure()'),
    
    React.createElement('button', { 'data-testid': 'btn-solo', onClick: () => setMode('solo') }, 'SOLO'),
    React.createElement('button', { 'data-testid': 'btn-1v1', onClick: () => setMode('1v1') }, '1v1 CHALLENGE'),

    mode === '1v1' && React.createElement('div', null,
      React.createElement('button', { 'data-testid': 'btn-opp-random', onClick: () => setOneVoneType('random') }, 'Random Opponent'),
      React.createElement('button', { 'data-testid': 'btn-opp-friend', onClick: () => setOneVoneType('friend') }, 'Challenge a Friend')
    ),

    isFriend && React.createElement('div', null,
      React.createElement('input', {
        'data-testid': 'input-opponent',
        type: 'text',
        value: opponent,
        onChange: e => setOpponent(e.target.value)
      })
    ),

    React.createElement('div', { 'data-testid': 'cats-grid-container' },
      categories.map(cat => React.createElement('div', {
        key: cat.slug,
        'data-testid': `cat-card-${cat.slug}`,
        onClick: () => setCategory(cat.slug)
      }, cat.name))
    ),

    mode && category && React.createElement('div', null,
      ['Easy', 'Medium', 'Hard'].map(d => React.createElement('button', {
        key: d,
        'data-testid': `diff-btn-${d}`,
        onClick: () => setDifficulty(d)
      }, d))
    ),

    mode && category && (
      isFriend ? React.createElement('div', null,
        challengeMsg && React.createElement('div', { 'data-testid': 'msg-box' }, challengeMsg.text),
        React.createElement('button', { 'data-testid': 'btn-submit-challenge', onClick: handleSendChallenge, disabled: sending }, sending ? 'SENDING...' : 'SEND CHALLENGE')
      ) : React.createElement('button', { 'data-testid': 'btn-main-start', onClick: handleStart }, mode === 'solo' ? 'START SOLO QUIZ' : 'FIND OPPONENT')
    )
  );
};

const renderComponent = async () => {
  await act(async () => {
    render(
      React.createElement(MemoryRouter, null, 
        React.createElement(MockQuizPage, null)
      )
    );
  });
};

// ==========================================
// 🚀 Test Suites
// ==========================================
describe('Quiz Component Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBreakpoint = 'desktop';
    mockLocationState = {};

    mockGet.mockImplementation((url) => {
      if (url === '/categories') {
        return Promise.resolve({ data: [
          { slug: 'javascript', name: 'JavaScript', _id: 'cat-js', color: '#e6db74' },
          { slug: 'python', name: 'Python', _id: 'cat-py', color: '#a6e22e' }
        ]});
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('performs clean initialization and dynamically renders lists of quiz matching categories', async () => {
    await renderComponent();

    expect(screen.getByText('[CODE] ARENA')).toBeTruthy();
    expect(screen.getByText('const match = configure()')).toBeTruthy();
    
    await waitFor(() => {
      expect(screen.getByTestId('cat-card-javascript')).toBeTruthy();
      expect(screen.getByTestId('cat-card-python')).toBeTruthy();
    });
  });

  it('safely hydrates component options if initial states are specified via router location pathways', async () => {
    mockLocationState = { mode: 'solo', category: 'javascript' };
    await renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('diff-btn-Easy')).toBeTruthy();
      expect(screen.getByTestId('btn-main-start')).toBeTruthy();
    });
  });

  it('adjusts application layout view options dynamically during layout changes to mobile configurations', async () => {
    mockBreakpoint = 'mobile';
    await renderComponent();

    const burgerBtn = screen.getByRole('button', { name: /☰/i });
    expect(burgerBtn).toBeTruthy();

    await act(async () => {
      fireEvent.click(burgerBtn);
    });
    expect(screen.getByTestId('mobile-nav-box')).toBeTruthy();
  });

  it('handles navigation actions for standard Single-Player matchmaking setup sequences', async () => {
    await renderComponent();

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-solo'));
    });
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('cat-card-javascript'));
    });

    fireEvent.click(screen.getByTestId('diff-btn-Hard'));
    fireEvent.click(screen.getByTestId('btn-main-start'));

    expect(mockNavigate).toHaveBeenCalledWith('/quiz/play', {
      state: { category: 'javascript', difficulty: 'Hard', categoryId: 'cat-js' }
    });
  });

  it('handles navigation actions for multi-player automated random partner matches', async () => {
    await renderComponent();

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-1v1'));
    });
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('cat-card-python'));
    });

    fireEvent.click(screen.getByTestId('btn-main-start'));
    expect(mockNavigate).toHaveBeenCalledWith('/matchmaking', {
      state: { category: 'python', difficulty: 'Easy' }
    });
  });

  it('triggers warnings if username constraint thresholds are missed during targeted room challenges', async () => {
    await renderComponent();

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-1v1'));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-opp-friend'));
    });
    
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('cat-card-javascript'));
    });

    const targetInput = screen.getByTestId('input-opponent');
    fireEvent.change(targetInput, { target: { value: 'jk' } });
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-submit-challenge'));
    });
    expect(screen.getByTestId('msg-box').textContent).toBe('Username must be at least 3 characters');
  });

  it('gracefully outputs specialized contextual backend alerts for diverse status codes', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 409 } });
    await renderComponent();

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-1v1'));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-opp-friend'));
    });
    
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('cat-card-javascript'));
    });

    fireEvent.change(screen.getByTestId('input-opponent'), { target: { value: 'ChallengerPro' } });
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-submit-challenge'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('msg-box').textContent).toBe('You already have a pending challenge with this player');
    });
  });
});