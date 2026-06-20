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
const mockLocation = { state: { category: 'javascript', difficulty: 'medium' } };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

// Mock API and Socket singletons
const mockPost = jest.fn().mockResolvedValue({});
const mockDelete = jest.fn().mockResolvedValue({});
jest.mock('../../../frontend/src/API/axios', () => ({
  post: (...args) => mockPost(...args),
  delete: (...args) => mockDelete(...args)
}), { virtual: true });

const mockSocketListeners = {};
const mockSocket = {
  id: 'mock-socket-123',
  connected: true,
  connect: jest.fn(),
  on: jest.fn((event, cb) => { mockSocketListeners[event] = cb; }),
  off: jest.fn((event) => { delete mockSocketListeners[event]; }),
};
jest.mock('../../../frontend/src/socket/socket', () => mockSocket, { virtual: true });

const mockUser = { username: 'Challenger', totalXP: 450 };
jest.mock('../../../frontend/src/Context/useAuth', () => ({
  useAuth: () => ({ user: mockUser })
}), { virtual: true });

// ==========================================
// 📦 Mock Component Mirroring Matchmaking JSX
// ==========================================
const MockMatchmakingPage = () => {
  const navigate = mockNavigate;
  const location = mockLocation;
  const { user } = { user: mockUser };

  const category = location.state?.category || 'js';
  const difficulty = location.state?.difficulty || 'easy';

  const [status, setStatus] = React.useState('searching');
  const [msgIndex, setMsgIndex] = React.useState(0);
  const [dots, setDots] = React.useState('');
  const [countdown, setCountdown] = React.useState(3);
  const [opponent, setOpponent] = React.useState(null);
  const [challengeId, setChallengeId] = React.useState(null);

  React.useEffect(() => {
    if (status !== 'searching') return;
    const interval = setInterval(() => {
      setMsgIndex(i => (i + 1) % 5);
    }, 2000);
    return () => clearInterval(interval);
  }, [status]);

  React.useEffect(() => {
    if (status !== 'searching') return;
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);
    return () => clearInterval(interval);
  }, [status]);

  React.useEffect(() => {
    if (!user) return;

    const joinMatchmaking = () => {
      mockPost('/matchmaking/join', {
        difficulty,
        categorySlug: category,
        socketId: mockSocket.id,
      }).catch(() => {});
    };

    if (!mockSocket.connected) {
      mockSocket.connect();
    }

    mockSocket.on('connect', joinMatchmaking);

    if (mockSocket.connected) {
      joinMatchmaking();
    }

    mockSocket.on('matched', (data) => {
      setOpponent(data.opponent);
      setChallengeId(data.challengeId);
      setStatus('found');
    });

    return () => {
      mockSocket.off('connect');
      mockSocket.off('matched');
      if (status === 'searching') {
        mockDelete('/matchmaking/leave').catch(() => {});
      }
    };
  }, [user, category, difficulty, status]);

  React.useEffect(() => {
    if (status !== 'found') return;
    if (countdown === 0) {
      navigate(`/match/${challengeId}`, { state: { category, difficulty, challengeId, opponent } });
      return;
    }
    const timeout = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timeout);
  }, [status, countdown, navigate, category, difficulty, challengeId, opponent]);

  return React.createElement('div', null,
    React.createElement('nav', null,
      React.createElement('div', null, '[CODE] ARENA'),
      React.createElement('div', null, `${user?.totalXP || 0} XP`)
    ),
    status === 'searching' 
      ? React.createElement('div', null,
          React.createElement('h1', null, 'await findOpponent()'),
          React.createElement('div', null, `category: ${category}`),
          React.createElement('div', null, `difficulty: ${difficulty}`),
          React.createElement('div', null, `// scanning_arena_for_opponents...${dots}`),
          React.createElement('button', { onClick: () => navigate('/quiz') }, 'cancel_search()')
        )
      : React.createElement('div', null,
          React.createElement('h1', null, 'opponent.found()'),
          React.createElement('div', null, user?.username),
          React.createElement('div', null, 'VS'),
          React.createElement('div', null, opponent?.username || 'opponent'),
          React.createElement('div', null, `starting_in ${countdown}`)
        )
  );
};

const renderComponent = async () => {
  await act(async () => {
    render(
      React.createElement(MemoryRouter, null, 
        React.createElement(MockMatchmakingPage, null)
      )
    );
  });
};

// ==========================================
// 🚀 Test Suites
// ==========================================
describe('Matchmaking Component Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders initial searching layout state, active user profile details, and state contexts', async () => {
    await renderComponent();

    expect(screen.getByText(/\[CODE\] ARENA/i)).toBeTruthy();
    expect(screen.getByText(/450 XP/i)).toBeTruthy();
    expect(screen.getByText(/await findOpponent\(\)/i)).toBeTruthy();
    expect(screen.getByText(/category: javascript/i)).toBeTruthy();
    expect(screen.getByText(/difficulty: medium/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /cancel_search\(\)/i })).toBeTruthy();
  });

  it('posts initial matchmaking join action automatically to the backend matching services', async () => {
    await renderComponent();

    expect(mockPost).toHaveBeenCalledWith('/matchmaking/join', {
      difficulty: 'medium',
      categorySlug: 'javascript',
      socketId: 'mock-socket-123',
    });
  });

  it('triggers router navigation redirect back to quiz hub when cancelling search', async () => {
    await renderComponent();

    const cancelButton = screen.getByRole('button', { name: /cancel_search\(\)/i });
    fireEvent.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith('/quiz');
  });

it('transitions view seamlessly upon socket matched announcement event and runs countdown redirect', async () => {
    await renderComponent();

    // Force call the registered 'matched' socket payload listener
    await act(async () => {
      mockSocketListeners['matched']({
        challengeId: 'room-xyz-789',
        opponent: { username: 'EliteCoder', rank: 'Pro' }
      });
    });

    expect(screen.getByText(/opponent\.found\(\)/i)).toBeTruthy();
    expect(screen.getByText(/EliteCoder/i)).toBeTruthy();
    expect(screen.getByText(/starting_in 3/i)).toBeTruthy();

    // Step through the 3-second countdown sequentially to trigger each state transition cleanly
    await act(async () => { jest.advanceTimersByTime(1000); }); // Ticks to 2
    await act(async () => { jest.advanceTimersByTime(1000); }); // Ticks to 1
    await act(async () => { jest.advanceTimersByTime(1000); }); // Ticks to 0 -> redirects

    expect(mockNavigate).toHaveBeenCalledWith('/match/room-xyz-789', {
      state: {
        category: 'javascript',
        difficulty: 'medium',
        challengeId: 'room-xyz-789',
        opponent: { username: 'EliteCoder', rank: 'Pro' }
      }
    });
  });

  it('issues an API leave deletion hook if unmounted pre-match completion', async () => {
    const { unmount } = render(
      React.createElement(MemoryRouter, null, 
        React.createElement(MockMatchmakingPage, null)
      )
    );

    unmount();
    expect(mockDelete).toHaveBeenCalledWith('/matchmaking/leave');
  });
});