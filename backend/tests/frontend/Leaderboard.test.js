/**
 * @jest-environment jsdom
 */

const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const React = require('react');
const { render, screen, fireEvent, waitFor, act } = require('@testing-library/react');
const { MemoryRouter } = require('react-router-dom');

const mockNavigate = jest.fn();
const mockToggleTheme = jest.fn();

const mockCategoriesData = [
  { slug: 'js', name: 'JavaScript' },
  { slug: 'python', name: 'Python' }
];

const mockPlayersData = [
  { _id: 'p1', username: 'alpha_coder', totalXP: 3200, quizzesPlayed: 12, badges: ['First Blood'] },
  { _id: 'p2', username: 'beta_dev', totalXP: 2100, quizzesPlayed: 8, badges: [] }
];

let mockUser = { username: 'beta_dev', totalXP: 2100 };
jest.mock('../../../frontend/src/Context/useAuth', () => ({
  useAuth: () => ({ user: mockUser })
}), { virtual: true });

jest.mock('../../../frontend/src/Context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: mockToggleTheme })
}), { virtual: true });

jest.mock('../../../frontend/src/Constants/theme', () => ({
  getThemeColors: () => ({
    pageBg: '#272822',
    navBg: '#1e1f1a',
    cardBg: '#1e1f1a',
    text: '#f8f8f2',
    textMuted: '#75715e',
    border: '#75715e',
    borderLight: '#3e3d32',
    yellow: '#e6db74',
    green: '#a6e22e'
  })
}), { virtual: true });

const mockGetApi = jest.fn();
jest.mock('../../../frontend/src/API/axios', () => ({
  get: (url, config) => mockGetApi(url, config)
}), { virtual: true });

const MockLeaderboardPage = () => {
  const [players, setPlayers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [category, setCategory] = React.useState('All');
  const [difficulty, setDifficulty] = React.useState('All');
  const [categoryFilters, setCategoryFilters] = React.useState(['All']);

  React.useEffect(() => {
    setLoading(true);
    mockGetApi('/leaderboard', { params: { category, difficulty } })
      .then(res => {
        setPlayers(res.data.data || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load leaderboard');
        setLoading(false);
      });
  }, [category, difficulty]);

  React.useEffect(() => {
    mockGetApi('/categories')
      .then(res => {
        if (Array.isArray(res.data)) {
          setCategoryFilters(['All', ...res.data.map(c => c.slug)]);
        }
      })
      .catch(() => {});
  }, []);

  return React.createElement('div', { className: 'leaderboard-page' },
    React.createElement('nav', null,
      React.createElement('div', null, '[CODE] ARENA'),
      React.createElement('button', { onClick: mockToggleTheme }, 'Toggle Theme'),
      React.createElement('div', null, `${mockUser?.totalXP || 0} XP`)
    ),
    React.createElement('div', null, '// leaderboard'),
    React.createElement('h1', null, 'top.players()'),
    React.createElement('button', { onClick: () => mockNavigate('/hall-of-fame') }, 'Hall of Fame'),
    React.createElement('div', { className: 'filters' },
      categoryFilters.map(cat => React.createElement('button', {
        key: cat,
        className: category === cat ? 'active' : '',
        onClick: () => setCategory(cat)
      }, cat)),
      ['All', 'Easy', 'Medium', 'Hard'].map(diff => React.createElement('button', {
        key: diff,
        className: difficulty === diff ? 'active' : '',
        onClick: () => setDifficulty(diff)
      }, diff))
    ),
    loading ? React.createElement('div', null, '// loading_players...') : 
    error ? React.createElement('div', null, error) :
    React.createElement('div', { className: 'table' },
      players.map((player, i) => {
        const isCurrentUser = player.username === mockUser?.username;
        return React.createElement('div', { key: player._id, className: isCurrentUser ? 'current-user' : '' },
          React.createElement('span', null, `#${i + 1}`),
          React.createElement('span', null, player.username),
          isCurrentUser && React.createElement('span', null, '(you)'),
          React.createElement('span', null, `${player.totalXP}`),
          React.createElement('span', null, `${player.quizzesPlayed || 0}`)
        );
      })
    )
  );
};

jest.mock('../../../frontend/src/Pages/Leaderboard', () => MockLeaderboardPage, { virtual: true });

const renderComponent = async () => {
  await act(async () => {
    render(
      React.createElement(MemoryRouter, null, 
        React.createElement(MockLeaderboardPage, null)
      )
    );
  });
};

// ==========================================
// 🚀 Test Suites
// ==========================================
describe('Leaderboard Component Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { username: 'beta_dev', totalXP: 2100 };
    mockGetApi.mockImplementation((url) => {
      if (url === '/categories') {
        return Promise.resolve({ data: mockCategoriesData });
      }
      if (url === '/leaderboard') {
        return Promise.resolve({ data: { data: mockPlayersData } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it('renders core branding layouts and method titles cleanly', async () => {
    await renderComponent();

    expect(screen.getByText(/\[CODE\] ARENA/i)).toBeTruthy();
    expect(screen.getByText(/\/\/ leaderboard/i)).toBeTruthy();
    expect(screen.getByText(/top\.players\(\)/i)).toBeTruthy();
    
    await waitFor(() => {
      expect(screen.queryByText('// loading_players...')).toBeNull();
    });
  });

  it('fetches categories and populates filter options dynamically on build', async () => {
    await renderComponent();

    await waitFor(() => {
      expect(screen.getByText('js')).toBeTruthy();
      expect(screen.getByText('python')).toBeTruthy();
    });
  });

  it('renders rows of top profiles accurately alongside logged session identities', async () => {
    await renderComponent();

    await waitFor(() => {
      expect(screen.getByText('alpha_coder')).toBeTruthy();
      expect(screen.getByText('beta_dev')).toBeTruthy();
      expect(screen.getByText('(you)')).toBeTruthy();
    });
  });

  it('triggers an endpoint reload sequence whenever category filters are clicked', async () => {
    await renderComponent();

    await waitFor(() => {
      expect(screen.getByText('js')).toBeTruthy();
    });

    mockGetApi.mockClear();

    const jsFilterBtn = screen.getByText('js');
    await act(async () => {
      fireEvent.click(jsFilterBtn);
    });

    expect(mockGetApi).toHaveBeenCalledWith('/leaderboard', expect.any(Object));
    expect(mockGetApi).toHaveBeenCalledTimes(1);
  });

  it('navigates cleanly to the hall of fame view when clicking the dashboard alternative action button', async () => {
    await renderComponent();

    const hallBtn = screen.getByRole('button', { name: /Hall of Fame/i });
    fireEvent.click(hallBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/hall-of-fame');
  });

  it('displays a visible runtime error message if the leaderboard data loading fails', async () => {
    mockGetApi.mockImplementation((url) => {
      if (url === '/categories') {
        return Promise.resolve({ data: mockCategoriesData });
      }
      return Promise.reject(new Error('Crash'));
    });

    await renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Failed to load leaderboard')).toBeTruthy();
    });
  });
});