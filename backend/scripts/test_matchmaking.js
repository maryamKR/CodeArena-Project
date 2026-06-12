const io = require('socket.io-client');
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('--- Starting Random Matchmaking Queue E2E Test ---\n');

  try {
    // 1. Login Player A
    console.log('Logging in Player A...');
    const resA = await axios.post(`${API_URL}/auth/login`, { email: 'rookie@example.com', password: 'password123' });
    const cookieA = resA.headers['set-cookie'][0];

    // 2. Login Player B
    console.log('Logging in Player B...');
    const resB = await axios.post(`${API_URL}/auth/login`, { email: 'pro@example.com', password: 'password123' });
    const cookieB = resB.headers['set-cookie'][0];

    // 3. Connect Sockets FIRST so we get socket.id
    console.log('\nConnecting Sockets...');
    const socketA = io(SOCKET_URL, { extraHeaders: { Cookie: cookieA } });
    const socketB = io(SOCKET_URL, { extraHeaders: { Cookie: cookieB } });

    await new Promise((resolve) => {
      let connected = 0;
      socketA.on('connect', () => { connected++; if(connected === 2) resolve(); });
      socketB.on('connect', () => { connected++; if(connected === 2) resolve(); });
    });
    console.log(`Sockets Connected successfully!`);

    // Setup listeners for the matched event
    const matchedPromise = new Promise((resolve) => {
      let matchesReceived = 0;
      let sharedChallengeId = null;
      const onMatched = (data) => {
        sharedChallengeId = data.challengeId;
        matchesReceived++;
        if (matchesReceived === 2) resolve(sharedChallengeId);
      };
      socketA.on('matched', onMatched);
      socketB.on('matched', onMatched);
    });

    // 4. Player A Joins Queue
    console.log('\nPlayer A joining matchmaking queue...');
    const q1 = await axios.post(`${API_URL}/matchmaking/join`, { difficulty: 'Easy', socketId: socketA.id }, { headers: { Cookie: cookieA } });
    console.log('Player A Status:', q1.data.status); // Should be 'queued'

    // 5. Player B Joins Queue (Should auto-match)
    console.log('Player B joining matchmaking queue...');
    const q2 = await axios.post(`${API_URL}/matchmaking/join`, { difficulty: 'Easy', socketId: socketB.id }, { headers: { Cookie: cookieB } });
    console.log('Player B Status:', q2.data.status); // Should be 'matched'

    // 6. Wait for sockets to receive "matched" event
    console.log('Waiting for both sockets to receive "matched" event...');
    const challengeId = await matchedPromise;
    console.log(`[Socket] MATCHED! Challenge ID: ${challengeId}`);

    // 7. Sockets emit join_match
    let questions = [];
    const matchReadyPromise = new Promise((resolve) => {
      socketA.on('match_ready', (data) => {
        console.log(`\nPlayer A received match_ready with ${data.questions.length} random questions.`);
        questions = data.questions;
        resolve();
      });
    });

    console.log('Both players routing to match lobby (emitting join_match)...');
    socketA.emit('join_match', { challengeId });
    socketB.emit('join_match', { challengeId });

    await matchReadyPromise;

    // 8. Simulate Answering
    console.log('\nSimulating answers...');
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      socketA.emit('submit_answer', { challengeId, questionId: q._id, answer: true, timeTakenSec: 2 });
      socketB.emit('submit_answer', { challengeId, questionId: q._id, answer: false, timeTakenSec: 3 });
      await delay(200); 
    }

    // 9. Wait for match_over
    console.log('\nWaiting for match to end...');
    await new Promise((resolve) => {
      socketA.on('match_over', (data) => {
        console.log('\n--- MATCH OVER ---');
        console.log(`Winner ID: ${data.winnerId}`);
        console.log('Results:', JSON.stringify(data.results, null, 2));
        resolve();
      });
    });

    socketA.disconnect();
    socketB.disconnect();
    console.log('\nTest Completed Successfully.');
    process.exit(0);

  } catch (error) {
    console.error('Test Failed:', error?.response?.data || error.message);
    process.exit(1);
  }
}

runTest();
