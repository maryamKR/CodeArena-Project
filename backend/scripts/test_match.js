const io = require('socket.io-client');
const axios = require('axios');

const API_URL = 'http://localhost:5001/api';
const SOCKET_URL = 'http://localhost:5001';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('--- Starting 1v1 Match Test ---\n');

  try {
    // 1. Login Player A
    console.log('Logging in Player A (rookie_dev)...');
    const resA = await axios.post(`${API_URL}/auth/login`, {
      email: 'rookie@example.com',
      password: 'password123'
    });
    const cookieA = resA.headers['set-cookie'][0];
    const userA = resA.data.data;

    // 2. Login Player B
    console.log('Logging in Player B (pro_hacker)...');
    const resB = await axios.post(`${API_URL}/auth/login`, {
      email: 'pro@example.com',
      password: 'password123'
    });
    const cookieB = resB.headers['set-cookie'][0];
    const userB = resB.data.data;

    // 3. Player A sends Challenge to Player B
    console.log('Player A sends Challenge to Player B...');
    const challengeRes = await axios.post(`${API_URL}/challenges`, {
      receiverUsername: 'pro_hacker',
      difficulty: 'Easy',
      message: 'Let us test sockets!'
    }, {
      headers: { Cookie: cookieA }
    });
    const challengeId = challengeRes.data.data.id;
    console.log(`Challenge Created: ${challengeId}`);

    // 4. Player B accepts Challenge
    console.log('Player B accepts Challenge...');
    await axios.put(`${API_URL}/challenges/${challengeId}/accept`, {}, {
      headers: { Cookie: cookieB }
    });
    console.log('Challenge Accepted.');

    // 5. Connect Sockets
    console.log('\nConnecting Sockets...');
    const socketA = io(SOCKET_URL, { extraHeaders: { Cookie: cookieA } });
    const socketB = io(SOCKET_URL, { extraHeaders: { Cookie: cookieB } });

    await new Promise((resolve) => {
      let connected = 0;
      socketA.on('connect', () => { connected++; if(connected === 2) resolve(); });
      socketB.on('connect', () => { connected++; if(connected === 2) resolve(); });
    });
    console.log('Sockets Connected successfully!');

    // 6. Setup Listeners first
    console.log('\nBoth players joining match...');
    socketA.onAny((event, ...args) => {
      console.log(`[Socket A Event] ${event}`, args);
    });
    socketB.onAny((event, ...args) => {
      console.log(`[Socket B Event] ${event}`, args);
    });
    
    socketA.on('match_error', (err) => console.error('SocketA Match Error:', err));
    socketB.on('match_error', (err) => console.error('SocketB Match Error:', err));

    let questions = [];
    const matchReadyPromise = new Promise((resolve) => {
      socketA.on('match_ready', (data) => {
        console.log(`Player A received match_ready with ${data.questions.length} questions.`);
        if (data.questions[0].correct_answer !== undefined) {
          console.error('SECURITY FLAW: correct_answer exposed to client!');
        } else {
          console.log('Security Check Passed: correct_answer is stripped.');
        }
        questions = data.questions;
        resolve();
      });
    });

    // 7. Emit Join Match
    socketA.emit('join_match', { challengeId });
    socketB.emit('join_match', { challengeId });

    // Wait for match_ready
    await matchReadyPromise;

    // 8. Simulate Answering
    console.log('\nSimulating answers...');
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      // Player A answers correctly (we pretend to guess true for test sake, actual correctness evaluated on backend)
      socketA.emit('submit_answer', { challengeId, questionId: q._id, answer: true, timeTakenSec: 2 });
      
      // Player B answers
      socketB.emit('submit_answer', { challengeId, questionId: q._id, answer: false, timeTakenSec: 3 });
      
      await delay(500); // Wait half a second between questions
    }

    socketB.on('opponent_progress', (data) => {
      console.log(`[Player B POV] Opponent Progress: ${data.questionsAnswered}/${data.totalQuestions}`);
    });

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

    // Cleanup
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
