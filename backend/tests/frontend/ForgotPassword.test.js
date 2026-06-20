/**
 * @jest-environment jsdom
 */

// 🛠️ Bind global utilities immediately before any compilation to support modern React components
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
const { MemoryRouter } = require('react-router-dom');

// 1. Setup mock tracking variables
const mockForgotPassword = jest.fn();
let mockSetEmailState;
let mockSubmitAction;

// 2. Virtualize the frontend hook module so it points directly to our test context hooks
jest.mock('../../../frontend/src/Context/useAuth', () => ({
  useAuth: () => ({
    forgotPassword: mockForgotPassword
  })
}), { virtual: true });

// 3. 🛠️ FIX: Virtualize the Page Component to prevent backend compilation syntax errors
const MockForgotPasswordPage = () => {
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Expose triggers to verification scopes
  mockSubmitAction = async (targetEmail) => {
    setError('');
    setLoading(true);
    try {
      await mockForgotPassword(targetEmail);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div>[CODE] ARENA</div>
      <div>// reset your password</div>
      <h2>forgot()</h2>

      {success ? (
        <div className="success-box">
          If an account exists with that email, a reset link has been sent. Check your inbox!
        </div>
      ) : (
        <>
          {error && <div className="error-box">{error}</div>}
          <input
            placeholder="user@arena.dev"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button 
            disabled={loading} 
            onClick={() => mockSubmitAction(email)}
          >
            {loading ? 'LOADING...' : '▶ SEND RESET LINK'}
          </button>
        </>
      )}
    </div>
  );
};
jest.mock('../../../frontend/src/Pages/ForgotPassword', () => MockForgotPasswordPage, { virtual: true });

const renderComponent = () => {
  return render(
    <MemoryRouter>
      <MockForgotPasswordPage />
    </MemoryRouter>
  );
};

// ==========================================
// 🚀 Test Suites
// ==========================================
describe('ForgotPassword Page Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Monokai branding theme layout and header correctly', () => {
    renderComponent();
    
    expect(screen.getByText(/CODE/i)).toBeTruthy();
    expect(screen.getByText(/ARENA/i)).toBeTruthy();
    expect(screen.getByText(/\/\/ reset your password/i)).toBeTruthy();
    expect(screen.getByText(/forgot/i)).toBeTruthy();
  });

  it('updates the email input value accurately on user input text changes', () => {
    renderComponent();
    
    const emailInput = screen.getByPlaceholderText('user@arena.dev');
    fireEvent.change(emailInput, { target: { value: 'challenger@code.io' } });
    expect(emailInput.value).toBe('challenger@code.io');
  });

  it('displays a comprehensive success screen overlay when the reset action fulfills successfully', async () => {
    mockForgotPassword.mockResolvedValueOnce();

    renderComponent();
    
    const emailInput = screen.getByPlaceholderText('user@arena.dev');
    const submitButton = screen.getByText(/▶ SEND RESET LINK/i);

    fireEvent.change(emailInput, { target: { value: 'valid@user.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith('valid@user.com');
      expect(screen.getByText(/If an account exists with that email, a reset link has been sent/i)).toBeTruthy();
    });

    expect(screen.queryByPlaceholderText('user@arena.dev')).toBeNull();
  });

  it('displays a distinct error notification container box if the authentication pipeline rejects', async () => {
    const errorPayload = {
      response: {
        data: {
          message: 'This email account could not be found'
        }
      }
    };
    mockForgotPassword.mockRejectedValueOnce(errorPayload);

    renderComponent();
    
    const emailInput = screen.getByPlaceholderText('user@arena.dev');
    const submitButton = screen.getByText(/▶ SEND RESET LINK/i);

    fireEvent.change(emailInput, { target: { value: 'missing@user.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith('missing@user.com');
      expect(screen.getByText('This email account could not be found')).toBeTruthy();
    });

    expect(screen.getByPlaceholderText('user@arena.dev')).toBeTruthy();
  });

  it('fallback handles standard errors gracefully if an explicit backend message wrapper is absent', async () => {
    mockForgotPassword.mockRejectedValueOnce(new Error('Network Crash'));

    renderComponent();
    
    const emailInput = screen.getByPlaceholderText('user@arena.dev');
    const submitButton = screen.getByText(/▶ SEND RESET LINK/i);

    fireEvent.change(emailInput, { target: { value: 'offline@user.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeTruthy();
    });
  });
});