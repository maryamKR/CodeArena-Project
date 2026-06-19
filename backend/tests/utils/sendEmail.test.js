// Mock the entire Brevo SDK structure chain
const mockSendTransacEmail = jest.fn();

jest.mock('sib-api-v3-sdk', () => {
  return {
    ApiClient: {
      instance: {
        authentications: {
          'api-key': { apiKey: '' }
        }
      }
    },
    TransactionalEmailsApi: jest.fn().mockImplementation(() => {
      return {
        sendTransacEmail: mockSendTransacEmail
      };
    }),
    SendSmtpEmail: jest.fn().mockImplementation(() => {
      return {};
    })
  };
});

const sendEmail = require('../../utils/sendEmail');

describe('SendEmail Utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Silence console logs/errors during this test suite run
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    process.env = {
      ...originalEnv,
      BREVO_API_KEY: 'mock-key',
      BREVO_SENDER_NAME: 'CodeArena Tests',
      BREVO_SENDER_EMAIL: 'test@codearena.com'
    };
  });

  afterEach(() => {
    // Restore the console behavior for subsequent test suites
    console.log.mockRestore();
    console.error.mockRestore();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should successfully deliver an email payload', async () => {
    mockSendTransacEmail.mockResolvedValue({ messageId: '12345' });

    const emailOptions = {
      email: 'user@example.com',
      subject: 'Reset Password',
      message: '<p>Click here</p>'
    };

    const result = await sendEmail(emailOptions);

    expect(mockSendTransacEmail).toHaveBeenCalledTimes(1);
    expect(result.messageId).toBe('12345');
  });

  it('should throw an error with a custom message if delivery fails', async () => {
    mockSendTransacEmail.mockRejectedValue(new Error('API Down'));

    const emailOptions = {
      email: 'fail@example.com',
      subject: 'Test Failure',
      message: 'Test'
    };

    await expect(sendEmail(emailOptions)).rejects.toThrow('Email could not be sent');
  });
});