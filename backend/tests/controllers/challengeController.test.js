const challengeController = require('../../controllers/challengeController');
const challengeService = require('../../services/challengeService');

jest.mock('../../services/challengeService');

describe('Challenge Controller', () => {
  let req, res, next, mockIo;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIo = { toUser: jest.fn().mockReturnThis(), emit: jest.fn() };
    req = {
      user: { _id: 'u1', username: 'sender', rank: 'Gold' },
      validated: { body: {}, params: {} },
      app: { get: jest.fn().mockReturnValue(mockIo) }
    };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('sendChallenge should create challenge and emit real-time event', async () => {
    req.validated.body = { receiverUsername: 'target', category: 'Math', difficulty: 'Easy' };
    challengeService.sendChallenge.mockResolvedValue({
      challenge: { id: 'c1', receiver: { _id: 'u2' }, category: 'Math' },
      receiverUsername: 'target'
    });

    await challengeController.sendChallenge(req, res, next);
    expect(mockIo.toUser).toHaveBeenCalledWith('u2');
    expect(mockIo.emit).toHaveBeenCalledWith('challenge_received', expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('acceptChallenge should process confirmation', async () => {
    req.validated.params = { id: 'c1' };
    challengeService.acceptChallenge.mockResolvedValue({ id: 'c1', sender: { _id: 'u1' } });

    await challengeController.acceptChallenge(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('declineChallenge should decline successfully', async () => {
    req.validated.params = { id: 'c1' };
    challengeService.declineChallenge.mockResolvedValue({ id: 'c1', sender: { _id: 'u1' } });

    await challengeController.declineChallenge(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getPendingChallenges should retrieve active items', async () => {
    challengeService.getPendingChallenges.mockResolvedValue([{}, {}]);
    await challengeController.getPendingChallenges(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ count: 2 }));
  });
});