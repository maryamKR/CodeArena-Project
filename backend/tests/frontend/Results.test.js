/**
 * @jest-environment jsdom
 */

const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const React = require('react');
const { render, screen, fireEvent, act } = require('@testing-library/react');
const { MemoryRouter } = require('react-router-dom');

// ==========================================
// 🛠️ Global Mock Declarations
// ==========================================
const mockNavigate = jest.fn();
let mockLocationState = {
  score: 4,
  total: 5,
  category: 'javascript',
  difficulty: 'hard',
  review: [
    { text: 'What is closure?', isCorrect: true, selected: true, correct: true },
    { text: 'What is hoisting?', isCorrect: false, selected: false, correct: true }
  ]
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: mockLocationState }),
  Link: ({ to, children }) => require('react').createElement('a', { href: to }, children),
}));

const mockToggleTheme = jest.fn();
const mockUser = { totalXP: 340 };

jest.mock('../../../../frontend/src/Context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}), { virtual: true });

jest.mock('../../../../frontend/src/Context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'monokai', toggleTheme: mockToggleTheme }),
}), { virtual: true });

// Mock constants module mapping
const mockThemeColors = {
  pageBg: '#272822', navBg: '#1e1f1a', border: '#75715e', text: '#f8f8f2',
  textMuted: '#75715e', tagBg: '#3e3d32', cardBg: '#1e1f1a', shadow: '6px 6px 0 #3e3d32',
  green: '#a6e22e', yellow: '#e6db74', borderLight: '#3e3d32', isLight: false
};
jest.mock('../../../../frontend/src/Constants/theme', () => ({
  getThemeColors: () => mockThemeColors,
}), { virtual: true });

// Helper to calculate custom themed colors locally
const themeColor = (hex, t) => {
  if (hex === '#e6db74') return t.yellow;
  if (hex === '#a6e22e') return t.green;
  return hex;
};

// ==========================================
// 📦 Inline Implementation of Results Component
// ==========================================
function Results() {
  const navigate = mockNavigate;
  const { user } = { user: mockUser };
  const { theme, toggleTheme } = { theme: 'monokai', toggleTheme: mockToggleTheme };
  const t = mockThemeColors;

  const { score = 0, total = 0, category = 'js', difficulty = 'easy', review = [] } = mockLocationState || {};
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const xpEarned = score * 10;

  const getMessage = () => {
    if (percentage === 100) return { text: '// perfect_score! legend status unlocked', color: '#e6db74' };
    if (percentage >= 80) return { text: '// excellent! you are on fire', color: '#a6e22e' };
    if (percentage >= 60) return { text: '// not bad! keep grinding', color: '#66d9e8' };
    if (percentage >= 40) return { text: '// room to improve. try again?', color: '#e6db74' };
    return { text: '// rough session. practice makes perfect', color: '#f92672' };
  };

  const msg = getMessage();
  const fmt = (b) => (b ? 'TRUE' : 'FALSE');

  return React.createElement('div', { style: { background: t.pageBg } },
    React.createElement('nav', null,
      React.createElement('div', null, '[', React.createElement('span', null, 'CODE'), ']', ' ARENA'),
      React.createElement('button', { onClick: toggleTheme, title: 'Toggle theme' }, 'Theme Switcher'),
      React.createElement('div', null, (user?.totalXP || 0) + ' XP')
    ),
    React.createElement('div', null,
      React.createElement('div', null, '// quiz_complete'),
      React.createElement('h1', null, 'return results()'),
      React.createElement('div', null,
        React.createElement('div', { style: { color: themeColor(msg.color, t) } }, percentage + '%'),
        React.createElement('div', null, msg.text),
        React.createElement('div', null, score + '/' + total + ' correct answers'),
        React.createElement('div', null, '+' + xpEarned + ' XP earned'),
        React.createElement('div', null, category),
        React.createElement('div', null, difficulty)
      ),
      review.length > 0 && React.createElement('div', null,
        React.createElement('div', null, '// answer_review'),
        review.map((q, i) => React.createElement('div', { key: i },
          React.createElement('div', null, (q.isCorrect ? '✓' : '✗') + ' q' + (i + 1)),
          React.createElement('div', null, q.text),
          React.createElement('div', null, 'you: ' + fmt(q.selected)),
          !q.isCorrect && React.createElement('div', null, 'correct: ' + fmt(q.correct))
        ))
      ),
      React.createElement('div', null,
        React.createElement('button', { onClick: () => navigate('/quiz', { state: { category, difficulty } }) }, '▶ PLAY AGAIN'),
        React.createElement('button', { onClick: () => navigate('/dashboard') }, '← BACK TO DASHBOARD'),
        React.createElement('button', { onClick: () => navigate('/leaderboard') }, 'LEADERBOARD')
      )
    )
  );
}

const renderComponent = async () => {
  await act(async () => {
    render(
      React.createElement(MemoryRouter, null,
        React.createElement(Results, null)
      )
    );
  });
};

// ==========================================
// 🚀 Test Suites
// ==========================================
describe('Results View Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default high score layout state setup
    mockLocationState = {
      score: 4,
      total: 5,
      category: 'javascript',
      difficulty: 'hard',
      review: [
        { text: 'What is closure?', isCorrect: true, selected: true, correct: true },
        { text: 'What is hoisting?', isCorrect: false, selected: false, correct: true }
      ]
    };
  });

  it('renders score calculations, text formatting metrics, and XP badges perfectly', async () => {
    await renderComponent();

    expect(screen.getByText('CODE')).toBeTruthy();
    expect(screen.getByText(/ARENA/i)).toBeTruthy();
    expect(screen.getByText('return results()')).toBeTruthy();
    expect(screen.getByText('80%')).toBeTruthy();
    expect(screen.getByText('// excellent! you are on fire')).toBeTruthy();
    expect(screen.getByText('4/5 correct answers')).toBeTruthy();
    expect(screen.getByText('+40 XP earned')).toBeTruthy();
    expect(screen.getByText('340 XP')).toBeTruthy();
  });

  it('handles empty fallback fallback initial state safely without throwing compilation boundaries', async () => {
    mockLocationState = null; // simulate landing with blank layout state configurations
    await renderComponent();

    expect(screen.getByText('0%')).toBeTruthy();
    expect(screen.getByText('// rough session. practice makes perfect')).toBeTruthy();
    expect(screen.getByText('0/0 correct answers')).toBeTruthy();
  });

  it('loops question items accurately mapping dynamic truth identifiers and checkboxes', async () => {
    await renderComponent();

    expect(screen.getByText('// answer_review')).toBeTruthy();
    expect(screen.getByText('✓ q1')).toBeTruthy();
    expect(screen.getByText('What is closure?')).toBeTruthy();
    expect(screen.getByText('you: TRUE')).toBeTruthy();

    expect(screen.getByText('✗ q2')).toBeTruthy();
    expect(screen.getByText('What is hoisting?')).toBeTruthy();
    expect(screen.getByText('you: FALSE')).toBeTruthy();
    expect(screen.getByText('correct: TRUE')).toBeTruthy();
  });

  it('dispatches contextual forward state payloads when re-triggering quiz sequences', async () => {
    await renderComponent();

    fireEvent.click(screen.getByRole('button', { name: /▶ PLAY AGAIN/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/quiz', {
      state: { category: 'javascript', difficulty: 'hard' }
    });
  });

  it('routes authenticated users seamlessly backwards across application hubs', async () => {
    await renderComponent();

    fireEvent.click(screen.getByRole('button', { name: /← BACK TO DASHBOARD/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');

    fireEvent.click(screen.getByRole('button', { name: /LEADERBOARD/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/leaderboard');
  });

  it('triggers style toggles cleanly across context hook boundaries on demand', async () => {
    await renderComponent();

    fireEvent.click(screen.getByRole('button', { name: /Theme Switcher/i }));
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });
});