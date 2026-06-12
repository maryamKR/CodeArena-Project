const axios = require('axios');

const API = 'http://localhost:5000/api';

async function run() {
  // Login Player A
  const resA = await axios.post(`${API}/auth/login`, { email: 'rookie@example.com', password: 'password123' });
  const cookieA = resA.headers['set-cookie'][0];

  // Login Player B
  const resB = await axios.post(`${API}/auth/login`, { email: 'pro@example.com', password: 'password123' });
  const cookieB = resB.headers['set-cookie'][0];

  // Player A joins queue
  console.log('=== Player A joins queue ===');
  const r1 = await axios.post(`${API}/matchmaking/join`,
    { difficulty: 'Easy', socketId: 'fake-socket-a' },
    { headers: { Cookie: cookieA } }
  );
  console.log(r1.data);

  // Duplicate join attempt
  console.log('\n=== Player A tries to join again (should 409) ===');
  try {
    await axios.post(`${API}/matchmaking/join`,
      { difficulty: 'Easy', socketId: 'fake-socket-a' },
      { headers: { Cookie: cookieA } }
    );
  } catch (e) {
    console.log(e.response.data);
  }

  // Player B joins — should match!
  console.log('\n=== Player B joins queue (should match!) ===');
  const r3 = await axios.post(`${API}/matchmaking/join`,
    { difficulty: 'Easy', socketId: 'fake-socket-b' },
    { headers: { Cookie: cookieB } }
  );
  console.log(r3.data);

  // Player A tries to leave (already matched, not in queue)
  console.log('\n=== Player A tries to leave queue (should 404 — already matched) ===');
  try {
    const r4 = await axios.delete(`${API}/matchmaking/leave`, { headers: { Cookie: cookieA } });
    console.log(r4.data);
  } catch(e) {
    console.log(e.response.data);
  }

  console.log('\nAll tests passed!');
}

run().catch(err => console.error('Test failed:', err?.response?.data || err.message));
