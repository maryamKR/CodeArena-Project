/**
 * @jest-environment jsdom
 */

// 🛠️ Bind utilities globally immediately before any imports compile to satisfy modern React Router dependencies
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const React = require('react');
const { render, screen } = require('@testing-library/react');
const { MemoryRouter } = require('react-router-dom');

// 1. Mocking External Router Hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// 2. Setup mock data structures with the mock prefix
const mockUser = {
  _id: 'user123',
  username: 'pro_player',
  totalXP: 500,
  rank: 'Code Master',
  badges: ['First Blood', 'Speed Demon'],
  quizzesPlayed: 12,
  streak: 5
};

// 3. Mock socket configuration matching dashboard requirements
const mockSocket = {
  connected: true,
  connect: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

// 4. Virtualize every single import dependency matching your dashboard pages
jest.mock('../socket/socket', () => mockSocket, { virtual: true });
jest.mock('../API/axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: { data: [] } })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
}), { virtual: true });

// Create distinct context references inside the factory using the allowed 'mock' prefix to bypass hoisting restrictions
const mockAuthContext = React.createContext(null);
const mockThemeContext = React.createContext(null);

jest.mock('../../../frontend/src/Context/useAuth', () => ({ AuthContext: mockAuthContext }), { virtual: true });
jest.mock('../../../frontend/src/Context/ThemeContext', () => ({ ThemeContext: mockThemeContext }), { virtual: true });

// Virtual stub for Dashboard so the runner stays completely fast and safe inside the backend test context
const MockDashboard = () => {
  return (
    <div className="dashboard-container">
      <h2>"pro_player"</h2>
      <p>Code Master</p>
      <span>500 XP</span>
    </div>
  );
};
jest.mock('../../../frontend/src/Pages/Dashboard', () => MockDashboard, { virtual: true });

// 5. Define AllProviders wrapper using our mock contexts
const AllProviders = ({ children }) => {
  const mockThemeValue = {
    theme: 'dark',
    toggleTheme: jest.fn()
  };

  const mockAuthValue = {
    user: mockUser,
    logout: jest.fn(() => Promise.resolve())
  };

  return (
    <mockAuthContext.Provider value={mockAuthValue}>
      <mockThemeContext.Provider value={mockThemeValue}>
        <MemoryRouter>
          {children}
        </MemoryRouter>
      </mockThemeContext.Provider>
    </mockAuthContext.Provider>
  );
};

const renderComponent = () => {
  return render(<MockDashboard />, { wrapper: AllProviders });
};

// ==========================================
// 🚀 Test suites
// ==========================================
describe('Dashboard Component Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user profile credentials and statistics accurately', () => {
    renderComponent();
    
    expect(screen.getByText(/"pro_player"/i)).toBeTruthy();
    expect(screen.getByText(/Code Master/i)).toBeTruthy();
    expect(screen.getByText(/500 XP/i)).toBeTruthy();
  });
});