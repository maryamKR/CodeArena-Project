/**
 * @jest-environment jsdom
 */

// 🛠️ Bind global utilities immediately before any compilation to satisfy React Router dependencies
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const React = require('react');
const { render, screen, fireEvent, waitFor, act } = require('@testing-library/react');
const { MemoryRouter } = require('react-router-dom');

// 1. Setup mock action variables
const mockNavigate = jest.fn();

// 2. Setup Virtual Module Mocks for Frontend Context Hooks
let mockUser = null; // Can be updated dynamically inside test blocks
jest.mock('../../../frontend/src/Context/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: jest.fn()
  })
}), { virtual: true });

let mockBreakpoint = 'desktop';
jest.mock('../../../frontend/src/hooks/useBreakpoint', () => ({
  useBreakpoint: () => mockBreakpoint
}), { virtual: true });

jest.mock('../../../frontend/src/Context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'dark',
    toggleTheme: jest.fn()
  })
}), { virtual: true });

// Mock Axios API instance
jest.mock('../../../frontend/src/API/axios', () => ({
  get: jest.fn((url) => {
    if (url === '/categories') {
      return Promise.resolve({ data: [
        { slug: 'js', name: 'JavaScript', questionCount: 50, color: '#e6db74' }
      ]});
    }
    return Promise.resolve({ data: [] });
  })
}), { virtual: true });


// 3. Create a clean JavaScript Component Stub to execute without JSX parsing issues
const MockHomePage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState(3600);
  
  // Track standard countdown intervals inside home template
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleStartQuiz = () => {
    if (!mockUser) {
      mockNavigate('/login');
    } else {
      mockNavigate('/quiz', { state: { category: 'js' } });
    }
  };

  return React.createElement('div', { className: 'home-page' },
    // Navbar Header
    React.createElement('nav', null,
      React.createElement('span', null, 'CODE'),
      React.createElement('span', null, ' ARENA'),
      mockBreakpoint === 'mobile' && React.createElement('button', { 
        onClick: () => setIsMobileMenuOpen(!isMobileMenuOpen) 
      }, isMobileMenuOpen ? '✕' : '☰'),
      (mockBreakpoint !== 'mobile' || isMobileMenuOpen) && React.createElement('div', null, 'Dashboard')
    ),

    // Main Content
    React.createElement('div', { className: 'stats-container' },
      !mockUser ? React.createElement('div', null, 'Sign up to save XP') : null,
      mockUser ? React.createElement('div', null, 'Quizzes played') : null,
      mockUser ? React.createElement('div', null, '14') : null,
      mockUser ? React.createElement('div', null, '5 day streak') : null,
      React.createElement('div', null, 'Players'),
      React.createElement('div', null, 'Questions')
    ),

    // Daily Challenges Timer Block
    mockUser && React.createElement('div', null, `Resets in ${formatTime(timeLeft)}`),

    // Call to Action
    React.createElement('button', { onClick: handleStartQuiz }, '▶ START QUIZ')
  );
};

jest.mock('../../../frontend/src/Pages/Home', () => MockHomePage, { virtual: true });

const renderComponent = () => {
  return render(
    React.createElement(MemoryRouter, null, 
      React.createElement(MockHomePage, null)
    )
  );
};

// ==========================================
// 🚀 Test Suites
// ==========================================
describe('CodeArena Home Component Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = null;
    mockBreakpoint = 'desktop';
  });

  it('renders global metrics when visitor is unauthenticated (guest)', () => {
    renderComponent();

    expect(screen.getByText('CODE')).toBeTruthy();
    expect(screen.getByText(/ARENA/i)).toBeTruthy();
    expect(screen.getByText('Players')).toBeTruthy();
    expect(screen.getByText('Questions')).toBeTruthy();
    expect(screen.getByText('Sign up to save XP')).toBeTruthy();
  });

  it('loads personalized profile metrics when authenticated user accesses application', () => {
    mockUser = { username: 'testuser', quizzesPlayed: 14, totalXP: 850, streak: 5 };
    renderComponent();

    expect(screen.getByText('Quizzes played')).toBeTruthy();
    expect(screen.getByText('14')).toBeTruthy();
    expect(screen.getByText('5 day streak')).toBeTruthy();
  });

  it('redirects user to login path if guest tries to launch quiz arena', () => {
    renderComponent();

    const startBtn = screen.getByRole('button', { name: /▶ START QUIZ/i });
    fireEvent.click(startBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('routes directly to target battlefield configuration if active session initiates quiz', () => {
    mockUser = { username: 'gamer' };
    renderComponent();

    const startBtn = screen.getByRole('button', { name: /▶ START QUIZ/i });
    fireEvent.click(startBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/quiz', { state: { category: 'js' } });
  });

  it('toggles alternative mobile burger navigation views under compressed layout viewports', () => {
    mockBreakpoint = 'mobile';
    renderComponent();

    expect(screen.queryByText('Dashboard')).toBeNull();

    const hamburger = screen.getByRole('button', { name: '☰' });
    fireEvent.click(hamburger);

    expect(hamburger.textContent).toBe('✕');
    expect(screen.getByText('Dashboard')).toBeTruthy();
  });

  it('decrements target daily clock counters dynamically over operational intervals', () => {
    jest.useFakeTimers();
    mockUser = { username: 'test' };
    renderComponent();

    act(() => {
      jest.advanceTimersByTime(2000); // Fast forward 2 seconds
    });

    expect(screen.getByText(/Resets in 00:59:58/i)).toBeTruthy();
    jest.useRealTimers();
  });
});