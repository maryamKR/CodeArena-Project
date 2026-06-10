export function parseAuthError(error) {
  const status = error?.response?.status;
  const message = error?.response?.data?.message;

  if (status === 429) return 'Too many attempts. Please wait and try again.';
  if (status === 401) return 'Invalid email or password.';
  if (status === 400) return message || 'Username or email already exists.';
  return 'Something went wrong. Please try again.';
}