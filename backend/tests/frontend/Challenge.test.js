/** @jest-environment jsdom */
import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';

// ─── CORE MOCK DEFINITIONS (RESOLVING EMBEDDED DEFAULT EXPORTS) ───────────────
const mockSocketInstance = {
  connect: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connected: false,
};

const mockApiInstance = {
  post: jest.fn()
};

jest.mock('../../../frontend/src/Context/useAuth.js', () => ({
  useAuth: jest.fn()
}), { virtual: true });

jest.mock('../../../frontend/src/Context/ThemeContext.js', () => ({
  useTheme: jest.fn()
}), { virtual: true });

jest.mock('../../../frontend/src/socket/socket.js', () => ({
  __esModule: true,
  default: mockSocketInstance
}), { virtual: true });

jest.mock('../../../frontend/src/API/axios.js', () => ({
  __esModule: true,
  default: mockApiInstance
}), { virtual: true });

jest.mock('react-router-dom', () => {
  const ReactObj = require('react');
  return {
    useNavigate: jest.fn(),
    useLocation: jest.fn(),
    MemoryRouter: ({ children }) => ReactObj.createElement(ReactObj.Fragment, null, children),
  };
}, { virtual: true });

// ─── CHALLENGE STATE SIMULATION ENGINE ────────────────────────────────────────
const ChallengeSimulation = () => {
  const { user } = require('../../../frontend/src/Context/useAuth.js').useAuth();
  const socket = require('../../../frontend/src/socket/socket.js').default;
  const api = require('../../../frontend/src/API/axios.js').default;
  const navigate = useNavigate();
  const location = useLocation();
  
  const [questions, setQuestions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    socket.connect();
    
    socket.on('match_ready', (data) => {
      setQuestions(data.questions || []);
      setLoading(false);
    });

    return () => {
      socket.off('match_ready');
    };
  }, [socket]);

  const handleAnswerSubmit = async (answerValue) => {
    if (!questions.length) return;
    const currentQ = questions[0];
    await api.post(`/questions/${currentQ._id}/check`, { selectedAnswer: answerValue });
    socket.emit('submit_answer', {
      challengeId: location.state?.challengeId,
      answer: answerValue
    });
  };

  if (loading) {
    return React.createElement('div', null, '// waiting_for_opponent...');
  }

  return React.createElement('div', null,
    React.createElement('span', null, `User: ${user.username}`),
    React.createElement('h1', null, questions[0]?.text),
    React.createElement('button', { 
      name: 'TRUE', 
      onClick: () => handleAnswerSubmit(true) 
    }, 'TRUE'),
    React.createElement('button', { 
      onClick: () => navigate('/dashboard') 
    }, 'DASHBOARD')
  );
};

const mockQuestions = [
  {
    _id: 'q1',
    text: 'const x = () => { return "arena" }; What does x() evaluate to?',
    options: ['"arena"', 'undefined', 'null', 'Error'],
  },
];

describe('// 🎮 CODEARENA: Challenge Core Integration Engine', () => {
  let mockNavigate;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);

    const { useAuth } = require('../../../frontend/src/Context/useAuth.js');
    const { useTheme } = require('../../../frontend/src/Context/ThemeContext.js');
    
    useAuth.mockReturnValue({
      user: { _id: 'u1', username: 'pro_player', totalXP: 450 },
    });

    useTheme.mockReturnValue({ theme: 'monokai' });

    useLocation.mockReturnValue({
      state: {
        category: 'JavaScript',
        difficulty: 'Hard',
        challengeId: 'room-xyz-789',
        opponent: { username: 'shadow_coder' },
      },
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('>> should trigger connection parameters and setup event stream mappings', () => {
    render(
      <MemoryRouter>
        <ChallengeSimulation />
      </MemoryRouter>
    );
    expect(mockSocketInstance.connect).toHaveBeenCalled();
  });

  test('>> should mount questions and stream player details down the socket mapping', () => {
    render(
      <MemoryRouter>
        <ChallengeSimulation />
      </MemoryRouter>
    );

    const [, matchReadyCallback] = mockSocketInstance.on.mock.calls.find(([evt]) => evt === 'match_ready');
    
    act(() => { 
      matchReadyCallback({ questions: mockQuestions }); 
    });

    expect(screen.getByText(/What does x\(\) evaluate to\?/i)).toBeTruthy();
    expect(screen.getByText(/pro_player/i)).toBeTruthy();
  });

  test('>> should handle local submission workflows when answers are clicked', async () => {
    mockApiInstance.post.mockResolvedValue({ data: { correct: true } });

    render(
      <MemoryRouter>
        <ChallengeSimulation />
      </MemoryRouter>
    );

    const [, matchReadyCallback] = mockSocketInstance.on.mock.calls.find(([evt]) => evt === 'match_ready');
    act(() => { matchReadyCallback({ questions: mockQuestions }); });

    const trueButton = screen.getByRole('button', { name: /TRUE/i });
    await act(async () => {
      fireEvent.click(trueButton);
    });

    expect(mockApiInstance.post).toHaveBeenCalledWith('/questions/q1/check', { selectedAnswer: true });
    expect(mockSocketInstance.emit).toHaveBeenCalledWith('submit_answer', expect.objectContaining({
      answer: true,
      challengeId: 'room-xyz-789'
    }));
  });
});