import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
const path = require('path');

// ─── DYNAMIC DIRECT RESOLUTION (BYPASSES JEST CONFIG) ──────────────────────────
const frontendPath = (subPath) => path.resolve(__dirname, '../../../../frontend/src', subPath);

const Challenge = require(frontendPath('components/Challenge.jsx')).default;
const { useAuth } = require(frontendPath('Context/useAuth.js'));
const socket = require(frontendPath('socket/socket.js')).default;

// 1. Mocking External Contexts & Routes
jest.mock('../../../../frontend/src/Context/useAuth.js', () => ({
  useAuth: jest.fn()
}), { virtual: true });

jest.mock('../../../../frontend/src/socket/socket.js', () => ({
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
}), { virtual: true });

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    useNavigate: jest.fn(),
    useLocation: jest.fn(),
    MemoryRouter: ({ children }) => React.createElement(React.Fragment, null, children),
  };
}, { virtual: true });

// 2. Sample Theme-Compliant Test Data
const mockQuestions = [
  {
    _id: 'q1',
    text: 'const x = () => { return "arena" }; What does x() evaluate to?',
    options: ['"arena"', 'undefined', 'null', 'Error'],
  },
];

describe('// 🎮 CODEARENA: Challenge UI Test Suite', () => {
  let mockNavigate;

  beforeEach(() => {
    jest.useFakeTimers();
    mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);

    // Mock authenticated profile matching the retro arena state
    useAuth.mockReturnValue({
      user: { _id: 'u1', username: 'player_one', rank: 'Beginner' },
    });

    // Mock navigation state entry
    useLocation.mockReturnValue({
      state: {
        category: { name: 'JavaScript', slug: 'js' },
        difficulty: 'Easy',
        challengeId: 'uuid-room-123',
        opponent: { username: 'dark_coder', rank: 'Intermediate' },
      },
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('>> should safely initialize room connection via socket channel', () => {
    render(
      <MemoryRouter>
        <Challenge />
      </MemoryRouter>
    );

    // Assert that the client joins the matching engine channel automatically
    expect(socket.emit).toHaveBeenCalledWith('join_match', {
      challengeId: 'uuid-room-123',
    });
  });

  test('>> should handle real-time question loading event updates', () => {
    render(
      <MemoryRouter>
        <Challenge />
      </MemoryRouter>
    );

    // Retrieve the socket registration listener for incoming questions
    const [eventName, eventCallback] = socket.on.mock.calls.find(
      ([evt]) => evt === 'questions_loaded'
    );

    expect(eventName).toBe('questions_loaded');

    // Simulate questions arriving down the socket stream
    act(() => {
      eventCallback({ questions: mockQuestions });
    });

    // Terminal view text should render the question body properly
    expect(screen.getByText(/What does x\(\) evaluate to\?/i)).toBeInTheDocument();
  });

  test('>> should lock countdown down sequentially on timer_tick events', () => {
    render(
      <MemoryRouter>
        <Challenge />
      </MemoryRouter>
    );

    const [, tickCallback] = socket.on.mock.calls.find(([evt]) => evt === 'timer_tick');

    // Trigger timer value compression down to 4 seconds remaining
    act(() => {
      tickCallback({ timer: 4 });
    });

    const countdownElement = screen.getByText('4');
    expect(countdownElement).toBeInTheDocument();
  });

  test('>> should accurately dispatch results and cleanly navigate away on match closeout', () => {
    render(
      <MemoryRouter>
        <Challenge />
      </MemoryRouter>
    );

    const [, completeCallback] = socket.on.mock.calls.find(([evt]) => evt === 'match_over');

    // Fire simulated score summary compilation from backend match server engine
    act(() => {
      completeCallback({
        winnerId: 'u1',
        forfeit: false,
        results: {
          u1: { correctCount: 8, xpEarned: 160 },
          u2: { correctCount: 5, xpEarned: 100 },
        },
      });
    });

    // Find custom dashboard redirect actions setup inside terminal modal views
    const exitButton = screen.getByRole('button', { name: /dashboard/i });
    fireEvent.click(exitButton);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});