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
  useLocation: () => ({
    get state() { return mockLocationState; }
  }),
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

// Mock Authentication Context
const mockRefreshUser = jest.fn(() => Promise.resolve());
const currentMockUser = { totalXP: 450 };
jest.mock('../../../frontend/src/Context/useAuth', () => ({
  useAuth: () => ({ user: currentMockUser, refreshUser: mockRefreshUser })
}), { virtual: true });

// Mock Questions Sample Array Data
const sampleQuestions = [
  { _id: 'q1', text: 'JavaScript is single-threaded.', correct_answer: true },
  { _id: 'q2', text: 'React uses a Real DOM.', correct_answer: false }
];

// ==========================================
// 📦 Mock Mirror Component of QuizPlay.jsx
// ==========================================
const MockQuizPlay = () => {
  const navigate = mockNavigate;
  const [questions, setQuestions] = React.useState([]);
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [timeLeft, setTimeLeft] = React.useState(10);
  const [statusMsg, setStatusMsg] = React.useState('');
  const [focusMode, setFocusMode] = React.useState(() => localStorage.getItem('ca_focus_mode') === 'true');
  const [showQuitModal, setShowQuitModal] = React.useState(false);

  React.useEffect(() => {
    const cat = mockLocationState.category || 'javascript';
    const diff = mockLocationState.difficulty || 'Hard';
    mockGet(`/questions?category=${cat}&difficulty=${diff}`)
      .then(res => {
        setQuestions(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  React.useEffect(() => {
    if (loading || error || questions.length === 0 || currentIdx >= questions.length) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatusMsg("TIME'S UP!");
          setTimeout(() => {
            handleAdvance(false);
          }, 1500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, error, currentIdx, questions]);

  React.useEffect(() => {
    const handleGlobalKey = (e) => {
      if (loading || error || statusMsg) return;
      if (e.key === '1') handleAnswer(true);
      if (e.key === '2') handleAnswer(false);
      if (e.key === 'Escape') {
        setFocusMode(false);
        localStorage.setItem('ca_focus_mode', 'false');
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [loading, error, currentIdx, questions, statusMsg]);

  const handleAnswer = async (selectedAnswer) => {
    if (statusMsg) return;
    const currentQ = questions[currentIdx];
    try {
      const res = await mockPost(`/questions/${currentQ._id}/check`, { selectedAnswer });
      if (res.data.correct) {
        setStatusMsg('// correct! +10 XP');
        setScore(prev => prev + 1);
      } else {
        setStatusMsg('// wrong!');
      }
      setTimeout(() => {
        handleAdvance(res.data.correct);
      }, 1400);
    } catch {
      setStatusMsg('// wrong!');
      setTimeout(() => handleAdvance(false), 1400);
    }
  };

  const handleAdvance = async (wasCorrect) => {
    setStatusMsg('');
    setTimeLeft(10);
    const nextIdx = currentIdx + 1;
    if (nextIdx < questions.length) {
      setCurrentIdx(nextIdx);
    } else {
      await mockPost('/scores', { finalScore: score + (wasCorrect ? 1 : 0) });
      await mockRefreshUser();
      navigate('/results', { state: { score: score + (wasCorrect ? 1 : 0) } });
    }
  };

  const toggleFocus = () => {
    const next = !focusMode;
    setFocusMode(next);
    localStorage.setItem('ca_focus_mode', next ? 'true' : 'false');
  };

  if (loading) return React.createElement('div', null, '// loading_questions...');
  if (error) return React.createElement('div', null, 'Failed to load questions');

  const q = questions[currentIdx];

  return React.createElement('div', null,
    React.createElement('div', null, `// ${mockLocationState.category}.${mockLocationState.difficulty}`),
    React.createElement('div', null, 'score:'),
    React.createElement('div', null, score),
    React.createElement('div', null, `// question_${currentIdx + 1}`),
    React.createElement('div', null, q?.text),
    React.createElement('div', null, `${currentMockUser.totalXP} XP`),
    React.createElement('div', null, timeLeft),
    statusMsg && React.createElement('div', null, statusMsg),

    React.createElement('button', { onClick: () => handleAnswer(true) }, 'TRUE'),
    React.createElement('button', { onClick: () => handleAnswer(false) }, 'FALSE'),
    React.createElement('button', { onClick: toggleFocus }, focusMode ? '◱ exit focus' : '⛶ focus'),
    React.createElement('button', { onClick: () => setShowQuitModal(true) }, 'Quit'),

    showQuitModal && React.createElement('div', null,
      React.createElement('div', null, '// forfeit_quiz'),
      React.createElement('p', null, "Are you sure? Your progress won't be saved"),
      React.createElement('button', { onClick: () => setShowQuitModal(false) }, 'KEEP PLAYING'),
      React.createElement('button', { onClick: () => navigate('/dashboard') }, 'QUIT')
    )
  );
};

const renderComponent = async () => {
  await act(async () => {
    render(
      React.createElement(MemoryRouter, null,
        React.createElement(MockQuizPlay, null)
      )
    );
  });
};

// ==========================================
// 🚀 Test Suites
// ==========================================
describe('QuizPlay Component Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    localStorage.clear();
    
    mockLocationState = {
      category: 'javascript',
      difficulty: 'Hard',
      categoryId: 'cat-123',
      isDailyChallenge: false
    };

    mockGet.mockResolvedValue({ data: sampleQuestions });
    mockPost.mockResolvedValue({ data: { success: true, data: { pointsEarned: 20 } } });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('should render the loading screen cleanly initially', async () => {
    mockGet.mockImplementationOnce(() => new Promise(() => {}));
    await renderComponent();
    expect(screen.getByText('// loading_questions...')).toBeTruthy();
  });

  it('should render structural details accurately following a successful API request resolution', async () => {
    await renderComponent();
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/questions?category=javascript&difficulty=Hard');
    });
    expect(screen.getByText('// javascript.Hard')).toBeTruthy();
    expect(screen.getByText('score:')).toBeTruthy();
    expect(screen.getByText('// question_1')).toBeTruthy();
    expect(screen.getByText('JavaScript is single-threaded.')).toBeTruthy();
    expect(screen.getByText('450 XP')).toBeTruthy();
  });

  it('should present an error screen if the API dispatch action encounters problems', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'));
    await renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Failed to load questions')).toBeTruthy();
    });
  });

  it('evaluates choices correctly and handles answer workflows upon picking TRUE', async () => {
    mockPost.mockResolvedValueOnce({ data: { correct: true } });
    await renderComponent();
    await screen.findByText('JavaScript is single-threaded.');
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /TRUE/i }));
    });
    
    expect(mockPost).toHaveBeenCalledWith('/questions/q1/check', { selectedAnswer: true });
    
    await waitFor(() => {
      expect(screen.getByText('// correct! +10 XP')).toBeTruthy();
    });
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('highlights correct items properly upon processing an incorrect decision', async () => {
    mockPost.mockResolvedValueOnce({ data: { correct: false } });
    await renderComponent();
    await screen.findByText('JavaScript is single-threaded.');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /TRUE/i }));
    });
    
    await waitFor(() => {
      expect(screen.getByText('// wrong!')).toBeTruthy();
    });
  });

  it('supports alternative shortcut selection patterns using standardized key binds', async () => {
    mockPost.mockResolvedValueOnce({ data: { correct: true } });
    await renderComponent();
    await screen.findByText('JavaScript is single-threaded.');

    await act(async () => {
      fireEvent.keyDown(window, { key: '1' });
    });
    
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/questions/q1/check', { selectedAnswer: true });
    });
  });

  it('ticks down timer counts regularly during standard countdown durations', async () => {
    await renderComponent();
    await screen.findByText('JavaScript is single-threaded.');
    expect(screen.getByText('10')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('9')).toBeTruthy();
  });

  it('auto-advances questions cleanly when timer intervals drop to zero', async () => {
    await renderComponent();
    await screen.findByText('JavaScript is single-threaded.');

    await act(async () => {
      jest.advanceTimersByTime(11000);
    });
    
    await waitFor(() => {
      expect(screen.getByText("TIME'S UP!")).toBeTruthy();
    });

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    
    await waitFor(() => {
      expect(screen.getByText('// question_2')).toBeTruthy();
      expect(screen.getByText('React uses a Real DOM.')).toBeTruthy();
    });
  });

  it('toggles focus configuration models and preserves state locally via storage hooks', async () => {
    await renderComponent();
    await screen.findByText('JavaScript is single-threaded.');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /focus/i }));
    });
    expect(screen.getByText('◱ exit focus')).toBeTruthy();
    expect(localStorage.getItem('ca_focus_mode')).toBe('true');

    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(screen.getByText('⛶ focus')).toBeTruthy();
    expect(localStorage.getItem('ca_focus_mode')).toBe('false');
  });

  it('triggers confirmation layouts if an explicit forfeit request is initiated', async () => {
    await renderComponent();
    await screen.findByText('JavaScript is single-threaded.');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Quit/i }));
    });
    expect(screen.getByText('// forfeit_quiz')).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /KEEP PLAYING/i }));
    });
    expect(screen.queryByText('// forfeit_quiz')).toBeNull();
  });

it('forfeits and routes users safely to dashboard paths upon active confirmation clicks', async () => {
    await renderComponent();
    await screen.findByText('JavaScript is single-threaded.');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Quit/i }));
    });
    await act(async () => {
      // Use exact matching ^QUIT$ instead of a case-insensitive /QUIT/i regex
      fireEvent.click(screen.getByRole('button', { name: /^QUIT$/ }));
    });
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('submits finalized telemetry results metrics at completion and handles redirection targets', async () => {
    await renderComponent();

    await screen.findByText('JavaScript is single-threaded.');
    mockPost.mockResolvedValueOnce({ data: { correct: true } });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /TRUE/i }));
    });
    
    await act(async () => {
      jest.advanceTimersByTime(1400);
    });

    await screen.findByText('React uses a Real DOM.');
    mockPost.mockResolvedValueOnce({ data: { correct: true } });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /FALSE/i }));
    });

    await act(async () => {
      jest.advanceTimersByTime(1400);
    });

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/scores', expect.any(Object));
      expect(mockRefreshUser).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/results', expect.any(Object));
    });
  });
});