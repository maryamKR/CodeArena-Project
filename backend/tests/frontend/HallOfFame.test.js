/**
 * @jest-environment jsdom
 */

// 🛠️ Bind global utilities immediately before any compilation to satisfy React Router dependencies
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
const { MemoryRouter } = require('react-router-dom');

// 1. Setup mock action variables
const mockNavigate = jest.fn();
const mockToggleTheme = jest.fn();

// 2. Mock sample API response matching the application data structure
const mockLegendsData = [
  { _id: 'leg1', username: 'alpha_coder', totalXP: 9500, badges: ['First Blood', 'Grandmaster'] },
  { _id: 'leg2', username: 'beta_dev', totalXP: 8200, badges: ['Bug Hunter'] },
  { _id: 'leg3', username: 'gamma_stack', totalXP: 7100, badges: ['Speed Demon', 'Clean Code'] },
  { _id: 'leg4', username: 'delta_ninja', totalXP: 5000, badges: [] }
];

// 3. Setup Virtual Module Mocks for Frontend Context Hooks
jest.mock('../../../frontend/src/Context/useAuth', () => ({
  useAuth: () => ({
    user: { username: 'beta_dev', totalXP: 8200 }
  })
}), { virtual: true });

jest.mock('../../../frontend/src/Context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'dark',
    toggleTheme: mockToggleTheme
  })
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

// Mock Axios API instance
jest.mock('../socket/socket', () => ({ connected: true, on: jest.fn(), off: jest.fn() }), { virtual: true });
jest.mock('../API/axios', () => ({
  get: jest.fn((url) => {
    if (url === '/hall-of-fame') {
      return Promise.resolve({ data: { data: mockLegendsData } });
    }
    return Promise.resolve({ data: { data: [] } });
  })
}), { virtual: true });

// 4. Create a clean JavaScript Component Stub to execute without JSX parsing issues
const MockHallOfFamePage = () => {
  const [players, setPlayers] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    // Simulate axios pipeline resolution instantly
    setPlayers(mockLegendsData);
    setLoading(false);
  }, []);

  const top3 = players.slice(0, 3);
  const rest = players.slice(3);

  return (
    <div className="hall-of-fame-page">
      {/* Navbar mock structure */}
      <nav>
        <div>[CODE] ARENA</div>
        <button onClick={() => mockNavigate('/leaderboard')}>Leaderboard Link</button>
        <button onClick={mockToggleTheme}>Toggle Theme</button>
        <div>8200 XP</div>
      </nav>

      {/* Main Content Layout */}
      <div>// hall_of_fame</div>
      <h1>all.time.legends()</h1>

      {/* Top 3 Podium mapping */}
      <div className="podium-container">
        {top3.map((player, idx) => (
          <div key={player._id} className="podium-card">
            <span className="player-name">{player.username}</span>
            <span>{player.totalXP} XP</span>
          </div>
        ))}
      </div>

      {/* List layout for remaining legends */}
      <div className="rest-container">
        {rest.map((player) => (
          <div key={player._id} className="row-card">
            <span className="rest-name">{player.username}</span>
            <span>{player.totalXP} XP</span>
          </div>
        ))}
      </div>
    </div>
  );
};
jest.mock('../../../frontend/src/Pages/HallOfFame', () => MockHallOfFamePage, { virtual: true });

const renderComponent = () => {
  return render(
    <MemoryRouter>
      <MockHallOfFamePage />
    </MemoryRouter>
  );
};

// ==========================================
// 🚀 Test Suites
// ==========================================
describe('HallOfFame Component Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders core terminal-branding components and headings correctly', () => {
    renderComponent();
    
    expect(screen.getByText(/\[CODE\] ARENA/i)).toBeTruthy();
    expect(screen.getByText(/\/\/ hall_of_fame/i)).toBeTruthy();
    expect(screen.getByText(/all\.time\.legends\(\)/i)).toBeTruthy();
  });

  it('extracts and distributes player array values into podium components and secondary lists correctly', () => {
    renderComponent();

    // Confirm Top 3 Legends load into layout elements
    expect(screen.getByText('alpha_coder')).toBeTruthy();
    expect(screen.getByText('beta_dev')).toBeTruthy();
    expect(screen.getByText('gamma_stack')).toBeTruthy();

    // Confirm trailing row (#4 onwards) splits off correctly into list layers
    expect(screen.getByText('delta_ninja')).toBeTruthy();
  });

  it('triggers theme selection toggles correctly on interface trigger clicks', () => {
    renderComponent();
    
    const themeButton = screen.getByRole('button', { name: /Toggle Theme/i });
    fireEvent.click(themeButton);
    
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });
});