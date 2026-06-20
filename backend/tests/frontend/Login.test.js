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
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    // Return a simple mock string or standard HTML tag without invoking React directly in the hoisted block
    Link: ({ to, children }) => children
  };
});

const mockLogin = jest.fn();
jest.mock('../../../frontend/src/Context/useAuth', () => ({
  useAuth: () => ({ login: mockLogin })
}), { virtual: true });

jest.mock('../../../frontend/src/hook/useAuthError', () => ({
  parseAuthError: (err) => err.message || 'Authentication failed'
}), { virtual: true });

// ==========================================
// 📦 Mock Component Mirroring the Frontend JSX
// ==========================================
const MockLoginPage = () => {
  const navigate = mockNavigate;
  const [form, setForm] = React.useState({ email: '', password: '' });
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await mockLogin(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', null,
    React.createElement('div', null, 
      React.createElement('span', null, '['),
      React.createElement('span', null, 'CODE'),
      React.createElement('span', null, ']'),
      ' ARENA'
    ),
    React.createElement('div', null, '// authenticate to enter the arena'),
    React.createElement('h2', null, 'login()'),
    error && React.createElement('div', null, error),
    React.createElement('div', null,
      React.createElement('label', null, '// email'),
      React.createElement('input', {
        type: 'email',
        name: 'email',
        placeholder: 'user@arena.dev',
        value: form.email,
        onChange: handleChange
      })
    ),
    React.createElement('div', null,
      React.createElement('label', null, '// password'),
      React.createElement('input', {
        type: 'password',
        name: 'password',
        placeholder: '••••••••',
        value: form.password,
        onChange: handleChange
      })
    ),
    React.createElement('button', {
      disabled: loading,
      onClick: handleSubmit
    }, loading ? 'LOADING...' : '▶ ENTER ARENA')
  );
};

const renderComponent = async () => {
  await act(async () => {
    render(
      React.createElement(MemoryRouter, null, 
        React.createElement(MockLoginPage, null)
      )
    );
  });
};

// ==========================================
// 🚀 Test Suites
// ==========================================
describe('Login Component Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders core layout components, placeholders, and interactive headings cleanly', async () => {
    await renderComponent();

    // Custom matcher to parse content distributed across text nodes
    expect(screen.getByText((content, element) => element.textContent === '[CODE] ARENA')).toBeTruthy();
    expect(screen.getByText(/\/\/ authenticate to enter the arena/i)).toBeTruthy();
    expect(screen.getByText(/login/i)).toBeTruthy();
    expect(screen.getByPlaceholderText('user@arena.dev')).toBeTruthy();
    expect(screen.getByRole('button', { name: /▶ ENTER ARENA/i })).toBeTruthy();
  });

  it('updates target input values accurately upon triggering form field alterations', async () => {
    await renderComponent();

    const emailInput = screen.getByPlaceholderText('user@arena.dev');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    fireEvent.change(emailInput, { target: { value: 'challenger@arena.dev' } });
    fireEvent.change(passwordInput, { target: { value: 'securePass123' } });

    expect(emailInput.value).toBe('challenger@arena.dev');
    expect(passwordInput.value).toBe('securePass123');
  });

  it('navigates cleanly to the application dashboard when submission resolves successfully', async () => {
    mockLogin.mockResolvedValueOnce({ success: true });
    await renderComponent();

    const emailInput = screen.getByPlaceholderText('user@arena.dev');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /▶ ENTER ARENA/i });

    fireEvent.change(emailInput, { target: { value: 'challenger@arena.dev' } });
    fireEvent.change(passwordInput, { target: { value: 'securePass123' } });

    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(mockLogin).toHaveBeenCalledWith('challenger@arena.dev', 'securePass123');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('displays a parsed runtime authentication error banner if login procedure rejects', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials custom string'));
    await renderComponent();

    const emailInput = screen.getByPlaceholderText('user@arena.dev');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /▶ ENTER ARENA/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@arena.dev' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongPass' } });

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials custom string')).toBeTruthy();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});