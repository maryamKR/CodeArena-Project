const matchmakingService = require('../../services/matchmakingService');
const Challenge = require('../../models/Challenge');

jest.mock('../../models/Challenge');

describe('Matchmaking Service', () => {
  let mockIo;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIo = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
    // Clear the internal queue before each test execution block
    while(matchmakingService.leaveQueue('u1') || matchmakingService.leaveQueue('u2')) {}
  });

  it('joinQueue should put player in queue if no match is available', async () => {
    const user = { _id: 'u1', username: 'player1', rank: 'Gold' };
    const result = await matchmakingService.joinQueue(user, 'socket123', 'Medium', 'cat1', mockIo);
    
    expect(result).not.toHaveProperty('matched');
  });

  it('joinQueue should pair players up when matching parameters hit targets', async () => {
    const user1 = { _id: 'u1', username: 'player1', rank: 'Gold' };
    const user2 = { _id: 'u2', username: 'player2', rank: 'Silver' };

    Challenge.create.mockResolvedValue({ challengeId: 'ch_matched' });

    // Put first user in queue
    await matchmakingService.joinQueue(user1, 'sock1', 'Hard', 'cat1', mockIo);
    // Second user joins matching the exact same configuration criteria
    const result = await matchmakingService.joinQueue(user2, 'sock2', 'Hard', 'cat1', mockIo);

    expect(result.matched).toBe(true);
    expect(result.challengeId).toBe('ch_matched');
    expect(mockIo.to).toHaveBeenCalledWith('sock1');
    expect(mockIo.to).toHaveBeenCalledWith('sock2');
  });
});