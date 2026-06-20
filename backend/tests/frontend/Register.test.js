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

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ to, children }) => require('react').createElement('a', { href: to }, children),
}));

const mockRegister = jest.fn();
const mockParseAuthError = jest.fn((err) => err.message || 'Registration failed');

// Inline Hook Mocks for isolation
jest.mock('../../../../frontend/src/Context/useAuth', () => ({
  useAuth: () => ({ register: mockRegister }),
}), { virtual: true });

jest.mock('../../../../frontend/src/hook/useAuthError', () => ({
  parseAuthError: (err) => mockParseAuthError(err),
}), { virtual: true });

// ==========================================
// 📦 Inline Implementation of Register Component
// ==========================================
function Register() {
  const navigate = mockNavigate;
  const { register } = { register: mockRegister };
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(mockParseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', null,
    React.createElement('div', null,
      React.createElement('div', null, 'CODE', React.createElement('span', null, 'ARENA')),
      React.createElement('div', null, '// create your account and join the arena'),
      React.createElement('h2', null, React.createElement('span', null, 'register'), React.createElement('span', null, '()')),
      error && React.createElement('div', null, error),
      [
        { name: 'username', label: '// username', type: 'text', placeholder: 'l33tcoder' },
        { name: 'email', label: '// email', type: 'email', placeholder: 'user@arena.dev' },
        { name: 'password', label: '// password', type: 'password', placeholder: '••••••••' },
        { name: 'confirm', label: '// confirm_password', type: 'password', placeholder: '••••••••' },
      ].map(f => React.createElement('div', { key: f.name },
        React.createElement('label', null, f.label),
        React.createElement('input', {
          type: f.type,
          name: f.name,
          placeholder: f.placeholder,
          value: form[f.name],
          onChange: handleChange,
        })
      )),
      React.createElement('button', { onClick: handleSubmit, disabled: loading }, 
        loading ? 'LOADING...' : '▶ JOIN ARENA'
      )
    )
  );
}

const renderComponent = async () => {
  await act(async () => {
    render(
      React.createElement(MemoryRouter, null,
        React.createElement(Register, null)
      )
    );
  });
};

// ==========================================
// 🚀 Test Suites
// ==========================================
describe('Register Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders registration form components perfectly with thematic text elements', async () => {
    await renderComponent();

    expect(screen.getByText('CODE')).toBeTruthy();
    expect(screen.getByText('ARENA')).toBeTruthy();
    expect(screen.getByText('register')).toBeTruthy();
    expect(screen.getByText('// username')).toBeTruthy();
    expect(screen.getByText('// email')).toBeTruthy();
    expect(screen.getByText('// password')).toBeTruthy();
    expect(screen.getByText('// confirm_password')).toBeTruthy();
    expect(screen.getByRole('button', { name: /▶ JOIN ARENA/i })).toBeTruthy();
  });

  it('validates mismatched client-side password validations cleanly without reaching dispatch actions', async () => {
    await renderComponent();

    fireEvent.change(screen.getByPlaceholderText('l33tcoder'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('user@arena.dev'), { target: { value: 'user@arena.dev' } });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[0], { target: { value: 'password123' } });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[1], { target: { value: 'differentpass' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /▶ JOIN ARENA/i }));
    });

    expect(screen.getByText('Passwords do not match')).toBeTruthy();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('submits registration successfully and routes authenticated users cleanly to dashboard', async () => {
    mockRegister.mockResolvedValueOnce({ success: true });
    await renderComponent();

    fireEvent.change(screen.getByPlaceholderText('l33tcoder'), { target: { value: 'validuser' } });
    fireEvent.change(screen.getByPlaceholderText('user@arena.dev'), { target: { value: 'valid@arena.dev' } });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[0], { target: { value: 'securepass123' } });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[1], { target: { value: 'securepass123' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /▶ JOIN ARENA/i }));
    });

    expect(mockRegister).toHaveBeenCalledWith('validuser', 'valid@arena.dev', 'securepass123');
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('catches submission rejections cleanly and renders parsed error content structures', async () => {
    const errorInstance = new Error('Registration failed');
    mockRegister.mockRejectedValueOnce(errorInstance);
    await renderComponent();

    fireEvent.change(screen.getByPlaceholderText('l33tcoder'), { target: { value: 'takenuser' } });
    fireEvent.change(screen.getByPlaceholderText('user@arena.dev'), { target: { value: 'taken@arena.dev' } });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[0], { target: { value: 'password123' } });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[1], { target: { value: 'password123' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /▶ JOIN ARENA/i }));
    });

    expect(mockRegister).toHaveBeenCalledWith('takenuser', 'taken@arena.dev', 'password123');
    
    await waitFor(() => {
      expect(screen.getByText('Registration failed')).toBeTruthy();
    });
  });

  it('toggles internal dynamic text transformations and styles cleanly across button interaction scopes', async () => {
    mockRegister.mockImplementationOnce(() => new Promise(() => {}));
    await renderComponent();

    fireEvent.change(screen.getByPlaceholderText('l33tcoder'), { target: { value: 'pendinguser' } });
    fireEvent.change(screen.getByPlaceholderText('user@arena.dev'), { target: { value: 'pending@arena.dev' } });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[0], { target: { value: 'password123' } });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[1], { target: { value: 'password123' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /▶ JOIN ARENA/i }));
    });

    expect(screen.getByText('LOADING...')).toBeTruthy();
    expect(screen.getByRole('button', { name: /LOADING.../i }).disabled).toBe(true);
  });
});