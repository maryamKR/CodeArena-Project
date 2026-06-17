const matchService = require('../../services/matchService');
const Challenge = require('../../models/Challenge');

jest.mock('../../models/Challenge');
jest.mock('../../models/Question');
jest.mock('../../models/User');

describe('Match Service Lobby Phase', () => {
  let mockSocket, mockIo;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket = { emit: jest.fn(), join: jest.fn() };
    mockIo = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
  });

  it('joinMatch should emit match_error if the structural challenge instance cannot be resolved', async () => {
    Challenge.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

    await matchService.joinMatch('ch123', 'u1', mockSocket, mockIo);
    expect(mockSocket.emit).toHaveBeenCalledWith('match_error', { message: 'Challenge not found' });
  });
});