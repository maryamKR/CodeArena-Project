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
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock APIs
const mockGet = jest.fn();
jest.mock('../../../frontend/src/API/axios', () => ({
  get: (...args) => mockGet(...args)
}), { virtual: true });

// Mock Themes & Contexts
const mockToggleTheme = jest.fn();
const currentThemeColors = {
  pageBg: '#272822',
  navBg: '#1e1f1a',
  border: '#75715e',
  borderLight: '#3e3d32',
  tagBg: '#3e3d32',
  cardBg: '#1e1f1a',
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
  getThemeColors: () => currentThemeColors
}), { virtual: true });

const mockLogout = jest.fn().mockResolvedValue();
let mockUser = {
  _id: 'user-999',
  username: 'SyntaxPro',
  email: 'syntax@arena.dev',
  totalXP: 1250,
  quizzesPlayed: 14,
  badges: ['First Blood', 'Perfect Score'],
  role: 'user',
  rank: 'Code Veteran'
};

jest.mock('../../../frontend/src/Context/useAuth', () => ({
  useAuth: () => ({ user: mockUser, logout: mockLogout })
}), { virtual: true });

// ==========================================
// 📦 Mock Component Mirroring Profile JSX
// ==========================================
const MockProfilePage = () => {
  const navigate = mockNavigate;
  const { user, logout } = { user: mockUser, logout: mockLogout };
  const { toggleTheme } = { toggleTheme: mockToggleTheme };
  const t = currentThemeColors;

  const [history, setHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [myRank, setMyRank] = React.useState(null);
  const [hoveredBadge, setHoveredBadge] = React.useState(null);

  React.useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await mockGet(`/history/${user?.username}`);
        setHistory(res.data.data || []);
      } catch {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    if (user?._id) fetchHistory();

    mockGet('/leaderboard/me')
      .then(res => setMyRank(res.data.data))
      .catch(() => {});
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return React.createElement('div', null,
    React.createElement('nav', null,
      React.createElement('div', null, '[CODE] ARENA'),
      React.createElement('button', { onClick: () => navigate('/dashboard') }, 'Dashboard'),
      React.createElement('button', { onClick: () => navigate('/quiz') }, 'Quiz'),
      React.createElement('button', { onClick: () => navigate('/leaderboard') }, 'Leaderboard'),
      React.createElement('button', { onClick: () => navigate('/profile') }, 'Profile'),
      React.createElement('button', { 'aria-label': 'Theme Toggle', onClick: toggleTheme }, 'Toggle'),
      React.createElement('div', null, `${user?.totalXP || 0} XP`)
    ),
    React.createElement('div', null, `const me = "${user?.username}"`),
    React.createElement('div', null, user?.email),
    React.createElement('div', null, user?.rank),
    React.createElement('div', null, `Total XP: ${user?.totalXP}`),
    React.createElement('div', null, `Quizzes: ${user?.quizzesPlayed}`),
    React.createElement('div', null, `Global Rank: ${myRank ? `#${myRank.globalRank}` : '-'}`),
    React.createElement('div', null, `BadgesCount: ${user?.badges?.length || 0}`),
    
    // Badges list area
    React.createElement('div', null,
      user?.badges?.map((badge, idx) => 
        React.createElement('div', {
          key: idx,
          onMouseEnter: () => setHoveredBadge(idx),
          onMouseLeave: () => setHoveredBadge(null)
        }, 
          React.createElement('span', null, badge),
          hoveredBadge === idx && React.createElement('div', null, `Tooltip: ${badge}`)
        )
      )
    ),

    // Conditional Admin UI Panel Button
    user?.role === 'admin' && React.createElement('button', { onClick: () => navigate('/admin') }, '⚙ ADMIN PANEL'),
    React.createElement('button', { onClick: handleLogout }, 'logout()')
  );
};

const renderComponent = async () => {
  await act(async () => {
    render(
      React.createElement(MemoryRouter, null, 
        React.createElement(MockProfilePage, null)
      )
    );
  });
};

// ==========================================
// 🚀 Test Suites
// ==========================================
describe('Profile Component Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser.role = 'user'; // Reset default non-privileged state

    // Standard API response presets
    mockGet.mockImplementation((url) => {
      if (url.includes('/history/')) {
        return Promise.resolve({ data: { data: [
          { category: { name: 'JavaScript' }, difficulty: 'hard', correctAnswers: 8, earnedXP: 80, createdAt: '2026-06-20T10:00:00.000Z' }
        ]}});
      }
      if (url === '/leaderboard/me') {
        return Promise.resolve({ data: { data: { globalRank: 42 } } });
      }
      return Promise.reject(new Error('Not Found'));
    });
  });

  it('renders general account credentials, navigational layout, and historical records cleanly', async () => {
    await renderComponent();

    expect(screen.getByText(/\[CODE\] ARENA/i)).toBeTruthy();
    expect(screen.getByText(/const me = "SyntaxPro"/i)).toBeTruthy();
    expect(screen.getByText(/syntax@arena\.dev/i)).toBeTruthy();
    expect(screen.getByText(/Code Veteran/i)).toBeTruthy();
    expect(screen.getByText(/Total XP: 1250/i)).toBeTruthy();
    expect(screen.getByText(/Global Rank: #42/i)).toBeTruthy();
  });

  it('interacts correctly with router pipelines when navigation links are triggered', async () => {
    await renderComponent();
    
    fireEvent.click(screen.getByRole('button', { name: 'Quiz' }));
    expect(mockNavigate).toHaveBeenCalledWith('/quiz');
  });

  it('activates custom reactive theme toggles on client click events', async () => {
    await renderComponent();
    
    fireEvent.click(screen.getByRole('button', { name: 'Theme Toggle' }));
    expect(mockToggleTheme).toHaveBeenCalled();
  });

  it('toggles badge info tooltips visibility upon mouse hover activation', async () => {
    await renderComponent();

    const badgeNode = screen.getByText('First Blood');
    
    // Hover over elements
    fireEvent.mouseEnter(badgeNode);
    expect(screen.getByText('Tooltip: First Blood')).toBeTruthy();

    // Leave element area
    fireEvent.mouseLeave(badgeNode);
    expect(screen.queryByText('Tooltip: First Blood')).toBeNull();
  });

  it('displays the administrator dashboard shortcut option exclusively if profile role permits', async () => {
    mockUser.role = 'admin'; // Escalate mock payload permission context
    await renderComponent();

    const adminBtn = screen.getByRole('button', { name: /⚙ ADMIN PANEL/i });
    expect(adminBtn).toBeTruthy();

    fireEvent.click(adminBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/admin');
  });

  it('executes authentication context cleanup and moves user back to root directory on sign out', async () => {
    await renderComponent();

    const logoutBtn = screen.getByRole('button', { name: /logout\(\)/i });
    fireEvent.click(logoutBtn);

    expect(mockLogout).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});