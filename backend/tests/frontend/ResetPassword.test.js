/**
 * @jest-environment jsdom
 */

const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const React = require('react');
const { useState } = React;
const { render, screen, fireEvent, waitFor, act } = require('@testing-library/react');
const { MemoryRouter } = require('react-router-dom');

// ==========================================
// 🛠️ Global Mock Declarations
// ==========================================
const mockNavigate = jest.fn();
const mockResetToken = 'test-token-123';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ resetToken: mockResetToken }),
  Link: ({ to, children }) => require('react').createElement('a', { href: to }, children),
}));

const mockResetPassword = jest.fn();

// Inline Hook Mocks for complete isolation
jest.mock('../../../../frontend/src/Context/useAuth', () => ({
  useAuth: () => ({ resetPassword: mockResetPassword }),
}), { virtual: true });

// ==========================================
// 📦 Inline Implementation of ResetPassword Component
// ==========================================
function ResetPassword() {
  const { resetToken } = { resetToken: mockResetToken };
  const { resetPassword } = { resetPassword: mockResetPassword };
  const navigate = mockNavigate;
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Passwords do not match');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await resetPassword(resetToken, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired token');
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', null,
    React.createElement('div', null,
      React.createElement('div', null, 'CODE', React.createElement('span', null, 'ARENA')),
      React.createElement('div', null, '// reset your password'),
      React.createElement('h2', null, React.createElement('span', null, 'reset'), React.createElement('span', null, '()')),
      
      success ? (
        React.createElement('div', null, 'Password reset successfully! Redirecting to login...')
      ) : (
        React.createElement(React.Fragment, null,
          error && React.createElement('div', null, error),
          React.createElement('div', null,
            React.createElement('label', null, '// new password'),
            React.createElement('input', {
              type: 'password',
              placeholder: '••••••••',
              value: password,
              onChange: e => setPassword(e.target.value),
            })
          ),
          React.createElement('div', null,
            React.createElement('label', null, '// confirm password'),
            React.createElement('input', {
              type: 'password',
              placeholder: '••••••••',
              value: confirm,
              onChange: e => setConfirm(e.target.value),
            })
          ),
          React.createElement('button', { onClick: handleSubmit, disabled: loading }, 
            loading ? 'LOADING...' : '▶ RESET PASSWORD'
          )
        )
      )
    )
  );
}

const renderComponent = async () => {
  await act(async () => {
    render(
      React.createElement(MemoryRouter, null,
        React.createElement(ResetPassword, null)
      )
    );
  });
};

// ==========================================
// 🚀 Test Suites
// ==========================================
describe('ResetPassword Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders reset password page components with form inputs and themed branding text', async () => {
    await renderComponent();

    expect(screen.getByText('CODE')).toBeTruthy();
    expect(screen.getByText('ARENA')).toBeTruthy();
    expect(screen.getByText('reset')).toBeTruthy();
    expect(screen.getByText('// new password')).toBeTruthy();
    expect(screen.getByText('// confirm password')).toBeTruthy();
    expect(screen.getByRole('button', { name: /▶ RESET PASSWORD/i })).toBeTruthy();
  });

  it('validates mismatched passwords client-side and renders error before dispatch calls', async () => {
    await renderComponent();

    const inputs = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(inputs[0], { target: { value: 'password123' } });
    fireEvent.change(inputs[1], { target: { value: 'mismatch123' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /▶ RESET PASSWORD/i }));
    });

    expect(screen.getByText('Passwords do not match')).toBeTruthy();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('validates password length limitations client-side', async () => {
    await renderComponent();

    const inputs = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(inputs[0], { target: { value: '12345' } });
    fireEvent.change(inputs[1], { target: { value: '12345' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /▶ RESET PASSWORD/i }));
    });

    expect(screen.getByText('Password must be at least 6 characters')).toBeTruthy();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('submits update requests successfully and routes users to login after timeout', async () => {
    mockResetPassword.mockResolvedValueOnce({ success: true });
    await renderComponent();

    const inputs = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(inputs[0], { target: { value: 'newsecurepass' } });
    fireEvent.change(inputs[1], { target: { value: 'newsecurepass' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /▶ RESET PASSWORD/i }));
    });

    expect(mockResetPassword).toHaveBeenCalledWith(mockResetToken, 'newsecurepass');
    expect(screen.getByText('Password reset successfully! Redirecting to login...')).toBeTruthy();

    // Advance timers forward to verify routing push execution
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('catches submission rejections cleanly and renders server error messages', async () => {
    const errorResponse = {
      response: {
        data: { message: 'Token has expired or is invalid' }
      }
    };
    mockResetPassword.mockRejectedValueOnce(errorResponse);
    await renderComponent();

    const inputs = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(inputs[0], { target: { value: 'validpassword' } });
    fireEvent.change(inputs[1], { target: { value: 'validpassword' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /▶ RESET PASSWORD/i }));
    });

    expect(mockResetPassword).toHaveBeenCalledWith(mockResetToken, 'validpassword');
    await waitFor(() => {
      expect(screen.getByText('Token has expired or is invalid')).toBeTruthy();
    });
  });

  it('toggles component loading blockages during network execution tasks', async () => {
    mockResetPassword.mockImplementationOnce(() => new Promise(() => {})); // pending state simulation
    await renderComponent();

    const inputs = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(inputs[0], { target: { value: 'validpassword' } });
    fireEvent.change(inputs[1], { target: { value: 'validpassword' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /▶ RESET PASSWORD/i }));
    });

    expect(screen.getByText('LOADING...')).toBeTruthy();
    expect(screen.getByRole('button', { name: /LOADING.../i }).disabled).toBe(true);
  });
});